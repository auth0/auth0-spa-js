/**
 * @ts-ignore
 */
export type WorkerRefreshTokenMessage = {
  url: string;
  timeout: number;
  audience: string;
  scope: string;
  body?: string;
};
