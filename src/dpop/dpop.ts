import { DpopStorage } from './storage';
import * as dpopUtils from './utils';

export class Dpop {
  protected readonly storage: DpopStorage;

  public constructor(clientId: string) {
    this.storage = new DpopStorage(clientId);
  }

  public getNonce(): Promise<string | undefined> {
    return this.storage.findNonce();
  }

  public setNonce(nonce: string): Promise<void> {
    return this.storage.setNonce(nonce);
  }

  protected async getOrGenerateKeyPair(): Promise<dpopUtils.KeyPair> {
    let keyPair = await this.storage.findKeyPair();

    if (!keyPair) {
      keyPair = await dpopUtils.generateKeyPair();
      this.storage.setKeyPair(keyPair);
    }

    return keyPair;
  }

  public async generateProof({
    url,
    method,
    accessToken
  }: {
    url: string;
    method: string;
    accessToken?: string;
  }): Promise<string> {
    const [nonce, keyPair] = await Promise.all([
      this.storage.findNonce(),
      this.getOrGenerateKeyPair()
    ]);

    return dpopUtils.generateProof({
      keyPair,
      url,
      method,
      nonce,
      accessToken
    });
  }

  public async calculateThumbprint(): Promise<string> {
    const keyPair = await this.getOrGenerateKeyPair();

    return dpopUtils.calculateThumbprint(keyPair);
  }

  public async clear(): Promise<void> {
    await Promise.all([
      this.storage.clearNonces(),
      this.storage.clearKeyPairs()
    ]);
  }
}
