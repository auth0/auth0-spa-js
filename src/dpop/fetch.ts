import type { Auth0Client } from '../Auth0Client';
import { UseDpopNonceError } from '../errors';
import { Dpop } from './dpop';
import { DPOP_NONCE_HEADER } from './utils';

type HeadersWithGetter = { get(name: string): string | null | undefined };
type Headers = Record<string, string | null | undefined> | HeadersWithGetter;

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
  status: number;
  headers: Headers;
  output: T;
};

type FetchFuncParams = {
  method: string;
  url: string;
  body?: string;
  accessToken: string;
  request: Request;
};

export type FetchFunc<T> = (
  params: FetchFuncParams
) => Promise<FetchFuncResponse<T>>;

export type FetchConfig<T> = {
  nonceId: string;
  method: string;
  url: string;
  body?: string;
  accessToken:
    | string
    | ((client: Auth0ClientSubset) => Promise<string> | string);
  fetch?: FetchFunc<T>;
};

/**
 * Default DPoP fetch that uses the Fetch API. It does a very basic request
 * that expects a JSON response.
 */
const DEFAULT_FETCH_FUNC: FetchFunc<any> = async ({ request }) => {
  const res = await fetch(request);

  return {
    status: res.status,
    headers: res.headers,
    output: await res.json()
  };
};

export class DpopFetch<GlobalOutput> {
  protected readonly client: Auth0ClientSubset;
  protected readonly dpop: Dpop;
  protected readonly config?: FetchConfig<GlobalOutput>;

  constructor(
    client: Auth0ClientSubset,
    dpop: Dpop,
    config?: FetchConfig<GlobalOutput>
  ) {
    this.client = client;
    this.dpop = dpop;
    this.config = config;
  }

  protected async getFinalConfig<LocalOutput>(
    localConfig: FetchConfig<LocalOutput> | undefined
  ): Promise<
    Omit<FetchConfig<GlobalOutput | LocalOutput>, 'accessToken' | 'fetch'> &
      Required<Pick<FetchConfig<GlobalOutput | LocalOutput>, 'fetch'>> & {
        accessToken: string;
      }
  > {
    const finalConfig = localConfig || this.config;

    if (!finalConfig) {
      throw new Error(
        'DPoP fetch config must exist in the SDK options or passed to fetchWithDpop().'
      );
    }

    const finalAccessToken =
      typeof finalConfig.accessToken === 'string'
        ? finalConfig.accessToken
        : await finalConfig.accessToken(this.client);

    return {
      ...finalConfig,
      accessToken: finalAccessToken,
      fetch: finalConfig.fetch || DEFAULT_FETCH_FUNC
    };
  }

  protected headersHaveGetter(headers: Headers): headers is HeadersWithGetter {
    return typeof headers.get === 'function';
  }

  protected getHeader(headers: Headers, name: string): string {
    const value = this.headersHaveGetter(headers)
      ? headers.get(name)
      : headers[name];

    return value || ''; // for type convenience
  }

  protected isNonceError(result: {
    status: number;
    headers: Headers;
  }): boolean {
    if (result.status !== 401) {
      return false;
    }

    const wwwAuthHeader = this.getHeader(result.headers, 'www-authenticate');

    return wwwAuthHeader.includes('use_dpop_nonce');
  }

  public async fetch<LocalOutput>(
    localConfig?: FetchConfig<LocalOutput>,
    isRetry?: boolean
  ): Promise<GlobalOutput | LocalOutput> {
    const {
      nonceId,
      method,
      url,
      body,
      accessToken,
      fetch: fetchFunc
    } = await this.getFinalConfig(localConfig);

    const nonce = await this.dpop.getNonce(nonceId);

    const proof = await this.dpop.generateProof({
      method,
      url,
      accessToken,
      nonce
    });

    const request = new Request(url, {
      method,
      headers: {
        authorization: `DPoP ${accessToken}`,
        dpop: proof
      },
      body
    });

    const result = await fetchFunc({
      method,
      url,
      body,
      accessToken,
      request
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

    return this.fetch(localConfig, true); // retry exactly once
  }
}
