import type { Auth0Client } from './Auth0Client';
import { DPOP_NONCE_HEADER } from './dpop/utils';
import { UseDpopNonceError } from './errors';

type ResponseHeaders =
  | Record<string, string | null | undefined>
  | [string, string][]
  | { get(name: string): string | null | undefined };

export type CustomFetchMinimalOutput = {
  status: number;
  headers: ResponseHeaders;
};

export type CustomFetchImpl<TOutput extends CustomFetchMinimalOutput> = (
  req: Request
) => Promise<TOutput>;

type AccessTokenFactory = () => Promise<string>;

export type FetcherConfig<TOutput extends CustomFetchMinimalOutput> = {
  accessTokenFactory?: AccessTokenFactory;
  baseUrl?: string;
  fetch?: CustomFetchImpl<TOutput>;
  dpopNonceId?: string;
};

type FetchWithAuthCallbacks<TOutput> = {
  onUseDpopNonceError?(): Promise<TOutput>;
};

export class Fetcher<TOutput extends CustomFetchMinimalOutput> {
  protected readonly client: Auth0Client;
  protected readonly config: Omit<FetcherConfig<TOutput>, 'fetch'> &
    Required<Pick<FetcherConfig<TOutput>, 'fetch'>>;

  constructor(client: Auth0Client, config: FetcherConfig<TOutput>) {
    this.client = client;

    if (this.client.getOptions().useDpop && !config.dpopNonceId) {
      throw new TypeError(
        'When `useDpop` is enabled, `dpopNonceId` must be set when calling `buildFetcher()`.'
      );
    }

    this.config = {
      ...config,
      fetch: config.fetch || (window.fetch.bind(window) as () => Promise<any>)
    };
  }

  protected isAbsoluteUrl(url: string): boolean {
    // `http://example.com`, `https://example.com` or `//example.com`
    return /^(https?:)?\/\//i.test(url);
  }

  protected buildUrl(
    baseUrl: string | undefined,
    url: string | undefined
  ): string {
    if (url) {
      if (this.isAbsoluteUrl(url)) {
        return url;
      }

      if (baseUrl) {
        return `${baseUrl.replace(/\/?\/$/, '')}/${url.replace(/^\/+/, '')}`;
      }
    }

    throw new Error('`url` must be absolute or `baseUrl` non-empty.');
  }

  protected getAccessToken(): Promise<string> {
    return this.config.accessTokenFactory
      ? this.config.accessTokenFactory()
      : this.client.getTokenSilently();
  }

  protected buildBaseRequest(
    info: RequestInfo | URL,
    init: RequestInit | undefined
  ): Request {
    // In the native `fetch()` behavior, `init` can override `info` and the result
    // is the merge of both. So let's replicate that behavior by passing those into
    // a fresh `Request` object.
    const request = new Request(info, init);

    // No `baseUrl` config, use whatever the URL the `Request` came with.
    if (!this.config.baseUrl) {
      return request;
    }

    return new Request(
      this.buildUrl(this.config.baseUrl, request.url),
      request
    );
  }

  protected async setAuthorizationHeaders(
    request: Request,
    accessToken: string
  ): Promise<void> {
    request.headers.set(
      'authorization',
      `${this.config.dpopNonceId ? 'DPoP' : 'Bearer'} ${accessToken}`
    );
  }

  protected async setDpopProofHeaders(
    request: Request,
    accessToken: string
  ): Promise<void> {
    if (!this.config.dpopNonceId) {
      return;
    }

    const dpopNonce = await this.client.getDpopNonce(this.config.dpopNonceId);

    const dpopProof = await this.client.generateDpopProof({
      accessToken,
      method: request.method,
      nonce: dpopNonce,
      url: request.url
    });

    request.headers.set('dpop', dpopProof);
  }

  protected async setupRequest(request: Request) {
    const accessToken = await this.getAccessToken();

    this.setAuthorizationHeaders(request, accessToken);

    await this.setDpopProofHeaders(request, accessToken);
  }

  protected getHeader(headers: ResponseHeaders, name: string): string {
    if (Array.isArray(headers)) {
      return new Headers(headers).get(name) || '';
    }

    if (typeof headers.get === 'function') {
      return headers.get(name) || '';
    }

    return (headers as Record<string, string | null | undefined>)[name] || '';
  }

  protected isUseDpopNonceError(response: TOutput): boolean {
    if (response.status !== 401) {
      return false;
    }

    const wwwAuthHeader = this.getHeader(response.headers, 'www-authenticate');

    return wwwAuthHeader.includes('use_dpop_nonce');
  }

  protected async handleResponse(
    response: TOutput,
    callbacks?: FetchWithAuthCallbacks<TOutput>
  ): Promise<TOutput> {
    const newDpopNonce = this.getHeader(response.headers, DPOP_NONCE_HEADER);

    if (newDpopNonce) {
      await this.client.setDpopNonce(newDpopNonce, this.config.dpopNonceId);
    }

    if (!this.isUseDpopNonceError(response)) {
      return response;
    }

    // After a `use_dpop_nonce` error, if we didn't get a new DPoP nonce or we
    // did but it still got rejected for the same reason, we have to give up.
    if (!newDpopNonce || !callbacks?.onUseDpopNonceError) {
      throw new UseDpopNonceError(newDpopNonce);
    }

    return callbacks.onUseDpopNonceError();
  }

  protected async internalFetchWithAuth(
    info: RequestInfo | URL,
    init: RequestInit | undefined,
    callbacks?: FetchWithAuthCallbacks<TOutput>
  ): Promise<TOutput> {
    const request = this.buildBaseRequest(info, init);

    await this.setupRequest(request);
    console.log({ request });
    const response = await this.config.fetch(request);

    return this.handleResponse(response, callbacks);
  }

  public fetchWithAuth(
    info: RequestInfo | URL,
    init?: RequestInit
  ): Promise<TOutput> {
    const callbacks: FetchWithAuthCallbacks<TOutput> = {
      onUseDpopNonceError: () =>
        this.internalFetchWithAuth(info, init, {
          ...callbacks,
          // Retry on a `use_dpop_nonce` error, but just once.
          onUseDpopNonceError: undefined
        })
    };

    return this.internalFetchWithAuth(info, init, callbacks);
  }
}
