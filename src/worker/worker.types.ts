import { FetchOptions } from '../global';

export type WorkerInitMessage = {
  type: 'init';
  allowedBaseUrl: string;
};

type WorkerTokenMessage = {
  timeout: number;
  fetchUrl: string;
  fetchOptions: FetchOptions;
  useFormData?: boolean;
  auth: {
    audience: string;
    scope: string;
  };
};

export type WorkerRefreshTokenMessage = WorkerTokenMessage & {
  type: 'refresh';
  useMrrt?: boolean;
  skipTokenStorage?: boolean;
  /**
   * When true the worker keeps the stored token if the response carries no replacement
   * (Online Refresh Tokens are non-rotating and never come back with a new token).
   */
  preserveRefreshToken?: boolean;
};

export type WorkerRevokeTokenMessage = Omit<WorkerTokenMessage, 'auth'> & {
  type: 'revoke';
  auth: {
    audience: string;
  };
};

export type WorkerClearMessage = {
  type: 'clear';
};

export type WorkerMessage =
  | WorkerInitMessage
  | WorkerRefreshTokenMessage
  | WorkerRevokeTokenMessage
  | WorkerClearMessage;
