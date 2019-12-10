import { InMemoryCache, LocalStorageCache } from '../src/cache';

const nowSeconds = () => Math.floor(Date.now() / 1000);

describe('InMemoryCache', () => {
  let cache: InMemoryCache;

  beforeEach(() => {
    cache = new InMemoryCache();
    jest.useFakeTimers();
  });

  afterEach(jest.useRealTimers);

  it('returns undefined when there is no data', () => {
    expect(cache.get({ audience: 'a', scope: 's' })).toBeUndefined();
  });

  it('builds key correctly', () => {
    cache.save({
      audience: 'the_audiene',
      scope: 'the_scope',
      id_token: 'idtoken',
      access_token: 'accesstoken',
      expires_in: 1,
      decodedToken: {
        claims: { __raw: 'idtoken', exp: 1, name: 'Test' },
        user: { name: 'Test' }
      }
    });
    expect(Object.keys(cache.cache)[0]).toBe('the_audiene::the_scope');
  });
  it('builds key correctly', () => {
    cache.save({
      audience: 'the_audience',
      scope: 'the_scope',
      id_token: 'idtoken',
      access_token: 'accesstoken',
      expires_in: 1,
      decodedToken: {
        claims: { __raw: 'idtoken', name: 'Test' },
        user: { name: 'Test' }
      }
    });
    expect(Object.keys(cache.cache)[0]).toBe('the_audience::the_scope');
  });
  it('expires after `expires_in` when `expires_in` < `user.exp`', () => {
    cache.save({
      audience: 'the_audiene',
      scope: 'the_scope',
      id_token: 'idtoken',
      access_token: 'accesstoken',
      expires_in: 1,
      decodedToken: {
        claims: {
          __raw: 'idtoken',
          name: 'Test',
          exp: new Date().getTime() / 1000 + 2
        },
        user: { name: 'Test' }
      }
    });
    jest.advanceTimersByTime(799);
    expect(Object.keys(cache.cache).length).toBe(1);
    jest.advanceTimersByTime(1);
    expect(Object.keys(cache.cache).length).toBe(0);
  });
  it('expires after `user.exp` when `user.exp` < `expires_in`', () => {
    cache.save({
      audience: 'the_audiene',
      scope: 'the_scope',
      id_token: 'idtoken',
      access_token: 'accesstoken',
      expires_in: 2,
      decodedToken: {
        claims: {
          __raw: 'idtoken',
          name: 'Test',
          exp: new Date().getTime() / 1000 + 1
        },
        user: { name: 'Test' }
      }
    });
    jest.advanceTimersByTime(799);
    expect(Object.keys(cache.cache).length).toBe(1);
    jest.advanceTimersByTime(1);
    expect(Object.keys(cache.cache).length).toBe(0);
  });
});

describe('LocalStorageCache', () => {
  let cache;
  let realDateNow;
  let defaultEntry;

  beforeEach(() => {
    cache = new LocalStorageCache();

    jest.useFakeTimers();
    localStorage.clear();
    (<any>localStorage.removeItem).mockClear();

    const d = new Date();
    realDateNow = Date.now.bind(global.Date);

    const dateStub = jest.fn(() => d.getTime());
    global.Date.now = dateStub;

    defaultEntry = {
      audience: '__TEST_AUDIENCE__',
      scope: '__TEST_SCOPE__',
      id_token: '__ID_TOKEN__',
      access_token: '__ACCESS_TOKEN__',
      expires_in: 86400,
      decodedToken: {
        claims: {
          __raw: 'idtoken',
          exp: nowSeconds() + 86500,
          name: 'Test'
        },
        user: { name: 'Test' }
      }
    };
  });

  afterEach(() => {
    jest.useRealTimers();

    global.Date.now = realDateNow;
  });

  it('can set a value into the cache when expires_in < exp', () => {
    cache.save(defaultEntry);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      '@@auth0@@__TEST_AUDIENCE__::__TEST_SCOPE__',
      JSON.stringify({
        body: defaultEntry,
        expiresAt: nowSeconds() + 86400 - 60
      })
    );
  });

  it('can set a value into the cache when exp < expires_in', () => {
    const entry = Object.assign({}, defaultEntry, {
      expires_in: 86500,
      decodedToken: {
        claims: {
          exp: nowSeconds() + 100
        }
      }
    });

    cache.save(entry);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      '@@auth0@@__TEST_AUDIENCE__::__TEST_SCOPE__',
      JSON.stringify({
        body: entry,
        expiresAt: nowSeconds() + 40
      })
    );
  });

  it('can retrieve an item from the cache', () => {
    localStorage.setItem(
      '@@auth0@@__TEST_AUDIENCE__::__TEST_SCOPE__',
      JSON.stringify({
        body: defaultEntry,
        expiresAt: nowSeconds() + 86400
      })
    );

    expect(
      cache.get({ audience: '__TEST_AUDIENCE__', scope: '__TEST_SCOPE__' })
    ).toStrictEqual(defaultEntry);
  });

  it('returns undefined when there is no data', () => {
    expect(cache.get({ scope: '', audience: '' })).toBeUndefined();
  });

  it('expires after cache `expiresAt` when expiresAt < current time', () => {
    localStorage.setItem(
      '@@auth0@@__TEST_AUDIENCE__::__TEST_SCOPE__',
      JSON.stringify({
        body: {
          audience: '__TEST_AUDIENCE__',
          scope: '__TEST_SCOPE__',
          id_token: '__ID_TOKEN__',
          access_token: '__ACCESS_TOKEN__',
          expires_in: -10,
          decodedToken: {
            claims: {
              __raw: 'idtoken',
              exp: nowSeconds() - 5,
              name: 'Test'
            },
            user: { name: 'Test' }
          }
        },
        expiresAt: nowSeconds() - 10
      })
    );

    expect(
      cache.get({ audience: '__TEST_AUDIENCE__', scope: '__TEST_SCOPE__' })
    ).toBeUndefined();

    expect(localStorage.removeItem).toHaveBeenCalledWith(
      '@@auth0@@__TEST_AUDIENCE__::__TEST_SCOPE__'
    );
  });

  it('deletes the cache item once the timeout has been reached', () => {
    const entry = Object.assign({}, defaultEntry, {
      expires_in: 120,
      decodedToken: {
        claims: {
          exp: nowSeconds() + 240
        }
      }
    });

    cache.save(entry);

    // 96000, because the timeout time will be calculated at expires_in * 1000 * 0.8
    jest.advanceTimersByTime(96000);

    expect(localStorage.removeItem).toHaveBeenCalled();
  });

  it('removes the correct items when the cache is cleared', () => {
    const keys = ['some-key', '@@auth0@@key-1', 'some-key-2', '@@auth0@@key-2'];

    for (const key of keys) {
      localStorage.setItem(key, "doesn't matter what the data is");
    }

    cache.clear();

    expect(localStorage.removeItem).toHaveBeenCalledTimes(2);
    expect(localStorage.removeItem).toHaveBeenCalledWith('@@auth0@@key-1');
    expect(localStorage.removeItem).toHaveBeenCalledWith('@@auth0@@key-2');
  });
});
