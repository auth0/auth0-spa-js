import { AuthParams } from '@auth0/auth0-fetch-with-auth';

export type ResponseHeaders =
  | Record<string, string | null | undefined>
  | [string, string][]
  | { get(name: string): string | null | undefined };

export type CustomFetchImpl<TOutput extends Response> = (
  req: Request
) => Promise<TOutput>;

type AccessTokenFactory = (authParams?: AuthParams) => Promise<string>;

export type FetcherConfig<TOutput extends Response> = {
  getAccessToken?: AccessTokenFactory;
  baseUrl?: string;
  fetch?: CustomFetchImpl<TOutput>;
  dpopNonceId?: string;
};
