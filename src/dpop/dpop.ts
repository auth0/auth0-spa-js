import { DpopStorage } from './storage';
import * as dpopUtils from './utils';

export class Dpop {
  protected readonly storage: DpopStorage;

  public constructor(clientId: string) {
    this.storage = new DpopStorage(clientId);
  }

  public getNonce(id?: string): Promise<string | undefined> {
    return this.storage.findNonce(id);
  }

  public setNonce(nonce: string, id?: string): Promise<void> {
    return this.storage.setNonce(nonce, id);
  }

  protected async getOrGenerateKeyPair(): Promise<dpopUtils.KeyPair> {
    let keyPair = await this.storage.findKeyPair();

    if (!keyPair) {
      keyPair = await dpopUtils.generateKeyPair();
      await this.storage.setKeyPair(keyPair);
    }

    return keyPair;
  }

  public async generateProof(params: {
    url: string;
    method: string;
    nonce?: string;
    accessToken?: string;
  }): Promise<string> {
    const keyPair = await this.getOrGenerateKeyPair();

    return dpopUtils.generateProof({
      keyPair,
      ...params
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
