import {
  InMemoryCache,
  LocalStorageCache,
  ICache,
  CacheKey
} from '../src/cache';
import {
  TEST_ACCESS_TOKEN,
  TEST_AUDIENCE,
  TEST_CLIENT_ID,
  TEST_ID_TOKEN,
  TEST_REFRESH_TOKEN,
  TEST_SCOPES
} from './constants';

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

  it('returns undefined when there is no data', async () => {
    expect(await cache.get('some-fictional-key')).toBeFalsy();
  });

  it('retrieves values from the cache', async () => {
    const data = {
      client_id: TEST_CLIENT_ID,
      audience: 'the_audience',
      scope: TEST_SCOPES,
      id_token: TEST_ID_TOKEN,
      access_token: TEST_ACCESS_TOKEN,
      expires_in: dayInSeconds,
      decodedToken: {
        claims: {
          __raw: TEST_ID_TOKEN,
          exp: nowSeconds() + dayInSeconds,
          name: 'Test'
        },
        user: { name: 'Test' }
      }
    };

    const cacheKey = new CacheKey({
      client_id: TEST_CLIENT_ID,
      audience: 'the_audience',
      scope: TEST_SCOPES
    });

    await cache.set(cacheKey.toKey(), data);
    expect(await cache.get(cacheKey.toKey())).toStrictEqual(data);
  });

  it('retrieves values from the cache when scopes do not match', async () => {
    const data = {
      client_id: TEST_CLIENT_ID,
      audience: 'the_audience',
      scope: 'the_scope the_scope2',
      id_token: TEST_ID_TOKEN,
      access_token: TEST_ACCESS_TOKEN,
      expires_in: dayInSeconds,
      decodedToken: {
        claims: {
          __raw: TEST_ID_TOKEN,
          exp: nowSeconds() + dayInSeconds,
          name: 'Test'
        },
        user: { name: 'Test' }
      }
    };

    const cacheKey = new CacheKey({
      client_id: TEST_CLIENT_ID,
      audience: 'the_audience',
      scope: 'the_scope'
    });

    await cache.set(cacheKey.toKey(), data);
    expect(await cache.get(cacheKey.toKey())).toStrictEqual(data);
  });

  it('retrieves values from the cache when scopes do not match and multiple scopes are provided in a different order', async () => {
    const data = {
      client_id: TEST_CLIENT_ID,
      audience: 'the_audience',
      scope: 'the_scope the_scope2 the_scope3',
      id_token: TEST_ID_TOKEN,
      access_token: TEST_ACCESS_TOKEN,
      expires_in: dayInSeconds,
      decodedToken: {
        claims: {
          __raw: TEST_ID_TOKEN,
          exp: nowSeconds() + dayInSeconds,
          name: 'Test'
        },
        user: { name: 'Test' }
      }
    };

    const cacheKey = new CacheKey({
      client_id: TEST_CLIENT_ID,
      audience: 'the_audience',
      scope: 'the_scope3 the_scope'
    });

    await cache.set(cacheKey.toKey(), data);
    expect(await cache.get(cacheKey.toKey())).toStrictEqual(data);
  });

  it('returns undefined when not all scopes match', async () => {
    const data = {
      client_id: TEST_CLIENT_ID,
      audience: 'the_audience',
      scope: 'the_scope the_scope2 the_scope3',
      id_token: TEST_ID_TOKEN,
      access_token: TEST_ACCESS_TOKEN,
      expires_in: dayInSeconds,
      decodedToken: {
        claims: {
          __raw: TEST_ID_TOKEN,
          exp: nowSeconds() + dayInSeconds,
          name: 'Test'
        },
        user: { name: 'Test' }
      }
    };

    // Set cache with one set of scopes..
    await cache.set(
      new CacheKey({
        client_id: data.client_id,
        scope: data.scope,
        audience: data.audience
      }).toKey(),
      data
    );

    // Retrieve with another
    expect(
      await cache.get(
        new CacheKey({
          client_id: TEST_CLIENT_ID,
          audience: 'the_audience',
          scope: 'the_scope4 the_scope'
        }).toKey()
      )
    ).toBeFalsy();
  });

  /*it('returns undefined from the cache when expires_in < expiryAdjustmentSeconds', () => {
    const data = {
      client_id: TEST_CLIENT_ID,
      audience: 'the_audience',
      scope: TEST_SCOPES,
      id_token: TEST_ID_TOKEN,
      access_token: TEST_ACCESS_TOKEN,
      expires_in: 40,
      decodedToken: {
        claims: {
          __raw: TEST_ID_TOKEN,
          exp: nowSeconds() + dayInSeconds,
          name: 'Test'
        },
        user: { name: 'Test' }
      }
    };

    cache.save(data);

    expect(
      cache.get(
        new CacheKey({
          client_id: TEST_CLIENT_ID,
          audience: 'the_audience',
          scope: TEST_SCOPES
        }),
        60
      )
    ).toBeUndefined();
  });*/

  /*describe('when refresh tokens are used', () => {
    it('strips everything except the refresh token when expiry has been reached', () => {
      const now = Date.now();
      const realDateNow = Date.now.bind(global.Date);

      const data = {
        client_id: TEST_CLIENT_ID,
        audience: 'the_audience',
        scope: TEST_SCOPES,
        id_token: TEST_ID_TOKEN,
        access_token: TEST_ACCESS_TOKEN,
        refresh_token: 'refreshtoken',
        expires_in: dayInSeconds,
        decodedToken: {
          claims: {
            __raw: TEST_ID_TOKEN,
            name: 'Test',
            exp: nowSeconds() + dayInSeconds * 2
          },
          user: { name: 'Test' }
        }
      };

      cache.save(data);

      const cacheKey = new CacheKey({
        client_id: TEST_CLIENT_ID,
        audience: 'the_audience',
        scope: TEST_SCOPES
      });

      // Test that the cache state is normal up until just before the expiry time..
      expect(cache.get(cacheKey)).toStrictEqual(data);

      // Advance the time to just past the expiry..
      const dateNowStub = jest.fn(() => now + (dayInSeconds + 60) * 1000);
      global.Date.now = dateNowStub;

      expect(cache.get(cacheKey)).toStrictEqual({
        refresh_token: 'refreshtoken'
      });

      global.Date.now = realDateNow;
    });
  });*/

  /*it('expires the cache on read when the date.now > expires_in', () => {
    const now = Date.now();
    const realDateNow = Date.now.bind(global.Date);

    const data = {
      client_id: TEST_CLIENT_ID,
      audience: 'the_audience',
      scope: TEST_SCOPES,
      id_token: TEST_ID_TOKEN,
      access_token: TEST_ACCESS_TOKEN,
      expires_in: dayInSeconds,
      decodedToken: {
        claims: {
          __raw: TEST_ID_TOKEN,
          name: 'Test',
          exp: nowSeconds() + dayInSeconds * 2
        },
        user: { name: 'Test' }
      }
    };

    cache.save(data);

    const cacheKey = new CacheKey({
      client_id: TEST_CLIENT_ID,
      audience: 'the_audience',
      scope: TEST_SCOPES
    });

    // Test that the cache state is normal before we expire the data
    expect(cache.get(cacheKey)).toStrictEqual(data);

    // Advance the time to just past the expiry..
    const dateNowStub = jest.fn(() => (now + dayInSeconds + 100) * 1000);
    global.Date.now = dateNowStub;

    // And test that the cache has been emptied
    expect(cache.get(cacheKey)).toBeUndefined();

    global.Date.now = realDateNow;
  });*/

  /*it('expires the cache on read when the date.now > token.exp', () => {
    const now = Date.now();
    const realDateNow = Date.now.bind(global.Date);

    const data = {
      client_id: TEST_CLIENT_ID,
      audience: 'the_audience',
      scope: TEST_SCOPES,
      id_token: TEST_ID_TOKEN,
      access_token: TEST_ACCESS_TOKEN,
      expires_in: dayInSeconds * 2,
      decodedToken: {
        claims: {
          __raw: TEST_ID_TOKEN,
          name: 'Test',
          exp: nowSeconds() + dayInSeconds
        },
        user: { name: 'Test' }
      }
    };

    cache.save(data);

    const cacheKey = new CacheKey({
      client_id: TEST_CLIENT_ID,
      audience: 'the_audience',
      scope: TEST_SCOPES
    });

    // Test that the cache state is normal before we expire the data
    expect(cache.get(cacheKey)).toStrictEqual(data);

    // Advance the time to just past the expiry..
    const dateNowStub = jest.fn(() => (now + dayInSeconds + 100) * 1000);
    global.Date.now = dateNowStub;

    // And test that the cache has been emptied
    expect(cache.get(cacheKey)).toBeUndefined();

    global.Date.now = realDateNow;
  });*/
});

describe('LocalStorageCache', () => {
  let cache: ICache;
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
      client_id: TEST_CLIENT_ID,
      audience: TEST_AUDIENCE,
      scope: TEST_SCOPES,
      id_token: TEST_ID_TOKEN,
      access_token: TEST_ACCESS_TOKEN,
      expires_in: dayInSeconds,
      decodedToken: {
        claims: {
          __raw: TEST_ID_TOKEN,
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
    it('can retrieve an item from the cache', async () => {
      const cacheKey = new CacheKey({
        client_id: TEST_CLIENT_ID,
        audience: TEST_AUDIENCE,
        scope: TEST_SCOPES
      });

      await cache.set(cacheKey.toKey(), defaultEntry);
      expect(await cache.get(cacheKey.toKey())).toStrictEqual(defaultEntry);
    });

    it('can retrieve an item from the cache when scopes do not match', async () => {
      localStorage.setItem(
        `@@auth0spajs@@::${TEST_CLIENT_ID}::${TEST_AUDIENCE}::__TEST_SCOPE__ __TEST_SCOPE2__`,
        JSON.stringify(defaultEntry)
      );

      expect(
        await cache.get(
          new CacheKey({
            client_id: TEST_CLIENT_ID,
            audience: TEST_AUDIENCE,
            scope: '__TEST_SCOPE__'
          }).toKey()
        )
      ).toStrictEqual(defaultEntry);
    });

    it('can retrieve an item from the cache when scopes do not match and multiple scopes are provided in a different order', async () => {
      localStorage.setItem(
        `@@auth0spajs@@::${TEST_CLIENT_ID}::${TEST_AUDIENCE}::__TEST_SCOPE__ __TEST_SCOPE2__ __TEST_SCOPE3__`,
        JSON.stringify(defaultEntry)
      );

      expect(
        await cache.get(
          new CacheKey({
            client_id: TEST_CLIENT_ID,
            audience: TEST_AUDIENCE,
            scope: '__TEST_SCOPE3__ __TEST_SCOPE__'
          }).toKey()
        )
      ).toStrictEqual(defaultEntry);
    });

    it('returns undefined when not all scopes match', async () => {
      localStorage.setItem(
        `@@auth0spajs@@::${TEST_CLIENT_ID}::${TEST_AUDIENCE}::__TEST_SCOPE__ __TEST_SCOPE2__ __TEST_SCOPE3__`,
        JSON.stringify(defaultEntry)
      );

      expect(
        await cache.get(
          new CacheKey({
            client_id: TEST_CLIENT_ID,
            audience: TEST_AUDIENCE,
            scope: '__TEST_SCOPE4__ __TEST_SCOPE__'
          }).toKey()
        )
      ).toBeFalsy();
    });

    /*it('returns undefined when expires_in < expiryAdjustmentSeconds', () => {
      localStorage.setItem(
        `@@auth0spajs@@::${TEST_CLIENT_ID}::${TEST_AUDIENCE}::${TEST_SCOPES}`,
        JSON.stringify({
          body: defaultEntry,
          expiresAt: nowSeconds() + 40
        })
      );

      expect(
        cache.get(
          new CacheKey({
            client_id: TEST_CLIENT_ID,
            audience: TEST_AUDIENCE,
            scope: TEST_SCOPES
          }),
          60
        )
      ).toBeUndefined();
    });*/

    /*it('strips the cache data when expires_in < expiryAdjustmentSeconds and refresh tokens are being used', () => {
      localStorage.setItem(
        `@@auth0spajs@@::${TEST_CLIENT_ID}::${TEST_AUDIENCE}::${TEST_SCOPES}`,
        JSON.stringify({
          body: {
            ...defaultEntry,
            refresh_token: TEST_REFRESH_TOKEN
          },
          expiresAt: nowSeconds() + 40
        })
      );

      expect(
        cache.get(
          new CacheKey({
            client_id: TEST_CLIENT_ID,
            audience: TEST_AUDIENCE,
            scope: TEST_SCOPES
          }),
          60
        )
      ).toStrictEqual({
        refresh_token: TEST_REFRESH_TOKEN
      });
    });*/

    it('returns undefined when there is no data', async () => {
      expect(await cache.get('some-fictional-key')).toBeFalsy();
    });

    /*it('strips the data, leaving the refresh token, when the expiry has been reached', () => {
      localStorage.setItem(
        `@@auth0spajs@@::${TEST_CLIENT_ID}::${TEST_AUDIENCE}::${TEST_SCOPES}`,
        JSON.stringify({
          body: {
            client_id: TEST_CLIENT_ID,
            audience: TEST_AUDIENCE,
            scope: TEST_SCOPES,
            id_token: TEST_ID_TOKEN,
            access_token: TEST_ACCESS_TOKEN,
            refresh_token: TEST_REFRESH_TOKEN,
            expires_in: 10,
            decodedToken: {
              claims: {
                __raw: TEST_ID_TOKEN,
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
        cache.get(
          new CacheKey({
            client_id: TEST_CLIENT_ID,
            audience: TEST_AUDIENCE,
            scope: TEST_SCOPES
          })
        )
      ).toStrictEqual({
        refresh_token: TEST_REFRESH_TOKEN
      });
    });*/
  });

  /*it('expires after cache `expiresAt` when expiresAt < current time', () => {
    localStorage.setItem(
      `@@auth0spajs@@::${TEST_CLIENT_ID}::${TEST_AUDIENCE}::${TEST_SCOPES}`,
      JSON.stringify({
        body: {
          client_id: TEST_CLIENT_ID,
          audience: TEST_AUDIENCE,
          scope: TEST_SCOPES,
          id_token: TEST_ID_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          expires_in: 10,
          decodedToken: {
            claims: {
              __raw: TEST_ID_TOKEN,
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
      cache.get(
        new CacheKey({
          client_id: TEST_CLIENT_ID,
          audience: TEST_AUDIENCE,
          scope: TEST_SCOPES
        })
      )
    ).toBeUndefined();

    expect(localStorage.removeItem).toHaveBeenCalledWith(
      `@@auth0spajs@@::${TEST_CLIENT_ID}::${TEST_AUDIENCE}::${TEST_SCOPES}`
    );
  });*/

  describe('cache.set', () => {
    /*it('can set a value into the cache when expires_in < exp', () => {
      cache.save(defaultEntry);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        `@@auth0spajs@@::${TEST_CLIENT_ID}::${TEST_AUDIENCE}::${TEST_SCOPES}`,
        JSON.stringify({
          body: defaultEntry,
          expiresAt: nowSeconds() + dayInSeconds
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
        `@@auth0spajs@@::${TEST_CLIENT_ID}::${TEST_AUDIENCE}::${TEST_SCOPES}`,
        JSON.stringify({
          body: entry,
          expiresAt: nowSeconds() + 100
        })
      );
    });
  });*/

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
});
