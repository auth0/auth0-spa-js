import { CacheManager, InMemoryCache } from '../../src/cache';
import { CacheEntry, CacheKey } from '../../src/cache/shared';
import {
  TEST_ACCESS_TOKEN,
  TEST_AUDIENCE,
  TEST_CLIENT_ID,
  TEST_ID_TOKEN,
  TEST_SCOPES,
  dayInSeconds,
  nowSeconds
} from '../constants';

describe('CacheManager', () => {
  let manager: CacheManager;

  beforeEach(() => {
    manager = new CacheManager(new InMemoryCache().enclosedCache);
  });

  it('returns undefined from the cache when expires_in < expiryAdjustmentSeconds', async () => {
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

    await manager.set(data);

    expect(
      await manager.get(
        new CacheKey({
          client_id: TEST_CLIENT_ID,
          audience: 'the_audience',
          scope: TEST_SCOPES
        }),
        60
      )
    ).toBeFalsy();
  });

  describe('when refresh tokens are used', () => {
    it('strips everything except the refresh token when expiry has been reached', async () => {
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

      await manager.set(data);

      const cacheKey = new CacheKey({
        client_id: TEST_CLIENT_ID,
        audience: 'the_audience',
        scope: TEST_SCOPES
      });

      // Test that the cache state is normal up until just before the expiry time..
      expect(await manager.get(cacheKey)).toStrictEqual(data);

      // Advance the time to just past the expiry..
      const dateNowStub = jest.fn(() => now + (dayInSeconds + 60) * 1000);
      global.Date.now = dateNowStub;

      expect(await manager.get(cacheKey)).toStrictEqual({
        refresh_token: 'refreshtoken'
      });

      global.Date.now = realDateNow;
    });
  });

  it('expires the cache on read when the date.now > expires_in', async () => {
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

    await manager.set(data);

    const cacheKey = new CacheKey({
      client_id: TEST_CLIENT_ID,
      audience: 'the_audience',
      scope: TEST_SCOPES
    });

    // Test that the cache state is normal before we expire the data
    expect(await manager.get(cacheKey)).toStrictEqual(data);

    // Advance the time to just past the expiry..
    const dateNowStub = jest.fn(() => (now + dayInSeconds + 100) * 1000);
    global.Date.now = dateNowStub;

    // And test that the cache has been emptied
    expect(await manager.get(cacheKey)).toBeFalsy();

    global.Date.now = realDateNow;
  });

  it('expires the cache on read when the date.now > token.exp', async () => {
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

    await manager.set(data);

    const cacheKey = new CacheKey({
      client_id: TEST_CLIENT_ID,
      audience: 'the_audience',
      scope: TEST_SCOPES
    });

    // Test that the cache state is normal before we expire the data
    expect(await manager.get(cacheKey)).toStrictEqual(data);

    // Advance the time to just past the expiry..
    const dateNowStub = jest.fn(() => (now + dayInSeconds + 100) * 1000);
    global.Date.now = dateNowStub;

    // And test that the cache has been emptied
    expect(await manager.get(cacheKey)).toBeFalsy();

    global.Date.now = realDateNow;
  });
});
