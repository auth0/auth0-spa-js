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
          // organization: 'organizationA',
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
          // organization: 'organizationA',
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
          // organization: 'organizationA',
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
          // organization: 'organizationA',
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
          // organization: 'organizationA',
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
          // organization: 'organizationA',
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
            // organization: 'organizationA',
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
            // organization: 'organizationA',
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
});
