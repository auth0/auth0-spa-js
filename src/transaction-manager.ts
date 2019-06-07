import * as ClientStorage from './storage';

const COOKIE_KEY = 'Auth0.spa-js.transactions.';
const getTransactionKey = (state: string) => `${COOKIE_KEY}${state}`;

interface Transaction {
  state: string;
  nonce: string;
  scope: string;
  audience: string;
  appState?: any;
  code_verifier: string;
  code_challenge: string;
}
interface Transactions {
  [key: string]: Transaction;
}
export default class TransactionManager {
  private transactions: Transactions;
  constructor() {
    this.transactions = {};
    ClientStorage.getAllKeys()
      .filter(k => k.startsWith(COOKIE_KEY))
      .forEach(k => {
        const state = k.replace(COOKIE_KEY, '');
        this.transactions[state] = ClientStorage.get<Transaction>(k);
      });
    console.log(Object.keys(this.transactions).length);
  }
  public create(transaction: Transaction) {
    this.transactions[transaction.state] = transaction;
    ClientStorage.save(getTransactionKey(transaction.state), transaction, {
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
