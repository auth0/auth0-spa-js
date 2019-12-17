interface Transaction {
  nonce: string;
  scope: string;
  audience: string;
  appState?: any;
  code_verifier: string;
}
export default class TransactionManager {
  private transactions;
  constructor();
  create(state: string, transaction: Transaction): void;
  get(state: string): Transaction;
  remove(state: string): void;
}
export {};
