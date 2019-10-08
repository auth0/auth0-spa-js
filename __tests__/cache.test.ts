import Cache from '../src/cache';

describe('cache', () => {
  let cache: Cache;
  beforeEach(() => {
    cache = new Cache();
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
      audience: 'the_audiene',
      scope: 'the_scope',
      id_token: 'idtoken',
      access_token: 'accesstoken',
      expires_in: 1,
      decodedToken: {
        claims: { __raw: 'idtoken', name: 'Test' },
        user: { name: 'Test' }
      }
    });
    expect(Object.keys(cache.cache)[0]).toBe('the_audiene::the_scope');
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
