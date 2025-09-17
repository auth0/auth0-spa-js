import { expect } from '@jest/globals';

// @ts-ignore
import { Auth0Client } from '../../src';

const mockWindow = <any>global;

describe('Auth0Client', () => {
  beforeEach(() => {
    mockWindow.crypto = {
      subtle: {
        digest: () => 'foo'
      },
      getRandomValues() {
        return '123';
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('installPlugin', () => {
    it('returns register a plugin', async () => {
      const auth0 = new Auth0Client({
        domain: 'test',
        clientId: 'test'
      });
      const auth0WithPlugin = auth0.installPlugin({
        name: 'test',
        install: () => ({
          bar: () => 'bar'
        })
      });

      expect(auth0WithPlugin.bar()).toBe('bar');
    });

    it('should not allow overriding existing properties', async () => {
      const auth0 = new Auth0Client({
        domain: 'test',
        clientId: 'test'
      });

      expect(() =>
        auth0.installPlugin({
          name: 'test',
          install: () =>
            ({
              scope: 'foo'
            } as any)
        })
      ).toThrow();
    });

    it('should not allow overriding existing methods', async () => {
      const auth0 = new Auth0Client({
        domain: 'test',
        clientId: 'test'
      });

      expect(() =>
        auth0.installPlugin({
          name: 'test',
          install: () => ({
            loginWithRedirect: () => 'foo'
          })
        })
      ).toThrow();
    });

    it('should not allow overriding the same method twice', async () => {
      const auth0 = new Auth0Client({
        domain: 'test',
        clientId: 'test'
      });

      auth0.installPlugin({
        name: 'test',
        install: () => ({
          foo: () => 'foo'
        })
      });

      expect(() =>
        auth0.installPlugin({
          name: 'test2',
          install: () => ({
            foo: () => 'bar'
          })
        })
      ).toThrow();
    });

    it('should not allow overriding the same property twice', async () => {
      const auth0 = new Auth0Client({
        domain: 'test',
        clientId: 'test'
      });

      auth0.installPlugin({
        name: 'test',
        install: () => ({
          foo: 'foo'
        })
      });

      expect(() =>
        auth0.installPlugin({
          name: 'test2',
          install: () => ({
            foo: 'bar'
          })
        })
      ).toThrow();
    });
  });
});
