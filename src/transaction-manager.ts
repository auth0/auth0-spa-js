import { ClientStorage } from './storage';

const TRANSACTION_STORAGE_KEY_PREFIX = 'a0.spajs.txs';

interface Transaction {
  nonce: string;
  scope: string;
  audience: string;
  appState?: any;
  code_verifier: string;
  redirect_uri: string;
  organizationId?: string;
}

export default class TransactionManager {
  private transaction: Transaction;
  private storageKey: string;

  constructor(private storage: ClientStorage, private clientId: string) {
    this.storageKey = `${TRANSACTION_STORAGE_KEY_PREFIX}.${clientId}`;
    this.transaction = this.storage.get(this.storageKey);
  }

  public create(transaction: Transaction) {
    this.transaction = transaction;

    this.storage.save(this.storageKey, transaction, {
      daysUntilExpire: 1
    });
  }

  public get(): Transaction {
    return this.transaction;
  }

  public remove() {
    delete this.transaction;
    this.storage.remove(this.storageKey);
  }
}
