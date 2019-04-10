import TransactionManager from '../src/transaction-manager';
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
const getStorageMock = () => ({
  get: require('../src/storage').get,
  save: require('../src/storage').save,
  remove: require('../src/storage').remove
});
describe('cache', () => {
  let tm: TransactionManager;
  beforeEach(() => {
    jest.resetAllMocks();
    tm = new TransactionManager();
  });

  it('should try to load transactions from storage in the constructor', () => {
    expect(getStorageMock().get).toHaveBeenCalledWith(
      'Auth0.login.transactions'
    );
  });
  it('`create` creates the transaction', () => {
    tm.create(transaction);
    expect(tm.get(transaction.state)).toMatchObject(transaction);
  });
  it('`create` saves the transaction in the storage', () => {
    tm.create(transaction);
    expect(getStorageMock().save).toHaveBeenCalledWith(
      'Auth0.login.transactions',
      { [transaction.state]: transaction },
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
    tm.create({ ...transaction, state: secondState });
    tm.remove(secondState);
    expect(getStorageMock().save).toHaveBeenLastCalledWith(
      'Auth0.login.transactions',
      { [transaction.state]: transaction },
      {
        daysUntilExpire: 1
      }
    );
  });
});
