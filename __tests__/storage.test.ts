import { CookieStorage } from '../src/storage';
jest.mock('es-cookie');

describe('cookie storage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('saves object', () => {
    const key = 'key';
    const value = { some: 'value' };
    const options = { daysUntilExpire: 1 };
    CookieStorage.save(key, value, options);
    expect(require('es-cookie').set).toHaveBeenCalledWith(
      key,
      JSON.stringify(value),
      {
        expires: options.daysUntilExpire
      }
    );
  });
  it('saves object with secure flag and samesite=none when on https', () => {
    const key = 'key';
    const value = { some: 'value' };
    const options = { daysUntilExpire: 1 };
    const originalLocation = window.location;
    delete window.location;
    window.location = { ...originalLocation, protocol: 'https:' };
    CookieStorage.save(key, value, options);
    expect(require('es-cookie').set).toHaveBeenCalledWith(
      key,
      JSON.stringify(value),
      {
        expires: options.daysUntilExpire,
        secure: true,
        sameSite: 'none'
      }
    );
    window.location = originalLocation;
  });
  it('returns undefined when there is no object', () => {
    const Cookie = require('es-cookie');
    const key = 'key';
    Cookie.get = k => {
      expect(k).toBe(key);
      return;
    };
    const outputValue = CookieStorage.get(key);
    expect(outputValue).toBeUndefined();
  });
  it('gets object', () => {
    const Cookie = require('es-cookie');
    const key = 'key';
    const value = { some: 'value' };
    Cookie.get = k => {
      expect(k).toBe(key);
      return JSON.stringify(value);
    };
    const outputValue = CookieStorage.get(key);
    expect(outputValue).toMatchObject(value);
  });
  it('removes object', () => {
    const Cookie = require('es-cookie');
    const key = 'key';
    CookieStorage.remove(key);
    expect(Cookie.remove).toHaveBeenCalledWith(key);
  });
  describe('getAllKeys', () => {
    it('returns empty array when there is no cookie', () => {
      const Cookie = require('es-cookie');
      Cookie.getAll.mockReturnValue(null);
      const keys = CookieStorage.getAllKeys();
      expect(keys.length).toBe(0);
      expect(Cookie.getAll).toHaveBeenCalled();
    });
    it('gets all keys when there is a cookie', () => {
      const Cookie = require('es-cookie');
      Cookie.getAll.mockReturnValue({ key: 'value' });
      const keys = CookieStorage.getAllKeys();
      expect(keys.length).toBe(1);
      expect(keys[0]).toBe('key');
      expect(Cookie.getAll).toHaveBeenCalled();
    });
  });
});
