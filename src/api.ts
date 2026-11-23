import { TokenEndpointOptions, TokenEndpointResponse } from './global';
import {
  DEFAULT_AUTH0_CLIENT,
  DEFAULT_AUDIENCE,
  DEFAULT_FETCH_TIMEOUT_MS
} from './constants';

/**
 * @ignore
 * Internal options for the revokeToken API call.
 * Kept in api.ts (not global.ts) so it is not part of the public type surface.
 */
interface RevokeTokenOptions {
  baseUrl: string;
  /** Maps directly to the OAuth `client_id` parameter. */
  client_id: string;
  /** Tokens to revoke. Empty for the worker path — the worker holds its own store. */
  refreshTokens: string[];
  audience?: string;
  timeout?: number;
  auth0Client?: any;
  useFormData?: boolean;
  /** Worker path only: revoke every RT in the worker store, not just the audience's. */
  useMrrt?: boolean;
  onRefreshTokenRevoked?: (refreshToken: string) => Promise<void> | void;
  /** Worker path only: called with how many RTs the worker revoked before a request failed. */
  onRevokeFailed?: (revokedCount: number) => void;
}
import * as dpopUtils from './dpop/utils';
import { GenericError } from './errors';
import { getJSON, fetchWithTimeout, createAbortController } from './http';
import { sendMessage } from './worker/worker.utils';
import { createQueryParams, stripAuth0Client } from './utils';

export async function oauthToken(
  {
    baseUrl,
    timeout,
    audience,
    scope,
    auth0Client,
    useFormData,
    useMrrt,
    dpop,
    preserveRefreshToken,
    ...options
  }: TokenEndpointOptions,
  worker?: Worker,
  skipTokenStorage?: boolean
) {
  const isTokenExchange =
    options.grant_type === 'urn:ietf:params:oauth:grant-type:token-exchange';

  const isWebAuthn =
    options.grant_type === 'urn:okta:params:oauth:grant-type:webauthn';

  const refreshWithMrrt = options.grant_type === 'refresh_token' && useMrrt;

  const includeAudienceAndScope = isTokenExchange || isWebAuthn || refreshWithMrrt;

  const allParams = {
    ...options,
    ...(includeAudienceAndScope && audience && { audience }),
    ...(includeAudienceAndScope && scope && { scope }),
  };

  // WebAuthn grant must use JSON so authn_response is sent as an object, not a string.
  const useJson = isWebAuthn || !useFormData;

  const body = useJson
    ? JSON.stringify(allParams)
    : createQueryParams(allParams);

  const isDpopSupported = dpopUtils.isGrantTypeSupported(options.grant_type);

  return await getJSON<TokenEndpointResponse>(
    `${baseUrl}/oauth/token`,
    timeout,
    audience || DEFAULT_AUDIENCE,
    scope,
    {
      method: 'POST',
      body,
      headers: {
        'Content-Type': useJson
          ? 'application/json'
          : 'application/x-www-form-urlencoded',
        'Auth0-Client': btoa(
          JSON.stringify(stripAuth0Client(auth0Client || DEFAULT_AUTH0_CLIENT))
        )
      }
    },
    worker,
    useFormData,
    useMrrt,
    isDpopSupported ? dpop : undefined,
    undefined,
    skipTokenStorage,
    preserveRefreshToken
  );
}

/** Resolves with `promise`'s value, or with `undefined` after `ms` milliseconds. */
const resolveWithin = <T>(
  promise: Promise<T>,
  ms: number
): Promise<T | undefined> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return Promise.race([
    promise,
    new Promise<undefined>(resolve => {
      timeoutId = setTimeout(() => resolve(undefined), ms);
    })
  ]).finally(() => clearTimeout(timeoutId));
};

/**
 * Revokes refresh tokens using the /oauth/revoke endpoint.
 *
 * Mirrors the oauthToken pattern: the worker/non-worker dispatch lives here,
 * keeping Auth0Client free of transport concerns.
 *
 * - Worker path: sends a single message; the worker holds its own RT store and
 *   loops internally. refreshTokens is empty (worker ignores it).
 * - Non-worker path: loops over refreshTokens and issues one request per token.
 *
 * @throws {GenericError} If any revoke request fails
 */
export async function revokeToken(
  {
    baseUrl,
    timeout,
    auth0Client,
    useFormData,
    refreshTokens,
    audience,
    client_id,
    useMrrt,
    onRefreshTokenRevoked,
    onRevokeFailed
  }: RevokeTokenOptions,
  worker?: Worker
): Promise<void> {
  const resolvedTimeout = timeout || DEFAULT_FETCH_TIMEOUT_MS;
  // token_type_hint is a SHOULD per RFC 7009 §2.1; used in both paths below.
  const token_type_hint = 'refresh_token' as const;
  const fetchUrl = `${baseUrl}/oauth/revoke`;
  const headers = {
    'Content-Type': useFormData
      ? 'application/x-www-form-urlencoded'
      : 'application/json',
    'Auth0-Client': btoa(
      JSON.stringify(stripAuth0Client(auth0Client || DEFAULT_AUTH0_CLIENT))
    )
  };

  if (worker) {
    // Worker holds its own RT store and injects each token into the request.
    // Send the base body (without token) so the worker can loop over its tokens.
    const baseParams = { client_id, token_type_hint };
    const body = useFormData
      ? createQueryParams(baseParams)
      : JSON.stringify(baseParams);

    try {
      return await sendMessage(
        {
          type: 'revoke',
          timeout: resolvedTimeout,
          fetchUrl,
          fetchOptions: { method: 'POST', body, headers },
          useFormData,
          useMrrt,
          auth: { audience: audience ?? DEFAULT_AUDIENCE }
        },
        worker
      );
    } catch (e) {
      onRevokeFailed?.((e as { revoked?: number }).revoked ?? 0);
      throw new GenericError('revoke_error', (e as Error).message);
    }
  }

  for (const refreshToken of refreshTokens) {
    const params = { client_id, token_type_hint, token: refreshToken };
    const body = useFormData
      ? createQueryParams(params)
      : JSON.stringify(params);

    const controller = createAbortController();
    const deadline = Date.now() + resolvedTimeout;
    const response = await fetchWithTimeout(
      fetchUrl,
      { method: 'POST', body, headers },
      resolvedTimeout,
      controller
    );

    if (!response.ok) {
      let error: string | undefined;
      let errorDescription: string | undefined;
      try {
        // The request's deadline also covers reading the error body, so a
        // stalled body can't hold up the token-store queue.
        const text = await resolveWithin(response.text(), deadline - Date.now());
        if (text === undefined) {
          // The body didn't arrive in time: stop reading it.
          controller.abort();
        } else {
          ({ error, error_description: errorDescription } = JSON.parse(text));
        }
      } catch {
        // body absent or not valid JSON
      }
      throw new GenericError(error || 'revoke_error', errorDescription || `HTTP error ${response.status}`);
    }

    await onRefreshTokenRevoked?.(refreshToken);
  }
}
