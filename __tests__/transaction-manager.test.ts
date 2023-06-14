import { TransactionManager } from '../src/transaction-manager';
import { CookieStorage, SessionStorage } from '../src/storage';
import { TEST_CLIENT_ID, TEST_STATE } from './constants';
import { expect } from '@jest/globals';

const TRANSACTION_KEY_PREFIX = 'a0.spajs.txs';

const transaction = {
  nonce: 'nonceIn',
  code_verifier: 'code_verifierIn',
  appState: 'appStateIn',
  scope: 'scopeIn',
  audience: ' audienceIn',
  redirect_uri: 'http://localhost',
  state: TEST_STATE
};

const transactionJson = JSON.stringify(transaction);

const transactionKey = (clientId = TEST_CLIENT_ID) =>
  `${TRANSACTION_KEY_PREFIX}.${clientId}`;

describe('transaction manager', () => {
  let tm: TransactionManager;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('get', () => {
    it('loads transactions from storage (per key)', () => {
      tm = new TransactionManager(SessionStorage, TEST_CLIENT_ID);

      tm.get();

      expect(sessionStorage.getItem).toHaveBeenCalledWith(transactionKey());
    });
  });

  describe('with empty transactions', () => {
    beforeEach(() => {
      tm = new TransactionManager(SessionStorage, TEST_CLIENT_ID);
    });

    it('`create` creates the transaction', () => {
      jest.mocked(sessionStorage.getItem).mockReturnValue(transactionJson);
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
      jest.mocked(sessionStorage.getItem).mockReturnValue(transactionJson);
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

  describe('CookieStorage usage', () => {
    it('`create` saves the transaction in the storage with the provided domain', () => {
      CookieStorage.save = jest.fn();
      const cookieDomain = 'vanity.auth.com';
      tm = new TransactionManager(CookieStorage, TEST_CLIENT_ID, cookieDomain);
      tm.create(transaction);

      expect(CookieStorage.save).toHaveBeenCalledWith(
        transactionKey(),
        expect.anything(),
        {
          daysUntilExpire: 1,
          cookieDomain: cookieDomain
        }
      );
    });

    it('`remove` deletes the transaction in the storage with the provided domain', () => {
      CookieStorage.remove = jest.fn();
      const cookieDomain = 'vanity.auth.com';
      tm = new TransactionManager(CookieStorage, TEST_CLIENT_ID, cookieDomain);
      tm.remove();

      expect(CookieStorage.remove).toHaveBeenCalledWith(transactionKey(), {
        cookieDomain: cookieDomain
      });
    });
  });
});
