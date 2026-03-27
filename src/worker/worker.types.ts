import { FetchOptions } from '../global';

/**
 * @ts-ignore
 */
export type WorkerInitMessage = {
  type: 'init';
  allowedBaseUrl: string;
};

export type WorkerRefreshTokenMessage = {
  timeout: number;
  fetchUrl: string;
  fetchOptions: FetchOptions;
  useFormData?: boolean;
  useMrrt?: boolean;
  auth: {
    audience: string;
    scope: string;
  };
};

export type WorkerMessage = WorkerInitMessage | WorkerRefreshTokenMessage;
