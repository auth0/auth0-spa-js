import { DEFAULT_AUDIENCE } from '../src/constants';
import { getUniqueScopes, injectDefaultScopes, scopesToRequest } from '../src/scope';
import { expect } from '@jest/globals';

describe('getUniqueScopes', () => {
  it('removes duplicates', () => {
    expect(getUniqueScopes('openid openid', 'email')).toBe('openid email');
  });

  it('handles whitespace', () => {
    expect(getUniqueScopes(' openid    profile  ', ' ')).toBe('openid profile');
  });

  it('handles undefined/empty/null/whitespace', () => {
    expect(
      getUniqueScopes('openid profile', ' ', undefined, 'email', '', null)
    ).toBe('openid profile email');
  });
});

describe('injectDefaultScopes', () => {
  describe('when authScopes are not an object', () => {
    it('returns an object with default key', () => {
      const authScopes = 'read:orders create:orders';

      expect(
        injectDefaultScopes(authScopes, 'openId'),
      ).toMatchObject({
        [DEFAULT_AUDIENCE]: 'openId read:orders create:orders',
      });
    });
  });

  describe('when authScopes does not exist', () => {
    it('returns an object with default key', () => {
      const authScopes = undefined;

      expect(
        injectDefaultScopes(authScopes, 'openId'),
      ).toMatchObject({
        [DEFAULT_AUDIENCE]: 'openId',
      });
    });
  });

  describe('when auth0Scopes is an object', () => {
    it('returns an object with audience:scope and default key', () => {
      const authScopes = {
        orders: 'read:orders',
        users: 'create:users',
      };

      expect(
        injectDefaultScopes(authScopes, 'openId'),
      ).toMatchObject({
        [DEFAULT_AUDIENCE]: 'openId',
        orders: 'openId read:orders',
        users: 'openId create:users',
      });
    });
  });
});

describe('scopesToRequest', () => {
  describe('when audience exist inside authScopes', () => {
    it('returns a string of joined scopes', () => {
      const authScopes = {
        orders: 'openId read:orders',
        users: 'openId create:users',
        [DEFAULT_AUDIENCE]: 'openId'
      };
      const methodScopes = 'read:users';
      const audience = 'users';

      expect(
        scopesToRequest(authScopes, methodScopes, audience),
      ).toBe('openId create:users read:users');
    });
  });

  describe('when audience does not exist inside authScopes', () => {
    it('returns a string of joined default scopes and method scopes', () => {
      const authScopes = {
        orders: 'openId read:orders',
        users: 'openId create:users',
        [DEFAULT_AUDIENCE]: 'openId'
      };
      const methodScopes = 'read:users';
      const audience = 'books';

      expect(
        scopesToRequest(authScopes, methodScopes, audience),
      ).toBe('openId read:users');
    });
  });

  describe('when audience does not exist', () => {
    it('returns a string of joined default scopes and method scopes', () => {
      const authScopes = {
        orders: 'openId read:orders',
        users: 'openId create:users',
        [DEFAULT_AUDIENCE]: 'openId'
      };
      const methodScopes = 'read:users';
      const audience = undefined;

      expect(
        scopesToRequest(authScopes, methodScopes, audience),
      ).toBe('openId read:users');
    });
  });
});
