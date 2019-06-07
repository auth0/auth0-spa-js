import * as ClientStorage from './storage';

const COOKIE_KEY = 'Auth0.spa-js.transactions.';

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
    ClientStorage.getAllKeys().forEach(k => {
      const state = k.replace(COOKIE_KEY, '');
      this.transactions[state] = ClientStorage.get<Transaction>(
        `${COOKIE_KEY}${k}`
      );
      console.log(this.transactions);
    });
  }
  public create(transaction: Transaction) {
    this.transactions[transaction.state] = transaction;
    ClientStorage.save(COOKIE_KEY, this.transactions, {
      daysUntilExpire: 1
    });
  }
  public get(state: string): Transaction {
    return this.transactions[state];
  }
  public remove(state: string) {
    delete this.transactions[state];
    ClientStorage.save(COOKIE_KEY, this.transactions, {
      daysUntilExpire: 1
    });
  }
}
