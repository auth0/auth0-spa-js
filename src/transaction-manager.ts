import { SessionStorage } from './storage';

const TRANSACTION_STORAGE_KEY = 'a0.spajs.txs.';
const getTransactionKey = (clientId: string) =>
  `${TRANSACTION_STORAGE_KEY}${clientId}`;

interface Transaction {
  nonce: string;
  scope: string;
  audience: string;
  appState?: any;
  code_verifier: string;
  redirect_uri: string;
}

export default class TransactionManager {
  private transaction: Transaction;
  private storage = SessionStorage;

  constructor(public readonly clientId: string) {
    this.transaction = this.storage.get(getTransactionKey(clientId));
  }

  public create(transaction: Transaction) {
    this.transaction = transaction;

    this.storage.save(getTransactionKey(this.clientId), transaction, {
      daysUntilExpire: 1
    });
  }

  public get(): Transaction {
    return this.transaction;
  }

  public remove() {
    delete this.transaction;
    this.storage.remove(getTransactionKey(this.clientId));
  }
}
