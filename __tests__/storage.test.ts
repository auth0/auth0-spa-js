import * as esCookie from 'es-cookie';
import { mocked } from 'ts-jest/utils';
import { CookieStorage, CookieStorageWithLegacySameSite } from '../src/storage';

jest.mock('es-cookie');

describe('CookieStorage', () => {
  let cookieMock;

  beforeEach(() => {
    cookieMock = mocked(esCookie);
  });
  it('saves object', () => {
    const key = 'key';
    const value = { some: 'value' };
    const options = { daysUntilExpire: 1 };
    CookieStorage.save(key, value, options);
    expect(cookieMock.set).toHaveBeenCalledWith(key, JSON.stringify(value), {
      expires: options.daysUntilExpire
    });
  });
  it('saves object with secure flag and samesite=none when on https', () => {
    const key = 'key';
    const value = { some: 'value' };
    const options = { daysUntilExpire: 1 };
    const originalLocation = window.location;
    delete window.location;
    window.location = { ...originalLocation, protocol: 'https:' };
    CookieStorage.save(key, value, options);
    expect(cookieMock.set).toHaveBeenCalledWith(key, JSON.stringify(value), {
      expires: options.daysUntilExpire,
      secure: true,
      sameSite: 'none'
    });
    window.location = originalLocation;
  });
  it('returns undefined when there is no object', () => {
    const Cookie = cookieMock;
    const key = 'key';
    Cookie.get = k => {
      expect(k).toBe(key);
      return;
    };
    const outputValue = CookieStorage.get(key);
    expect(outputValue).toBeUndefined();
  });
  it('gets object', () => {
    const Cookie = cookieMock;
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
    const Cookie = cookieMock;
    const key = 'key';
    CookieStorage.remove(key);
    expect(Cookie.remove).toHaveBeenCalledWith(key);
  });
});

describe('CookieStorageWithLegacySameSite', () => {
  let cookieMock;

  beforeEach(() => {
    cookieMock = mocked(esCookie);
  });
  it('saves object', () => {
    const key = 'key';
    const value = { some: 'value' };
    const options = { daysUntilExpire: 1 };
    CookieStorageWithLegacySameSite.save(key, value, options);
    expect(cookieMock.set).toHaveBeenCalledWith(key, JSON.stringify(value), {
      expires: options.daysUntilExpire
    });
    expect(cookieMock.set).toHaveBeenCalledWith(
      `_legacy_${key}`,
      JSON.stringify(value),
      {
        expires: options.daysUntilExpire
      }
    );
  });
  it('saves object with secure flag and samesite=none and legacy with no samesite when on https', () => {
    const key = 'key';
    const value = { some: 'value' };
    const options = { daysUntilExpire: 1 };
    const originalLocation = window.location;
    delete window.location;
    window.location = { ...originalLocation, protocol: 'https:' };
    CookieStorageWithLegacySameSite.save(key, value, options);
    expect(cookieMock.set).toHaveBeenCalledWith(key, JSON.stringify(value), {
      expires: options.daysUntilExpire,
      secure: true,
      sameSite: 'none'
    });
    expect(cookieMock.set).toHaveBeenCalledWith(
      `_legacy_${key}`,
      JSON.stringify(value),
      {
        expires: options.daysUntilExpire,
        secure: true
      }
    );
    window.location = originalLocation;
  });
  it('returns undefined when there is no object', () => {
    const Cookie = cookieMock;
    const key = 'key';
    Cookie.get = k => undefined;
    const outputValue = CookieStorageWithLegacySameSite.get(key);
    expect(outputValue).toBeUndefined();
  });
  it('returns modern samesite cookie when available', () => {
    const Cookie = cookieMock;
    const key = 'key';
    Cookie.get = k => {
      if (k === key) return JSON.stringify({ foo: 1 });
      return JSON.stringify({ bar: 2 });
    };
    const outputValue = CookieStorageWithLegacySameSite.get(key);
    expect(outputValue).toEqual({ foo: 1 });
  });
  it('falls back to legacy cookie when modern cookie is unavailable', () => {
    const Cookie = cookieMock;
    const key = 'key';
    Cookie.get = k => {
      if (k === key) return false;
      return JSON.stringify({ bar: 2 });
    };
    const outputValue = CookieStorageWithLegacySameSite.get(key);
    expect(outputValue).toEqual({ bar: 2 });
  });
  it('removes objects', () => {
    const Cookie = cookieMock;
    const key = 'key';
    CookieStorageWithLegacySameSite.remove(key);
    expect(Cookie.remove).toHaveBeenCalledWith(key);
    expect(Cookie.remove).toHaveBeenCalledWith(`_legacy_${key}`);
  });
});
