/**
 * We don't need the DOM for this specific test suite.
 *
 * @jest-environment node
 */

import { describe, expect } from '@jest/globals';
import * as dpopLib from 'dpop';
import * as dpopUtils from '../../src/dpop/utils';
import {
  TEST_ACCESS_TOKEN,
  TEST_DPOP_KEYPAIR,
  TEST_DPOP_NONCE
} from '../constants';

describe('utils', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('generateKeyPair()', () => {
    beforeEach(() => {
      jest
        .spyOn(dpopLib, 'generateKeyPair')
        .mockResolvedValue(TEST_DPOP_KEYPAIR);
    });

    beforeEach(() => dpopUtils.generateKeyPair());

    it('delegates to dpop lib properly', () =>
      expect(dpopLib.generateKeyPair).toHaveBeenCalledWith('ES256', {
        extractable: false
      }));
  });

  describe('calculateThumbprint()', () => {
    beforeEach(() => {
      jest.spyOn(dpopLib, 'calculateThumbprint').mockResolvedValue('abc123');
    });

    beforeEach(() => dpopUtils.calculateThumbprint(TEST_DPOP_KEYPAIR));

    it('delegates to dpop lib properly', () =>
      expect(dpopLib.calculateThumbprint).toHaveBeenCalledWith(
        TEST_DPOP_KEYPAIR.publicKey
      ));
  });

  describe('generateProof()', () => {
    const originalUrl = 'https://user:pass@www.example.com:123/foo?bar=1#frag';
    const expectedUrl = 'https://user:pass@www.example.com:123/foo';

    const params = {
      keyPair: TEST_DPOP_KEYPAIR,
      url: originalUrl,
      method: 'PATCH',
      nonce: TEST_DPOP_NONCE,
      accessToken: TEST_ACCESS_TOKEN
    };

    beforeEach(() => {
      jest.spyOn(dpopLib, 'generateProof').mockResolvedValue('abc123');
    });

    beforeEach(() => dpopUtils.generateProof(params));

    it('delegates to dpop lib properly', () =>
      expect(dpopLib.generateProof).toHaveBeenCalledWith(
        params.keyPair,
        expectedUrl,
        params.method,
        params.nonce,
        params.accessToken
      ));
  });

  describe('isGrantTypeSupported()', () => {
    const cases: [string, boolean][] = [
      ['authorization_code', true],
      ['client_credentials', false],
      ['implicit', false],
      ['password', false],
      ['refresh_token', true],
      ['urn:ietf:params:oauth:grant-type:device_code', false],
      ['urn:ietf:params:oauth:grant-type:jwt-bearer', false],
      ['urn:ietf:params:oauth:grant-type:saml2-bearer', false],
      ['urn:ietf:params:oauth:grant-type:token-exchange', true],
      ['urn:ietf:params:oauth:grant-type:uma-ticket', false]
    ];

    describe.each(cases)('%s', (grantType, expected) => {
      it(`returns ${expected}`, () =>
        expect(dpopUtils.isGrantTypeSupported(grantType)).toBe(expected));
    });
  });
});
