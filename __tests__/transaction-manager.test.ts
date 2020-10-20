import TransactionManager from '../src/transaction-manager';
import { SessionStorage } from '../src/storage';
import { mocked } from 'ts-jest/utils';

const TRANSACTION_KEY = 'a0.spajs.txs';

const transaction = {
  nonce: 'nonceIn',
  code_verifier: 'code_verifierIn',
  appState: 'appStateIn',
  scope: 'scopeIn',
  audience: ' audienceIn',
  redirect_uri: 'http://localhost'
};

const transactionJson = JSON.stringify(transaction);

describe('transaction manager', () => {
  let tm: TransactionManager;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    it('loads transactions from storage (per key)', () => {
      tm = new TransactionManager(SessionStorage);

      expect(sessionStorage.getItem).toHaveBeenCalledWith(TRANSACTION_KEY);
    });
  });

  describe('with empty transactions', () => {
    beforeEach(() => {
      tm = new TransactionManager(SessionStorage);
    });

    it('`create` creates the transaction', () => {
      mocked(sessionStorage.getItem).mockReturnValue(transactionJson);
      tm.create(transaction);
      expect(tm.get()).toMatchObject(transaction);
    });

    it('`create` saves the transaction in the storage', () => {
      tm.create(transaction);

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        TRANSACTION_KEY,
        transactionJson
      );
    });

    it('`get` without a transaction should return undefined', () => {
      expect(tm.get()).toBeUndefined();
    });

    it('`get` with a transaction should return the transaction', () => {
      tm.create(transaction);
      expect(tm.get()).toMatchObject(transaction);
    });

    it('`remove` removes the transaction', () => {
      tm.create(transaction);
      tm.remove();
      expect(tm.get()).toBeUndefined();
    });

    it('`remove` removes transaction from storage', () => {
      tm.create(transaction);
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        TRANSACTION_KEY,
        transactionJson
      );
      tm.remove();
      expect(sessionStorage.removeItem).toHaveBeenCalledWith(TRANSACTION_KEY);
    });
  });
});
