import { DPOP_NONCE_HEADER } from './dpop/utils';
import { UseDpopNonceError } from './errors';

export type ResponseHeaders =
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
  getAccessToken?: AccessTokenFactory;
  baseUrl?: string;
  fetch?: CustomFetchImpl<TOutput>;
  dpopNonceId?: string;
};

export type FetcherHooks = {
  isDpopEnabled: () => boolean;
  getAccessToken: () => Promise<string>;
  getDpopNonce: () => Promise<string | undefined>;
  setDpopNonce: (nonce: string) => Promise<void>;
  generateDpopProof: (params: {
    url: string;
    method: string;
    nonce?: string;
    accessToken: string;
  }) => Promise<string>;
};

export type FetchWithAuthCallbacks<TOutput> = {
  onUseDpopNonceError?(): Promise<TOutput>;
};

export class Fetcher<TOutput extends CustomFetchMinimalOutput> {
  protected readonly config: Omit<FetcherConfig<TOutput>, 'fetch'> &
    Required<Pick<FetcherConfig<TOutput>, 'fetch'>>;

  protected readonly hooks: FetcherHooks;

  constructor(config: FetcherConfig<TOutput>, hooks: FetcherHooks) {
    this.hooks = hooks;

    this.config = {
      ...config,
      fetch:
        config.fetch ||
        // For easier testing and constructor compatibility with SSR.
        ((typeof window === 'undefined'
          ? fetch
          : window.fetch.bind(window)) as () => Promise<any>)
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

    throw new TypeError('`url` must be absolute or `baseUrl` non-empty.');
  }

  protected getAccessToken(): Promise<string> {
    return this.config.getAccessToken
      ? this.config.getAccessToken()
      : this.hooks.getAccessToken();
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

  protected async setAuthorizationHeader(
    request: Request,
    accessToken: string
  ): Promise<void> {
    request.headers.set(
      'authorization',
      `${this.config.dpopNonceId ? 'DPoP' : 'Bearer'} ${accessToken}`
    );
  }

  protected async setDpopProofHeader(
    request: Request,
    accessToken: string
  ): Promise<void> {
    if (!this.config.dpopNonceId) {
      return;
    }

    const dpopNonce = await this.hooks.getDpopNonce();

    const dpopProof = await this.hooks.generateDpopProof({
      accessToken,
      method: request.method,
      nonce: dpopNonce,
      url: request.url
    });

    request.headers.set('dpop', dpopProof);
  }

  protected async prepareRequest(request: Request) {
    const accessToken = await this.getAccessToken();

    this.setAuthorizationHeader(request, accessToken);

    await this.setDpopProofHeader(request, accessToken);
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

  protected hasUseDpopNonceError(response: TOutput): boolean {
    if (response.status !== 401) {
      return false;
    }

    const wwwAuthHeader = this.getHeader(response.headers, 'www-authenticate');

    return wwwAuthHeader.includes('use_dpop_nonce');
  }

  protected async handleResponse(
    response: TOutput,
    callbacks: FetchWithAuthCallbacks<TOutput>
  ): Promise<TOutput> {
    const newDpopNonce = this.getHeader(response.headers, DPOP_NONCE_HEADER);

    if (newDpopNonce) {
      await this.hooks.setDpopNonce(newDpopNonce);
    }

    if (!this.hasUseDpopNonceError(response)) {
      return response;
    }

    // After a `use_dpop_nonce` error, if we didn't get a new DPoP nonce or we
    // did but it still got rejected for the same reason, we have to give up.
    if (!newDpopNonce || !callbacks.onUseDpopNonceError) {
      throw new UseDpopNonceError(newDpopNonce);
    }

    return callbacks.onUseDpopNonceError();
  }

  protected async internalFetchWithAuth(
    info: RequestInfo | URL,
    init: RequestInit | undefined,
    callbacks: FetchWithAuthCallbacks<TOutput>
  ): Promise<TOutput> {
    const request = this.buildBaseRequest(info, init);

    await this.prepareRequest(request);

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
