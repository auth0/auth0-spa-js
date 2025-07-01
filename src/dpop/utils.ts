import * as dpopLib from 'dpop';

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

export async function generateKeyPair(): Promise<KeyPair> {
  return dpopLib.generateKeyPair(KEY_PAIR_ALGORITHM, { extractable: false });
}

export async function calculateThumbprint(
  keyPair: Pick<KeyPair, 'publicKey'>
): Promise<string> {
  return dpopLib.calculateThumbprint(keyPair.publicKey);
}

export async function generateProof({
  keyPair,
  url,
  method,
  nonce,
  accessToken
}: GenerateProofParams): Promise<string> {
  return dpopLib.generateProof(keyPair, url, method, nonce, accessToken);
}

export function isGrantTypeSupported(grantType: string): boolean {
  return SUPPORTED_GRANT_TYPES.includes(grantType);
}
