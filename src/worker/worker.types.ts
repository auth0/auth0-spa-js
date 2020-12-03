import { FetchOptions } from '../global';

/**
 * @ts-ignore
 */
export type WorkerRefreshTokenMessage = {
  auth: {
    audience: string;
    scope: string;
  };
  timeout: number;
  fetchUrl: string;
  fetchOptions: FetchOptions;
};
