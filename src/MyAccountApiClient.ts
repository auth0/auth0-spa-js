import { AuthorizationParams } from './global';
import { Fetcher } from './fetcher';

interface ConnectRequest {
  /** The name of the connection to link the account with (e.g., 'google-oauth2', 'facebook'). */
  connection: string;
  /** The URI to redirect to after the connection process completes. */
  redirect_uri: string;
  /** An opaque value used to maintain state between the request and callback. */
  state?: string;
  /** A string value used to associate a Client session with an ID Token, and to mitigate replay attacks. */
  nonce?: string;
  /** The PKCE code challenge derived from the code verifier. */
  code_challenge?: string;
  /** The method used to derive the code challenge. Required when code_challenge is provided. */
  code_challenge_method?: 'S256';
  authorization_params?: AuthorizationParams;
}

interface ConnectResponse {
  /** The base URI to initiate the account connection flow. */
  connect_uri: string;
  /** The authentication session identifier. */
  auth_session: string;
  /** Parameters to be used with the connect URI. */
  connect_params: {
    /** The ticket identifier to be used with the connection URI. */
    ticket: string;
  };
  /** The number of seconds until the ticket expires. */
  expires_in: number;
}

interface CompleteRequest {
  /** The authentication session identifier */
  auth_session: string;
  /** The authorization code returned from the connect flow */
  connect_code: string;
  /** The redirect URI used in the original request */
  redirect_uri: string;
  /** The PKCE code verifier */
  code_verifier?: string;
}

export interface CompleteResponse {
  /** The unique identifier of the connected account */
  id: string;
  /** The connection name */
  connection: string;
  /** The access type, always 'offline' */
  access_type: 'offline';
  /** Array of scopes granted */
  scopes?: string[];
  /** ISO date string of when the connected account was created */
  created_at: string;
  /** ISO date string of when the refresh token expires (optional) */
  expires_at?: string;
}

// Validation error returned from MyAccount API
export interface ErrorResponse {
  type: string;
  status: number;
  title: string;
  detail: string;
  validation_errors?: {
    detail: string;
    field?: string;
    pointer?: string;
    source?: string;
  }[];
}

/**
 * Subset of the MyAccount API that handles the connect accounts flow.
 */
export class MyAccountApiClient {
  constructor(
    private myAccountFetcher: Fetcher<Response>,
    private apiBase: string
  ) {}

  /**
   * Get a ticket for the connect account flow.
   */
  async connectAccount(params: ConnectRequest): Promise<ConnectResponse> {
    const res = await this.myAccountFetcher.fetchWithAuth(
      `${this.apiBase}v1/connected-accounts/connect`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      }
    );
    return this._handleResponse(res);
  }

  /**
   * Verify the redirect from the connect account flow and complete the connecting of the account.
   */
  async completeAccount(params: CompleteRequest): Promise<CompleteResponse> {
    const res = await this.myAccountFetcher.fetchWithAuth(
      `${this.apiBase}v1/connected-accounts/complete`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      }
    );
    return this._handleResponse(res);
  }

  private async _handleResponse(res: Response) {
    let body: any;
    try {
      body = await res.text();
      body = JSON.parse(body);
    } catch (err) {
      throw new MyAccountApiError({
        type: 'invalid_json',
        status: res.status,
        title: 'Invalid JSON response',
        detail: body || String(err)
      });
    }

    if (res.ok) {
      return body;
    } else {
      throw new MyAccountApiError(body);
    }
  }
}

export class MyAccountApiError extends Error {
  public readonly type: string;
  public readonly status: number;
  public readonly title: string;
  public readonly detail: string;
  public readonly validation_errors?: ErrorResponse['validation_errors'];

  constructor({
    type,
    status,
    title,
    detail,
    validation_errors
  }: ErrorResponse) {
    super(detail);
    this.name = 'MyAccountApiError';
    this.type = type;
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.validation_errors = validation_errors;
    Object.setPrototypeOf(this, MyAccountApiError.prototype);
  }
}
