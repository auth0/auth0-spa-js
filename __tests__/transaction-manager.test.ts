import TransactionManager from '../src/transaction-manager';
import { SessionStorage } from '../src/storage';
import { TEST_CLIENT_ID } from './constants';
import { mocked } from 'ts-jest/utils';

const TRANSACTION_KEY_PREFIX = 'a0.spajs.txs';

const transaction = {
  nonce: 'nonceIn',
  code_verifier: 'code_verifierIn',
  appState: 'appStateIn',
  scope: 'scopeIn',
  audience: ' audienceIn',
  redirect_uri: 'http://localhost'
};

const transactionJson = JSON.stringify(transaction);

const transactionKey = (clientId = TEST_CLIENT_ID) =>
  `${TRANSACTION_KEY_PREFIX}.${clientId}`;

describe('transaction manager', () => {
  let tm: TransactionManager;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    it('loads transactions from storage (per key)', () => {
      tm = new TransactionManager(SessionStorage, TEST_CLIENT_ID);
      expect(sessionStorage.getItem).toHaveBeenCalledWith(transactionKey());
    });
  });

  describe('with empty transactions', () => {
    beforeEach(() => {
      tm = new TransactionManager(SessionStorage, TEST_CLIENT_ID);
    });

    it('`create` creates the transaction', () => {
      mocked(sessionStorage.getItem).mockReturnValue(transactionJson);
      tm.create(transaction);
      expect(tm.get()).toMatchObject(transaction);
    });

    it('`create` saves the transaction in the storage', () => {
      tm.create(transaction);

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        transactionKey(),
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
        transactionKey(),
        transactionJson
      );

      tm.remove();
      expect(sessionStorage.removeItem).toHaveBeenCalledWith(transactionKey());
    });
  });
});
