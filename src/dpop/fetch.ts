import type { Auth0Client } from '../Auth0Client';
import { UseDpopNonceError } from '../errors';
import { Dpop } from './dpop';
import { DPOP_NONCE_HEADER } from './utils';

type GetterHeaders = Pick<Headers, 'get'>;
type PlainHeaders = Record<string, string>;
type AnyHeaders = GetterHeaders | PlainHeaders;

/**
 * `Auth0Client` instance that the `accessToken` function will receive as
 * an argument in a developer-provided custom fetch implementation.
 *
 * Omit any DPoP-related methods to avoid confusion and potential infinite recursion.
 */
type Auth0ClientSubset = Omit<
  Auth0Client,
  'fetchWithDpop' | 'getDpopNonce' | 'setDpopNonce' | 'generateDpopProof'
>;

type FetchFuncResponse<T> = {
  headers: AnyHeaders;
  output: T;
  status: number;
};

export type FetchInitialParams<T> = {
  accessToken?:
    | string
    | ((client: Auth0ClientSubset) => Promise<string> | string);
  fetch?: FetchFunc<T>;
  nonceId: string;
  timeout?: number;
  url: string;
} & Pick<RequestInit, 'body' | 'method' | 'headers'>;

type FetchFinalParams = {
  accessToken: string;
  timeout?: number;
  url: string;
} & Pick<RequestInit, 'body' | 'method' | 'headers'>;

type FetchFunc<T> = (params: FetchFinalParams) => Promise<FetchFuncResponse<T>>;

/**
 * Default DPoP fetch that uses the Fetch API. It does a very basic request
 * that expects a JSON response.
 */
const DEFAULT_FETCH_FUNC: FetchFunc<any> = async params => {
  const res = await fetch(
    new Request(params.url, {
      ...params,

      /**
       * In order to support a request timeout, we would ideally ask the developer
       * to pass an `AbortSignal.timeout()` in the initial config. However,very
       * counterintuitively, that would start counting time *since its creation*
       * and not since `fetch()` starts using it.
       *
       * This means that if the developer sets up their request when instantiating
       * `Auth0Client` and enough time passes until they call `fetchWithDpop()`, the
       * request will timeout immediately.
       *
       * So we have to create our own signal here from the `timeout` setting.
       */
      signal: params.timeout ? AbortSignal.timeout(params.timeout) : undefined
    })
  );

  return {
    headers: res.headers,
    output: res,
    status: res.status
  };
};

export class DpopFetch<GlobalOutput> {
  protected readonly client: Auth0ClientSubset;
  protected readonly params?: FetchInitialParams<GlobalOutput>;
  protected readonly dpop: Dpop;

  constructor(
    client: Auth0ClientSubset,
    dpop: Dpop,
    params?: FetchInitialParams<GlobalOutput>
  ) {
    this.client = client;
    this.dpop = dpop;
    this.params = params;
  }

  protected async getFinalParams<LocalOutput>(
    localParams: FetchInitialParams<LocalOutput> | undefined
  ): Promise<
    Omit<FetchInitialParams<GlobalOutput | LocalOutput>, 'accessToken'> &
      Required<
        Pick<FetchInitialParams<GlobalOutput | LocalOutput>, 'fetch' | 'method'>
      > & { accessToken: string }
  > {
    const finalParams = localParams || this.params;

    if (!finalParams) {
      throw new Error(
        'DPoP fetch params must be present in the SDK options or passed to fetchWithDpop().'
      );
    }

    const finalAccessToken =
      typeof finalParams.accessToken === 'string'
        ? finalParams.accessToken
        : await (finalParams.accessToken
            ? finalParams.accessToken(this.client)
            : this.client.getTokenSilently());

    return {
      ...finalParams,
      accessToken: finalAccessToken,
      method: finalParams.method || 'GET',
      fetch: finalParams.fetch || DEFAULT_FETCH_FUNC
    };
  }

  protected hasGetter(headers: AnyHeaders): headers is GetterHeaders {
    return typeof headers.get === 'function';
  }

  protected getHeader(headers: AnyHeaders, name: string): string {
    const value = this.hasGetter(headers) ? headers.get(name) : headers[name];

    return value || ''; // for type convenience
  }

  protected isNonceError(result: {
    status: number;
    headers: AnyHeaders;
  }): boolean {
    if (result.status !== 401) {
      return false;
    }

    const wwwAuthHeader = this.getHeader(result.headers, 'www-authenticate');

    return wwwAuthHeader.includes('use_dpop_nonce');
  }

  public async fetch<LocalOutput>(
    localParams?: FetchInitialParams<LocalOutput>,
    isRetry?: boolean
  ): Promise<GlobalOutput | LocalOutput> {
    const {
      accessToken,
      body,
      fetch: fetchFunc,
      headers: initialHeaders,
      method,
      nonceId,
      timeout,
      url
    } = await this.getFinalParams(localParams);

    const nonce = await this.dpop.getNonce(nonceId);

    const proof = await this.dpop.generateProof({
      accessToken,
      method,
      nonce,
      url
    });

    const headers = new Headers({
      ...initialHeaders,
      authorization: `DPoP ${accessToken}`,
      dpop: proof
    });

    const result = await fetchFunc({
      accessToken,
      body,
      headers,
      method,
      timeout,
      url
    });

    const newNonce = this.getHeader(result.headers, DPOP_NONCE_HEADER);

    if (newNonce) {
      await this.dpop.setNonce(newNonce, nonceId);
    }

    if (!this.isNonceError(result)) {
      return result.output;
    }

    if (!newNonce || isRetry) {
      throw new UseDpopNonceError(newNonce);
    }

    return this.fetch(localParams, true); // retry exactly once
  }
}
