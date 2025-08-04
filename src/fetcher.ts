import type { Auth0Client } from './Auth0Client';
import type { MaybePromise } from './cache';
import { Dpop } from './dpop/dpop';
import { DPOP_NONCE_HEADER } from './dpop/utils';
import { UseDpopNonceError } from './errors';
import type { Auth0ClientOptions } from './global';
import { fromEntries } from './utils';

type PlainHeaders = Record<string, string>;

type Auth0ClientOptionsSubset<T> = Pick<
  Auth0ClientOptions<T>,
  'useDpop' | 'fetchParams'
>;

export type FetchFuncResponse<T> = {
  headers: PlainHeaders;
  output: T;
  status: number;
};

type FetchFunc<T> = (params: FetchFinalParams) => Promise<FetchFuncResponse<T>>;
type AccessTokenFunc = (client: Auth0Client) => MaybePromise<string>;

export type FetchInitialParams<T> = {
  accessToken?: string | AccessTokenFunc;
  baseUrl?: string;
  body?: string;
  fetch?: FetchFunc<T>;
  headers?: PlainHeaders;
  method?: string;
  dpopNonceId?: string;
  timeoutMs?: number;
  url?: string;
};

export type FetchFinalParams = {
  accessToken: string;
  body?: string;
  client: Auth0Client;
  headers: PlainHeaders;
  method: string;
  dpopNonceId?: string;
  timeoutMs?: number;
  url: string;
};

const DEFAULT_FETCH_FUNC: FetchFunc<any> = async params => {
  const res = await fetch(
    new Request(params.url, {
      ...params,
      headers: new Headers(params.headers),
      signal: params.timeoutMs
        ? AbortSignal.timeout(params.timeoutMs)
        : undefined
    })
  );

  return {
    headers: fromEntries(res.headers),
    output: res,
    status: res.status
  };
};

export class Fetcher<DefaultOutput> {
  protected readonly client: Auth0Client;
  protected readonly options: Auth0ClientOptionsSubset<DefaultOutput>;

  constructor(params: {
    client: Auth0Client;
    dpop?: Dpop;
    options: Auth0ClientOptionsSubset<DefaultOutput>;
  }) {
    this.client = params.client;
    this.options = params.options;
  }

  protected isAbsoluteUrl(url: string): boolean {
    // `http://example.com`, `https://example.com` or `//example.com`
    return /^(https?:)?\/\//i.test(url);
  }

  protected getFinalUrl({
    baseUrl,
    url
  }: Pick<FetchInitialParams<unknown>, 'baseUrl' | 'url'>): string {
    if (url && this.isAbsoluteUrl(url)) {
      return url;
    }

    if (baseUrl && url) {
      return `${baseUrl.replace(/\/?\/$/, '')}/${url.replace(/^\/+/, '')}`;
    }

    throw new Error('`url` must be absolute or `baseUrl` non-empty.');
  }

  protected getFinalAccessToken({
    accessToken
  }: Pick<FetchInitialParams<unknown>, 'accessToken'>): MaybePromise<string> {
    if (!accessToken) {
      return this.client.getTokenSilently();
    }

    return typeof accessToken === 'string'
      ? accessToken
      : accessToken(this.client);
  }

  protected async getFinalHeaders({
    accessToken,
    headers,
    method,
    dpopNonceId,
    url
  }: Pick<
    FetchFinalParams,
    'accessToken' | 'method' | 'dpopNonceId' | 'url'
  > & {
    accessToken: string;
    headers?: PlainHeaders;
    method: string;
  }): Promise<PlainHeaders> {
    const finalHeaders: PlainHeaders = {
      ...headers,
      authorization: `${
        this.options.useDpop ? 'DPoP' : 'Bearer'
      } ${accessToken}`
    };

    if (this.options.useDpop) {
      finalHeaders['dpop'] = await this.client.generateDpopProof({
        accessToken,
        method,
        nonce: dpopNonceId
          ? await this.client.getDpopNonce(dpopNonceId)
          : undefined,
        url
      });
    }

    return finalHeaders;
  }

  protected getMergedInitialParams<Output>(
    initialParams: FetchInitialParams<Output> | undefined
  ): FetchInitialParams<DefaultOutput | Output> {
    const defaultInitialParams = this.options.fetchParams;

    if (!defaultInitialParams && !initialParams) {
      throw new Error(
        'Fetcher params must be present in the SDK options or passed to fetchWithAuth().'
      );
    }

    return { ...defaultInitialParams, ...initialParams };
  }

  protected async getFinalParams(
    initialParams: FetchInitialParams<unknown>
  ): Promise<FetchFinalParams> {
    const method = initialParams.method || 'GET';
    const accessToken = await this.getFinalAccessToken(initialParams);
    const url = this.getFinalUrl(initialParams);

    const headers = await this.getFinalHeaders({
      ...initialParams,
      accessToken,
      method,
      url
    });

    return {
      ...initialParams,
      accessToken,
      client: this.client,
      headers,
      method,
      url
    };
  }

  protected isNonceError(result: {
    status: number;
    headers: PlainHeaders;
  }): boolean {
    if (result.status !== 401) {
      return false;
    }

    const wwwAuthHeader = result.headers['www-authenticate'];

    return wwwAuthHeader ? wwwAuthHeader.includes('use_dpop_nonce') : false;
  }

  protected async handleResponse<Output>({
    fetchForDpopRetry: fetchForRetry,
    finalParams,
    response
  }: {
    fetchForDpopRetry: FetchFunc<Output> | undefined;
    finalParams: FetchFinalParams;
    response: FetchFuncResponse<Output>;
  }): Promise<FetchFuncResponse<Output>> {
    // non-DPoP responses are simply returned untouched
    if (!this.options.useDpop) {
      return response;
    }

    const newNonce = response.headers[DPOP_NONCE_HEADER];

    if (newNonce) {
      await this.client.setDpopNonce(newNonce, finalParams.dpopNonceId);
    }

    if (!this.isNonceError(response)) {
      return response;
    }

    if (!newNonce || !fetchForRetry) {
      throw new UseDpopNonceError(newNonce);
    }

    const newResponse = await fetchForRetry(finalParams);

    return this.handleResponse({
      fetchForDpopRetry: undefined, // retry exactly once
      finalParams,
      response: newResponse
    });
  }

  public async fetch<Output = DefaultOutput>(
    initialParams?: FetchInitialParams<Output>
  ): Promise<FetchFuncResponse<Output>> {
    const mergedInitialParams = this.getMergedInitialParams(initialParams);
    const finalParams = await this.getFinalParams(mergedInitialParams);

    const finalFetch = mergedInitialParams.fetch || DEFAULT_FETCH_FUNC;

    const response = await finalFetch(finalParams);

    return this.handleResponse({
      finalParams,
      fetchForDpopRetry: finalFetch,
      response
    });
  }
}
