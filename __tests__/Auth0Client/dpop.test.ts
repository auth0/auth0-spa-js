/**
 * We don't need the DOM for this specific test suite.
 *
 * @jest-environment node
 */

import { Auth0Client, Auth0ClientOptions } from '../../src';
import {
  TEST_CLIENT_ID,
  TEST_DOMAIN,
  TEST_DPOP_NONCE,
  TEST_DPOP_PROOF
} from '../constants';

import { beforeEach, describe, expect } from '@jest/globals';
import { Dpop } from '../../src/dpop/dpop';

function newTestAuth0Client(
  extraOpts?: Partial<Auth0ClientOptions>
): Auth0Client {
  return new Auth0Client({
    ...extraOpts,
    domain: TEST_DOMAIN,
    clientId: TEST_CLIENT_ID
  });
}

describe('Auth0Client', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('_assertDpop()', () => {
    const auth0 = newTestAuth0Client();

    describe('DPoP disabled', () => {
      it('throws an error', () =>
        expect(() => auth0['_assertDpop'](undefined)).toThrow(
          '`useDpop` option must be enabled before using DPoP.'
        ));
    });

    describe('DPoP enabled', () => {
      const dpop = new Dpop(TEST_CLIENT_ID);

      it('does not throw', () =>
        expect(() => auth0['_assertDpop'](dpop)).not.toThrow());
    });
  });

  describe('getDpopNonce()', () => {
    const auth0 = newTestAuth0Client({ useDpop: true });
    const dpop = auth0['dpop']!;

    beforeEach(() => {
      auth0['_assertDpop'] = jest.fn();
      jest.spyOn(dpop, 'getNonce').mockResolvedValue(TEST_DPOP_NONCE);
    });

    let output: unknown;

    beforeEach(async () => {
      output = await auth0.getDpopNonce();
    });

    it('asserts DPoP is enabled', () =>
      expect(auth0['_assertDpop']).toHaveBeenCalled());

    it('returns the nonce', () => expect(output).toBe(TEST_DPOP_NONCE));
  });

  describe('setDpopNonce()', () => {
    const auth0 = newTestAuth0Client({ useDpop: true });
    const dpop = auth0['dpop']!;

    beforeEach(() => {
      auth0['_assertDpop'] = jest.fn();
      jest.spyOn(dpop, 'setNonce').mockResolvedValue();
    });

    beforeEach(() => auth0.setDpopNonce(TEST_DPOP_NONCE));

    it('asserts DPoP is enabled', () =>
      expect(auth0['_assertDpop']).toHaveBeenCalled());

    it('delegates into Dpop.setNonce()', () =>
      expect(dpop.setNonce).toHaveBeenCalledWith(TEST_DPOP_NONCE));
  });

  describe('generateDpopProof()', () => {
    const auth0 = newTestAuth0Client({ useDpop: true });
    const dpop = auth0['dpop']!;

    const params: Parameters<Auth0Client['generateDpopProof']>[0] = {
      accessToken: 'test-access-token',
      method: 'test-method',
      url: 'test-url',
      nonce: 'test-nonce'
    };

    beforeEach(() => {
      auth0['_assertDpop'] = jest.fn();
      jest.spyOn(dpop, 'generateProof').mockResolvedValue(TEST_DPOP_PROOF);
    });

    let output: string;

    beforeEach(async () => {
      output = await auth0.generateDpopProof(params);
    });

    it('asserts DPoP is enabled', () =>
      expect(auth0['_assertDpop']).toHaveBeenCalled());

    it('delegates into Dpop.generateProof()', () =>
      expect(dpop.generateProof).toHaveBeenCalledWith(params));

    it('returns the proof', () => expect(output).toBe(TEST_DPOP_PROOF));
  });
});
