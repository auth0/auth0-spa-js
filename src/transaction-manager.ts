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

    this.getAllKeys().forEach(k => {
      const state = k.replace(COOKIE_KEY, '');
      this.transactions[state] = ClientStorage.get<Transaction>(k);
    });
  }

  /**
   * Stores the specified transaction data keyed by the specified state value.
   * @param state The state value
   * @param transaction The transaction data to store
   */
  public create(state: string, transaction: Transaction) {
    this.transactions[state] = transaction;
    ClientStorage.save(getTransactionKey(state), transaction, {
      daysUntilExpire: 1
    });
  }

  /**
   * Gets the transaction data that is referenced to by `state`
   * @param state The state value
   */
  public get(state: string): Transaction {
    return this.transactions[state];
  }

  public getAllKeys(): string[] {
    return ClientStorage.getAllKeys().filter(k => k.startsWith(COOKIE_KEY));
  }

  /**
   * Removes the transaction data referenced to by `state`
   * @param state The state value
   */
  public remove(state: string): void {
    delete this.transactions[state];
    ClientStorage.remove(getTransactionKey(state));
  }

  /**
   * Clears all known transaction data
   */
  public clear(): void {
    for (const key of this.getAllKeys()) {
      ClientStorage.remove(key);
    }
  }
}
