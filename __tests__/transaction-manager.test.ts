import TransactionManager from '../src/transaction-manager';

const COOKIE_KEY = 'a0.spajs.txs.';

const stateIn = 'stateIn';
const transaction = {
  nonce: 'nonceIn',
  code_verifier: 'code_verifierIn',
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
      getStorageMock().getAllKeys.mockReturnValue([
        'a0.spajs.txs.key1',
        'a0.spajs.txs.key2'
      ]);
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
      tm.create(stateIn, transaction);
      expect(tm.get(stateIn)).toMatchObject(transaction);
    });
    it('`create` saves the transaction in the storage', () => {
      tm.create(stateIn, transaction);
      expect(getStorageMock().save).toHaveBeenCalledWith(
        `a0.spajs.txs.${stateIn}`,
        transaction,
        {
          daysUntilExpire: 1
        }
      );
    });
    it('`get` without a transaction should return undefined', () => {
      expect(tm.get(stateIn)).toBeUndefined();
    });
    it('`get` with a transaction should return the transaction', () => {
      tm.create(stateIn, transaction);
      expect(tm.get(stateIn)).toMatchObject(transaction);
    });
    it('`remove` removes the transaction', () => {
      tm.create(stateIn, transaction);
      tm.remove(stateIn);
      expect(tm.get(stateIn)).toBeUndefined();
    });
    it('`remove` removes transaction from storage', () => {
      tm.create(stateIn, transaction);
      tm.remove(stateIn);
      expect(getStorageMock().remove).toHaveBeenLastCalledWith(
        `a0.spajs.txs.${stateIn}`
      );
    });
  });
});
