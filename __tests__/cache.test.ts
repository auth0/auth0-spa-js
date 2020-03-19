import { InMemoryCache, LocalStorageCache, ICache } from '../src/cache';

const nowSeconds = () => Math.floor(Date.now() / 1000);
const dayInSeconds = 86400;

describe('InMemoryCache', () => {
  let cache: ICache;
  let OriginalDate: Date;

  beforeEach(() => {
    OriginalDate = (<any>global).Date;
    (<any>global).Date = class {
      time: number;
      static staticTime: number;

      constructor(time: number) {
        this.time = time;
      }
      getTime() {
        return this.time || 0;
      }
      static now() {
        return this.staticTime || 0;
      }
    };
  });

  afterEach(() => {
    (<any>global).Date = OriginalDate;
  });

  beforeEach(() => {
    cache = new InMemoryCache().enclosedCache;
    jest.useFakeTimers();
  });

  afterEach(jest.useRealTimers);

  it('returns undefined when there is no data', () => {
    expect(
      cache.get({
        client_id: 'test-client',
        audience: 'a',
        scope: 's'
      })
    ).toBeUndefined();
  });

  it('retrieves values from the cache', () => {
    const data = {
      client_id: 'test-client',
      audience: 'the_audience',
      scope: 'the_scope',
      id_token: 'idtoken',
      access_token: 'accesstoken',
      expires_in: dayInSeconds,
      decodedToken: {
        claims: {
          __raw: 'idtoken',
          exp: nowSeconds() + dayInSeconds,
          name: 'Test'
        },
        user: { name: 'Test' }
      }
    };

    cache.save(data);

    expect(
      cache.get({
        client_id: 'test-client',
        audience: 'the_audience',
        scope: 'the_scope'
      })
    ).toStrictEqual(data);
  });

  describe('when refresh tokens are used', () => {
    it('strips everything except the refresh token when expiry has been reached', () => {
      const now = Date.now();
      const realDateNow = Date.now.bind(global.Date);

      const data = {
        client_id: 'test-client',
        audience: 'the_audience',
        scope: 'the_scope',
        id_token: 'idtoken',
        access_token: 'accesstoken',
        refresh_token: 'refreshtoken',
        expires_in: dayInSeconds,
        decodedToken: {
          claims: {
            __raw: 'idtoken',
            name: 'Test',
            exp: nowSeconds() + dayInSeconds * 2
          },
          user: { name: 'Test' }
        }
      };

      cache.save(data);

      const cacheEntry = {
        client_id: 'test-client',
        audience: 'the_audience',
        scope: 'the_scope'
      };

      // Test that the cache state is normal up until just before the expiry time..
      expect(cache.get(cacheEntry)).toStrictEqual(data);

      // Advance the time to just past the expiry..
      const dateNowStub = jest.fn(() => now + (dayInSeconds + 60) * 1000);
      global.Date.now = dateNowStub;

      expect(cache.get(cacheEntry)).toStrictEqual({
        refresh_token: 'refreshtoken'
      });

      global.Date.now = realDateNow;
    });
  });

  it('expires the cache on read when the date.now > expires_in', () => {
    const now = Date.now();
    const realDateNow = Date.now.bind(global.Date);

    const data = {
      client_id: 'test-client',
      audience: 'the_audience',
      scope: 'the_scope',
      id_token: 'idtoken',
      access_token: 'accesstoken',
      expires_in: dayInSeconds,
      decodedToken: {
        claims: {
          __raw: 'idtoken',
          name: 'Test',
          exp: nowSeconds() + dayInSeconds * 2
        },
        user: { name: 'Test' }
      }
    };

    cache.save(data);

    const cacheEntry = {
      client_id: 'test-client',
      audience: 'the_audience',
      scope: 'the_scope'
    };

    // Test that the cache state is normal before we expire the data
    expect(cache.get(cacheEntry)).toStrictEqual(data);

    // Advance the time to just past the expiry..
    const dateNowStub = jest.fn(() => (now + dayInSeconds + 100) * 1000);
    global.Date.now = dateNowStub;

    // And test that the cache has been emptied
    expect(cache.get(cacheEntry)).toBeUndefined();

    global.Date.now = realDateNow;
  });

  it('expires the cache on read when the date.now > token.exp', () => {
    const now = Date.now();
    const realDateNow = Date.now.bind(global.Date);

    const data = {
      client_id: 'test-client',
      audience: 'the_audience',
      scope: 'the_scope',
      id_token: 'idtoken',
      access_token: 'accesstoken',
      expires_in: dayInSeconds * 2,
      decodedToken: {
        claims: {
          __raw: 'idtoken',
          name: 'Test',
          exp: nowSeconds() + dayInSeconds
        },
        user: { name: 'Test' }
      }
    };

    cache.save(data);

    const cacheEntry = {
      client_id: 'test-client',
      audience: 'the_audience',
      scope: 'the_scope'
    };

    // Test that the cache state is normal before we expire the data
    expect(cache.get(cacheEntry)).toStrictEqual(data);

    // Advance the time to just past the expiry..
    const dateNowStub = jest.fn(() => (now + dayInSeconds + 100) * 1000);
    global.Date.now = dateNowStub;

    // And test that the cache has been emptied
    expect(cache.get(cacheEntry)).toBeUndefined();

    global.Date.now = realDateNow;
  });
});

describe('LocalStorageCache', () => {
  let cache;
  let realDateNow;
  let defaultEntry;

  beforeEach(() => {
    cache = new LocalStorageCache();

    jest.clearAllMocks();
    jest.useFakeTimers();
    localStorage.clear();
    (<any>localStorage.removeItem).mockClear();

    const d = new Date();
    realDateNow = Date.now.bind(global.Date);

    const dateStub = jest.fn(() => d.getTime());
    global.Date.now = dateStub;

    defaultEntry = {
      client_id: '__TEST_CLIENT_ID__',
      audience: '__TEST_AUDIENCE__',
      scope: '__TEST_SCOPE__',
      id_token: '__ID_TOKEN__',
      access_token: '__ACCESS_TOKEN__',
      expires_in: dayInSeconds,
      decodedToken: {
        claims: {
          __raw: 'idtoken',
          exp: nowSeconds() + dayInSeconds + 100,
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

  describe('cache.get', () => {
    it('can retrieve an item from the cache', () => {
      localStorage.setItem(
        '@@auth0spajs@@::__TEST_CLIENT_ID__::__TEST_AUDIENCE__::__TEST_SCOPE__',
        JSON.stringify({
          body: defaultEntry,
          expiresAt: nowSeconds() + dayInSeconds
        })
      );

      expect(
        cache.get({
          client_id: '__TEST_CLIENT_ID__',
          audience: '__TEST_AUDIENCE__',
          scope: '__TEST_SCOPE__'
        })
      ).toStrictEqual(defaultEntry);
    });

    it('returns undefined when there is no data', () => {
      expect(cache.get({ scope: '', audience: '' })).toBeUndefined();
    });

    it('strips the data, leaving the refresh token, when the expiry has been reached', () => {
      localStorage.setItem(
        '@@auth0spajs@@::__TEST_CLIENT_ID__::__TEST_AUDIENCE__::__TEST_SCOPE__',
        JSON.stringify({
          body: {
            client_id: '__TEST_CLIENT_ID__',
            audience: '__TEST_AUDIENCE__',
            scope: '__TEST_SCOPE__',
            id_token: '__ID_TOKEN__',
            access_token: '__ACCESS_TOKEN__',
            refresh_token: '__REFRESH_TOKEN__',
            expires_in: 10,
            decodedToken: {
              claims: {
                __raw: 'idtoken',
                exp: nowSeconds() + 15,
                name: 'Test'
              },
              user: { name: 'Test' }
            }
          },
          expiresAt: nowSeconds() + 10
        })
      );

      const now = nowSeconds();
      global.Date.now = jest.fn(() => (now + 30) * 1000);

      expect(
        cache.get({
          client_id: '__TEST_CLIENT_ID__',
          audience: '__TEST_AUDIENCE__',
          scope: '__TEST_SCOPE__'
        })
      ).toStrictEqual({
        refresh_token: '__REFRESH_TOKEN__'
      });
    });
  });

  it('expires after cache `expiresAt` when expiresAt < current time', () => {
    localStorage.setItem(
      '@@auth0spajs@@::__TEST_CLIENT_ID__::__TEST_AUDIENCE__::__TEST_SCOPE__',
      JSON.stringify({
        body: {
          client_id: '__TEST_CLIENT_ID__',
          audience: '__TEST_AUDIENCE__',
          scope: '__TEST_SCOPE__',
          id_token: '__ID_TOKEN__',
          access_token: '__ACCESS_TOKEN__',
          expires_in: 10,
          decodedToken: {
            claims: {
              __raw: 'idtoken',
              exp: nowSeconds() + 15,
              name: 'Test'
            },
            user: { name: 'Test' }
          }
        },
        expiresAt: nowSeconds() + 10
      })
    );

    const now = nowSeconds();
    global.Date.now = jest.fn(() => (now + 30) * 1000);

    expect(
      cache.get({
        client_id: '__TEST_CLIENT_ID__',
        audience: '__TEST_AUDIENCE__',
        scope: '__TEST_SCOPE__'
      })
    ).toBeUndefined();

    expect(localStorage.removeItem).toHaveBeenCalledWith(
      '@@auth0spajs@@::__TEST_CLIENT_ID__::__TEST_AUDIENCE__::__TEST_SCOPE__'
    );
  });

  describe('cache.save', () => {
    it('can set a value into the cache when expires_in < exp', () => {
      cache.save(defaultEntry);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        '@@auth0spajs@@::__TEST_CLIENT_ID__::__TEST_AUDIENCE__::__TEST_SCOPE__',
        JSON.stringify({
          body: defaultEntry,
          expiresAt: nowSeconds() + dayInSeconds - 60
        })
      );
    });

    it('can set a value into the cache when exp < expires_in', () => {
      const entry = Object.assign({}, defaultEntry, {
        expires_in: dayInSeconds + 100,
        decodedToken: {
          claims: {
            exp: nowSeconds() + 100
          }
        }
      });

      cache.save(entry);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        '@@auth0spajs@@::__TEST_CLIENT_ID__::__TEST_AUDIENCE__::__TEST_SCOPE__',
        JSON.stringify({
          body: entry,
          expiresAt: nowSeconds() + 40
        })
      );
    });
  });

  it('removes the correct items when the cache is cleared', () => {
    const keys = [
      'some-key',
      '@@auth0spajs@@::key-1',
      'some-key-2',
      '@@auth0spajs@@::key-2'
    ];

    for (const key of keys) {
      localStorage.setItem(key, "doesn't matter what the data is");
    }

    cache.clear();

    expect(localStorage.removeItem).toHaveBeenCalledTimes(2);
    expect(localStorage.removeItem).toHaveBeenCalledWith(
      '@@auth0spajs@@::key-1'
    );
    expect(localStorage.removeItem).toHaveBeenCalledWith(
      '@@auth0spajs@@::key-2'
    );
  });
});
