import { Fetcher } from '../fetcher';
import type {
  ConnectRequest,
  ConnectResponse,
  CompleteRequest,
  CompleteResponse,
  ErrorResponse,
  Factor,
  AuthenticationMethod,
  AuthenticationMethodType,
  UpdateAuthenticationMethodRequest,
  EnrollmentChallengeOptions,
  EnrollmentChallengeResponse,
  EnrollmentVerifyOptions
} from './types';

export type {
  ConnectRequest,
  ConnectResponse,
  CompleteRequest,
  CompleteResponse,
  ErrorResponse,
  Factor,
  AuthenticationMethod,
  AuthenticationMethodType,
  UpdateAuthenticationMethodRequest,
  EnrollmentChallengeOptions,
  EnrollmentChallengeResponse,
  EnrollmentVerifyOptions
} from './types';

/**
 * Client for Auth0 MyAccount API operations.
 *
 * Provides methods for managing the current user's account:
 * - Connected accounts (link/unlink external identity providers)
 * - MFA factors
 * - Authentication methods (passkeys, phone, email, TOTP) - list, get, update, delete
 * - Authentication method enrollment (challenge and verify)
 */
export class MyAccountApiClient {
  constructor(
    private myAccountFetcher: Fetcher<Response>,
    private apiBase: string
  ) {}

  /**
   * Get a ticket for the connect account flow.
   *
   * @param params - Connection parameters including connection name and redirect URI
   * @returns A promise that resolves to a connect response with the redirect URI and auth session
   */
  async connectAccount(params: ConnectRequest): Promise<ConnectResponse> {
    const res = await this.myAccountFetcher.fetchWithAuth(
      `${this.apiBase}v1/connected-accounts/connect`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      },
      { scope: ['create:me:connected_accounts'] }
    );
    return this._handleResponse(res);
  }

  /**
   * Verify the redirect from the connect account flow and complete the connecting of the account.
   *
   * @param params - Completion parameters including auth session, connect code, and redirect URI
   * @returns A promise that resolves to the completed connected account details
   */
  async completeAccount(params: CompleteRequest): Promise<CompleteResponse> {
    const res = await this.myAccountFetcher.fetchWithAuth(
      `${this.apiBase}v1/connected-accounts/complete`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      },
      { scope: ['create:me:connected_accounts'] }
    );
    return this._handleResponse(res);
  }

  /**
   * Get the status of all factors for the current user.
   *
   * @returns A promise that resolves to an array of factors with their enabled/disabled status
   */
  async getFactors(): Promise<Factor[]> {
    const res = await this.myAccountFetcher.fetchWithAuth(
      `${this.apiBase}v1/factors`,
      { method: 'GET' },
      { scope: ['read:me:factors'] }
    );
    const body = await this._handleResponse<{ factors: Factor[] }>(res);
    return body.factors;
  }

  /**
   * Get a list of all authentication methods for the current user.
   *
   * @param type - Optional filter to return only methods of a specific type
   * @returns A promise that resolves to an array of authentication methods
   */
  async getAuthenticationMethods(type?: AuthenticationMethodType): Promise<AuthenticationMethod[]> {
    const query = type ? `?${new URLSearchParams({ type })}` : '';
    const res = await this.myAccountFetcher.fetchWithAuth(
      `${this.apiBase}v1/authentication-methods${query}`,
      { method: 'GET' },
      { scope: ['read:me:authentication_methods'] }
    );
    const body = await this._handleResponse<{ authentication_methods: AuthenticationMethod[] }>(res);
    return body.authentication_methods;
  }

  /**
   * Get an authentication method by ID.
   *
   * @param id - The ID of the authentication method to retrieve
   * @returns A promise that resolves to the authentication method
   */
  async getAuthenticationMethod(id: string): Promise<AuthenticationMethod> {
    const res = await this.myAccountFetcher.fetchWithAuth(
      `${this.apiBase}v1/authentication-methods/${encodeURIComponent(id)}`,
      { method: 'GET' },
      { scope: ['read:me:authentication_methods'] }
    );
    return this._handleResponse(res);
  }

  /**
   * Delete an authentication method by ID.
   *
   * @param id - The ID of the authentication method to delete
   * @returns A promise that resolves when the authentication method has been deleted
   */
  async deleteAuthenticationMethod(id: string): Promise<void> {
    const res = await this.myAccountFetcher.fetchWithAuth(
      `${this.apiBase}v1/authentication-methods/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
      { scope: ['delete:me:authentication_methods'] }
    );
    if (!res.ok) {
      await this._handleResponse(res);
    }
  }

  /**
   * Update details of an authentication method by ID.
   *
   * @param id - The ID of the authentication method to update
   * @param data - The fields to update (e.g. name, preferred_authentication_method for phone)
   * @returns A promise that resolves to the updated authentication method
   */
  async updateAuthenticationMethod(
    id: string,
    data: UpdateAuthenticationMethodRequest
  ): Promise<AuthenticationMethod> {
    const res = await this.myAccountFetcher.fetchWithAuth(
      `${this.apiBase}v1/authentication-methods/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      },
      { scope: ['update:me:authentication_methods'] }
    );
    return this._handleResponse(res);
  }

  /**
   * Start the enrollment of an authentication method for the current user.
   * The response shape varies by type.
   *
   * @param options - Enrollment challenge options specifying the factor type and any type-specific fields
   * @returns A promise that resolves to the enrollment challenge response (shape varies by type)
   */
  async enrollmentChallenge(
    options: EnrollmentChallengeOptions
  ): Promise<EnrollmentChallengeResponse> {
    const res = await this.myAccountFetcher.fetchWithAuth(
      `${this.apiBase}v1/authentication-methods`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      },
      { scope: ['create:me:authentication_methods'] }
    );

    const raw = await this._handleResponse(res);
    const location = res.headers.get('location') ?? '';
    const id = decodeURIComponent(location.split('/').pop() || '');
    return { ...raw, id, location };
  }

  /**
   * Confirm the enrollment of an authentication method to complete registration.
   *
   * @param options - Enrollment verify options including the auth session and type-specific verification data
   * @returns A promise that resolves to the confirmed authentication method
   */
  async enrollmentVerify(options: EnrollmentVerifyOptions): Promise<AuthenticationMethod> {
    const { location, type: _, ...body } = options as any;

    const res = await this.myAccountFetcher.fetchWithAuth(
      `${location}/verify`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      },
      { scope: ['create:me:authentication_methods'] }
    );
    return this._handleResponse(res);
  }

  private async _handleResponse<T = any>(res: Response): Promise<T> {
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

/**
 * Error thrown when the MyAccount API returns a non-2xx response.
 *
 * @example
 * ```typescript
 * try {
 *   await myAccount.getAuthenticationMethods();
 * } catch (err) {
 *   if (err instanceof MyAccountApiError) {
 *     console.error(err.status, err.title, err.detail);
 *   }
 * }
 * ```
 */
export class MyAccountApiError extends Error {
  /** RFC 7807 error type identifier */
  public readonly type: string;
  /** HTTP status code */
  public readonly status: number;
  /** Short human-readable summary of the error */
  public readonly title: string;
  /** Human-readable explanation specific to this occurrence */
  public readonly detail: string;
  /** Field-level validation errors, if present */
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
