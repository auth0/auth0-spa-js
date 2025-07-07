import { CacheKey } from "../../src/cache";
import { CacheManagerUtils } from "../../src/cache/cache-manager-utils";
import { TEST_AUDIENCE, TEST_CLIENT_ID } from "../constants";

describe('CacheManagerUtils', () => {
  describe('hasCompatibleScopes', () => {
    describe('when scopes match', () => {
      it('returns true', () => {
        const key = '@@auth0spajs@@::auth0_client_id::my_audience::read:user update:user';

        const keyToMatch = new CacheKey({
          clientId: TEST_CLIENT_ID,
          audience: TEST_AUDIENCE,
          scope: 'read:user'
        });

        const res = CacheManagerUtils.hasCompatibleScopes(
          key,
          keyToMatch,
        );

        expect(res).toEqual(true);
      });
    });
    describe('when scopes does not match', () => {
      it('returns false', () => {
        const key = '@@auth0spajs@@::auth0_client_id::my_audience::create:user update:user';

        const keyToMatch = new CacheKey({
          clientId: TEST_CLIENT_ID,
          audience: TEST_AUDIENCE,
          scope: 'read:user'
        });

        const res = CacheManagerUtils.hasCompatibleScopes(
          key,
          keyToMatch,
        );

        expect(res).toEqual(false);
      });
    });
  });

  describe('hasMatchingAudience', () => {
    describe('when audiences match', () => {
      it('returns true', () => {
        const key = '@@auth0spajs@@::auth0_client_id::my_audience::update:user update:user';

        const keyToMatch = new CacheKey({
          clientId: TEST_CLIENT_ID,
          audience: TEST_AUDIENCE,
          scope: 'read:user'
        });

        const res = CacheManagerUtils.hasMatchingAudience(
          key,
          keyToMatch,
        );

        expect(res).toEqual(true);
      });
    });
    describe('when audiences does not match', () => {
      it('returns false', () => {
        const key = '@@auth0spajs@@::auth0_client_id::my_new_audience::update:user update:user';

        const keyToMatch = new CacheKey({
          clientId: TEST_CLIENT_ID,
          audience: TEST_AUDIENCE,
          scope: 'read:user'
        });

        const res = CacheManagerUtils.hasMatchingAudience(
          key,
          keyToMatch,
        );

        expect(res).toEqual(false);
      });
    });
  });

  describe('hasDefaultParameters', () => {
    describe('when default parameters match', () => {
      it('returns true', () => {
        const key = '@@auth0spajs@@::auth0_client_id::my_audience::update:user update:user';

        const keyToMatch = new CacheKey({
          clientId: TEST_CLIENT_ID,
          audience: TEST_AUDIENCE,
          scope: 'read:user'
        });

        const res = CacheManagerUtils.hasDefaultParameters(
          key,
          keyToMatch,
        );

        expect(res).toEqual(true);
      });
    });
    describe('when default parameters match', () => {
      it('returns false', () => {
        const key = '@@auth0spajs@@::auth0_client_id_new::my_audience::update:user update:user';

        const keyToMatch = new CacheKey({
          clientId: TEST_CLIENT_ID,
          audience: TEST_AUDIENCE,
          scope: 'read:user'
        });

        const res = CacheManagerUtils.hasDefaultParameters(
          key,
          keyToMatch,
        );

        expect(res).toEqual(false);
      });
    });
  });

  describe('isTokenExpired', () => {
    describe('when token is expired', () => {
      it('returns true', async () => {
        const nowProvider = () => 1234;

        const entry = {
          body: {
            clientId: TEST_CLIENT_ID,
            audience: TEST_AUDIENCE,
            scope: 'read:user',
          },
          expiresAt: 0,
        };

        const res = await CacheManagerUtils.isTokenExpired(
          entry,
          0,
          nowProvider,
        );

        expect(res).toEqual(true);
      });
    });
    describe('when token is not expired', () => {
      it('returns false', async () => {
        const nowProvider = () => 1234;

        const entry = {
          body: {
            clientId: TEST_CLIENT_ID,
            audience: TEST_AUDIENCE,
            scope: 'read:user',
          },
          expiresAt: 0,
        };

        const res = await CacheManagerUtils.isTokenExpired(
          entry,
          1234,
          nowProvider,
        );

        expect(res).toEqual(true);
      });
    });
  });

  describe('isMatchingKey', () => {
    it('calls hasMatchingAudience, hasMatchingOrganization and hasCompatibleScopes', () => {
      const entry = new CacheKey({
        clientId: TEST_CLIENT_ID,
        audience: TEST_AUDIENCE,
        scope: 'read:user update:user'
      });

      const key = '@@auth0spajs@@::auth0_client_id::my_audience::read:user update:user';

      jest.spyOn(CacheManagerUtils, 'hasCompatibleScopes');
      jest.spyOn(CacheManagerUtils, 'hasMatchingAudience');

      CacheManagerUtils.isMatchingKey(key, entry);

      expect(CacheManagerUtils.hasCompatibleScopes).toHaveBeenCalledTimes(1);
      expect(CacheManagerUtils.hasMatchingAudience).toHaveBeenCalledTimes(1);
    });
  });

  describe('findKey', () => {
    describe('when some key from cache matches', () => {
      it('returns key', () => {
        const entry = new CacheKey({
          clientId: TEST_CLIENT_ID,
          audience: TEST_AUDIENCE,
          scope: 'read:user update:user'
        });

        const keys = ['@@auth0spajs@@::auth0_client_id::my_audience::read:user update:user'];

        jest.spyOn(CacheManagerUtils, 'hasDefaultParameters').mockReturnValue(true);
        jest.spyOn(CacheManagerUtils, 'isMatchingKey').mockReturnValue(true);

        const res = CacheManagerUtils.findKey(keys, entry);

        expect(res).toEqual(keys[0]);
        expect(CacheManagerUtils.hasDefaultParameters).toHaveBeenCalledTimes(1);
        expect(CacheManagerUtils.isMatchingKey).toHaveBeenCalledTimes(1);
      });
    });
    describe('when no key from cache matches', () => {
      it('returns undefined', () => {
        const entry = new CacheKey({
          clientId: TEST_CLIENT_ID,
          audience: TEST_AUDIENCE,
          scope: 'read:user update:user'
        });

        const keys = ['@@auth0spajs@@::auth0_client_id::my_audience::read:user update:user'];

        jest.spyOn(CacheManagerUtils, 'hasDefaultParameters').mockReturnValue(false);
        jest.spyOn(CacheManagerUtils, 'isMatchingKey').mockReturnValue(false);

        const res = CacheManagerUtils.findKey(keys, entry);

        expect(res).toEqual(undefined);
        expect(CacheManagerUtils.hasDefaultParameters).toHaveBeenCalled();
        expect(CacheManagerUtils.isMatchingKey).toHaveBeenCalled();
      });
    });
  });
});
