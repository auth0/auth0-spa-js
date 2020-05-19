import * as ClientStorage from './storage';

const COOKIE_KEY = 'a0.spajs.txs.';
const getTransactionKey = (state: string) => `${COOKIE_KEY}${state}`;

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
  constructor() {
    this.transactions = {};
    typeof window !== 'undefined' &&
      ClientStorage.getAllKeys()
        .filter(k => k.startsWith(COOKIE_KEY))
        .forEach(k => {
          const state = k.replace(COOKIE_KEY, '');
          this.transactions[state] = ClientStorage.get<Transaction>(k);
        });
  }
  public create(state: string, transaction: Transaction) {
    this.transactions[state] = transaction;
    ClientStorage.save(getTransactionKey(state), transaction, {
      daysUntilExpire: 1
    });
  }
  public get(state: string): Transaction {
    return this.transactions[state];
  }
  public remove(state: string) {
    delete this.transactions[state];
    ClientStorage.remove(getTransactionKey(state));
  }
}
