import { ClientStorage } from './storage';

const TRANSACTION_STORAGE_KEY_PREFIX = 'a0.spajs.txs';

interface Transaction {
  nonce: string;
  scope: string;
  audience: string;
  appState?: any;
  code_verifier: string;
  redirect_uri?: string;
  organization?: string;
  state?: string;
}

export class TransactionManager {
  private storageKey: string;

  constructor(
    private storage: ClientStorage,
    private clientId: string,
    private cookieDomain?: string
  ) {
    this.storageKey = `${TRANSACTION_STORAGE_KEY_PREFIX}.${this.clientId}`;
  }

  public create(transaction: Transaction) {
    this.storage.save(this.storageKey, transaction, {
      daysUntilExpire: 1,
      cookieDomain: this.cookieDomain
    });
  }

  public get(): Transaction | undefined {
    return this.storage.get(this.storageKey);
  }

  public remove() {
    this.storage.remove(this.storageKey, {
      cookieDomain: this.cookieDomain
    });
  }
}
