import TransactionManager from '../src/transaction-manager';

const COOKIE_KEY = 'Auth0.spa-js.transactions.';

const transaction = {
  state: 'stateIn',
  nonce: 'nonceIn',
  code_verifier: 'code_verifierIn',
  code_challenge: 'code_challengeIn',
  appState: 'appStateIn',
  scope: 'scopeIn',
  audience: ' audienceIn'
};

jest.mock('../src/storage');
const getStorageMock = () => require('../src/storage');
describe('transaction manager', () => {
  let tm: TransactionManager;
  beforeEach(() => {
    jest.resetAllMocks();
  });
  describe('constructor', () => {
    it('loads transactions from localStorage (per key)', () => {
      getStorageMock().getAllKeys.mockReturnValue(['key1', 'key2']);
      tm = new TransactionManager();
      expect(getStorageMock().getAllKeys).toHaveBeenCalled();
      expect(getStorageMock().get).toHaveBeenCalledWith(`${COOKIE_KEY}key1`);
      expect(getStorageMock().get).toHaveBeenCalledWith(`${COOKIE_KEY}key2`);
    });
    it('does not load transactions if none was added', () => {
      getStorageMock().getAllKeys.mockReturnValue([]);
      tm = new TransactionManager();
      expect(getStorageMock().getAllKeys).toHaveBeenCalled();
      expect(getStorageMock().get).not.toHaveBeenCalled();
    });
  });
  describe('with empty transactions', () => {
    beforeEach(() => {
      getStorageMock().getAllKeys.mockReturnValue([
        `${COOKIE_KEY}key1`,
        `${COOKIE_KEY}key2`
      ]);
      tm = new TransactionManager();
    });
    it('`create` creates the transaction', () => {
      tm.create(transaction);
      expect(tm.get(transaction.state)).toMatchObject(transaction);
    });
    it('`create` saves the transaction in the storage', () => {
      tm.create(transaction);
      expect(getStorageMock().save).toHaveBeenCalledWith(
        `Auth0.spa-js.transactions.${transaction.state}`,
        transaction,
        {
          daysUntilExpire: 1
        }
      );
    });
    it('`get` without a transaction should return undefined', () => {
      expect(tm.get(transaction.state)).toBeUndefined();
    });
    it('`get` with a transaction should return the transaction', () => {
      tm.create(transaction);
      expect(tm.get(transaction.state)).toMatchObject(transaction);
    });
    it('`remove` removes the transaction', () => {
      tm.create(transaction);
      tm.remove(transaction.state);
      expect(tm.get(transaction.state)).toBeUndefined();
    });
    it('`remove` saves new transactions in storage', () => {
      const secondState = 'stateIn2';
      tm.create(transaction);
      tm.remove(transaction.state);
      expect(getStorageMock().remove).toHaveBeenLastCalledWith(
        `Auth0.spa-js.transactions.${transaction.state}`
      );
    });
  });
});
