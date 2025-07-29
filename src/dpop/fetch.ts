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

export type FetchFunc<T> = (request: Request) => Promise<FetchFuncResponse<T>>;

export type FetchConfig<T> = {
  accessToken?:
    | string
    | ((client: Auth0ClientSubset) => Promise<string> | string);
  fetch?: FetchFunc<T>;
  nonceId: string;
  request: RequestInit & {
    url: string;
    timeout?: number;
  };
};

/**
 * Default DPoP fetch that uses the Fetch API. It does a very basic request
 * that expects a JSON response.
 */
const DEFAULT_FETCH_FUNC: FetchFunc<any> = async request => {
  const res = await fetch(request);

  return {
    headers: res.headers,
    output: res,
    status: res.status
  };
};

export class DpopFetch<GlobalOutput> {
  protected readonly client: Auth0ClientSubset;
  protected readonly config?: FetchConfig<GlobalOutput>;
  protected readonly dpop: Dpop;

  constructor(
    client: Auth0ClientSubset,
    dpop: Dpop,
    config?: FetchConfig<GlobalOutput>
  ) {
    this.client = client;
    this.config = config;
    this.dpop = dpop;
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
        : await (finalConfig.accessToken
            ? finalConfig.accessToken(this.client)
            : this.client.getTokenSilently());

    return {
      ...finalConfig,
      accessToken: finalAccessToken,
      fetch: finalConfig.fetch || DEFAULT_FETCH_FUNC
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
    localConfig?: FetchConfig<LocalOutput>,
    isRetry?: boolean
  ): Promise<GlobalOutput | LocalOutput> {
    const {
      accessToken,
      fetch: fetchFunc,
      nonceId,
      request: initialRequest
    } = await this.getFinalConfig(localConfig);

    const nonce = await this.dpop.getNonce(nonceId);

    const proof = await this.dpop.generateProof({
      method: initialRequest.method || 'GET',
      url: initialRequest.url,
      accessToken,
      nonce
    });

    const headers = new Headers({
      ...initialRequest.headers,
      authorization: `DPoP ${accessToken}`,
      dpop: proof
    });

    const result = await fetchFunc(
      new Request(initialRequest.url, {
        ...initialRequest,
        headers,

        /**
         * In order to support a request timeout, we would ideally ask the developer
         * to pass an `AbortSignal.timeout()` in `initialRequest.signal`. However,
         * very counterintuitively, that would start counting time *since its creation*
         * and not since `fetch()` starts using it.
         *
         * This means that if the developer sets up their request when instantiating
         * `Auth0Client` and enough time passes until they call `fetchWithDpop()`, the
         * request will timeout immediately.
         *
         * So we have to create our own signal here from the `timeout` setting.
         */
        signal: initialRequest.timeout
          ? AbortSignal.timeout(initialRequest.timeout)
          : undefined
      })
    );

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
