import * as storage from '../src/storage';
jest.mock('es-cookie');

describe('storage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('saves object', () => {
    const key = 'key';
    const value = { some: 'value' };
    const options = { daysUntilExpire: 1 };
    storage.save(key, value, options);
    expect(require('es-cookie').set).toHaveBeenCalledWith(
      key,
      JSON.stringify(value),
      {
        expires: options.daysUntilExpire
      }
    );
  });
  it('returns undefined when there is no object', () => {
    const Cookie = require('es-cookie');
    const key = 'key';
    Cookie.get = k => {
      expect(k).toBe(key);
      return;
    };
    const outputValue = storage.get(key);
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
    const outputValue = storage.get(key);
    expect(outputValue).toMatchObject(value);
  });
  it('removes object', () => {
    const Cookie = require('es-cookie');
    const key = 'key';
    storage.remove(key);
    expect(Cookie.remove).toHaveBeenCalledWith(key);
  });
  describe('getAllKeys', () => {
    it('returns empty array when there is no cookie', () => {
      const Cookie = require('es-cookie');
      Cookie.getAll.mockReturnValue(null);
      const keys = storage.getAllKeys();
      expect(keys.length).toBe(0);
      expect(Cookie.getAll).toHaveBeenCalled();
    });
    it('gets all keys when there is a cookie', () => {
      const Cookie = require('es-cookie');
      Cookie.getAll.mockReturnValue({ key: 'value' });
      const keys = storage.getAllKeys();
      expect(keys.length).toBe(1);
      expect(keys[0]).toBe('key');
      expect(Cookie.getAll).toHaveBeenCalled();
    });
  });
});
