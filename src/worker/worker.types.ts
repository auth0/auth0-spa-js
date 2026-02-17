import { FetchOptions } from '../global';

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
};

export type WorkerRevokeTokenMessage = WorkerTokenMessage & {
  type: 'revoke';
};

