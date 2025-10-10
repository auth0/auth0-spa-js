import { ClientStorage } from './storage';

const TRANSACTION_STORAGE_KEY_PREFIX = 'a0.spajs.txs';

export interface LoginTransaction {
  nonce: string;
  scope: string;
  audience: string;
  appState?: any;
  code_verifier: string;
  redirect_uri?: string;
  organization?: string;
  state?: string;
  response_type: 'code';
}

export interface ConnectAccountTransaction {
  appState?: any;
  audience?: string;
  auth_session: string;
  code_verifier: string;
  redirect_uri: string;
  scope?: string;
  state: string;
  connection: string;
  response_type: 'connect_code';
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

  public create<T extends Object = LoginTransaction>(transaction: T) {
    this.storage.save(this.storageKey, transaction, {
      daysUntilExpire: 1,
      cookieDomain: this.cookieDomain
    });
  }

  public get<T extends Object = LoginTransaction>(): T | undefined {
    return this.storage.get(this.storageKey);
  }

  public remove() {
    this.storage.remove(this.storageKey, {
      cookieDomain: this.cookieDomain
    });
  }
}