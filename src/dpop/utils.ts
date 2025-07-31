import * as dpopLib from 'dpop';

export const DPOP_NONCE_HEADER = 'dpop-nonce';

const KEY_PAIR_ALGORITHM: dpopLib.JWSAlgorithm = 'ES256';

const SUPPORTED_GRANT_TYPES = [
  'authorization_code',
  'refresh_token',
  'urn:ietf:params:oauth:grant-type:token-exchange'
];

export type KeyPair = Readonly<dpopLib.KeyPair>;

type GenerateProofParams = {
  keyPair: KeyPair;
  url: string;
  method: string;
  nonce?: string;
  accessToken?: string;
};

export function generateKeyPair(): Promise<KeyPair> {
  return dpopLib.generateKeyPair(KEY_PAIR_ALGORITHM, { extractable: false });
}

export function calculateThumbprint(
  keyPair: Pick<KeyPair, 'publicKey'>
): Promise<string> {
  return dpopLib.calculateThumbprint(keyPair.publicKey);
}

function normalizeUrl(url: string): string {
  const parsedUrl = new URL(url);

  /**
   * "The HTTP target URI (...) without query and fragment parts"
   * @see {@link https://www.rfc-editor.org/rfc/rfc9449.html#section-4.2-4.6}
   */
  parsedUrl.search = '';
  parsedUrl.hash = '';

  return parsedUrl.href;
}

export function generateProof({
  keyPair,
  url,
  method,
  nonce,
  accessToken
}: GenerateProofParams): Promise<string> {
  const normalizedUrl = normalizeUrl(url);

  return dpopLib.generateProof(
    keyPair,
    normalizedUrl,
    method,
    nonce,
    accessToken
  );
}

export function isGrantTypeSupported(grantType: string): boolean {
  return SUPPORTED_GRANT_TYPES.includes(grantType);
}
