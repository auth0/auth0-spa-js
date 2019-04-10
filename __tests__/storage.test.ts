import * as storage from '../src/storage';
jest.mock('es-cookie');

describe('cache', () => {
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
});
