import { CookieStorage } from './storage';

const TRANSACTION_STORAGE_KEY = 'a0.spajs.txs.';
const getTransactionKey = (state: string) =>
  `${TRANSACTION_STORAGE_KEY}${state}`;

interface Transaction {
  nonce: string;
  scope: string;
  audience: string;
  appState?: any;
  code_verifier: string;
  redirect_uri: string;
}
interface Transactions {
  [key: string]: Transaction;
}
export default class TransactionManager {
  private transactions: Transactions;
  private storage = CookieStorage;

  constructor() {
    this.transactions = {};
    typeof window !== 'undefined' &&
      this.storage
        .getAllKeys()
        .filter(k => k.startsWith(TRANSACTION_STORAGE_KEY))
        .forEach(k => {
          const state = k.replace(TRANSACTION_STORAGE_KEY, '');
          this.transactions[state] = this.storage.get<Transaction>(k);
        });
  }
  public create(state: string, transaction: Transaction) {
    this.transactions[state] = transaction;
    this.storage.save(getTransactionKey(state), transaction, {
      daysUntilExpire: 1
    });
  }
  public get(state: string): Transaction {
    return this.transactions[state];
  }
  public remove(state: string) {
    delete this.transactions[state];
    this.storage.remove(getTransactionKey(state));
  }
}
