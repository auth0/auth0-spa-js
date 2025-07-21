/**
 * We don't need the DOM for this specific test suite.
 *
 * @jest-environment node
 */

import { beforeEach, describe, expect } from '@jest/globals';
import { Dpop } from '../../src/dpop/dpop';
import * as dpopUtils from '../../src/dpop/utils';
import {
  TEST_ACCESS_TOKEN,
  TEST_CLIENT_ID,
  TEST_DPOP_KEYPAIR,
  TEST_DPOP_NONCE,
  TEST_DPOP_PROOF
} from '../constants';

function newTestDpop() {
  const dpop = new Dpop(TEST_CLIENT_ID);

  return { dpop, storage: dpop['storage'] };
}

describe('Dpop', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('getNonce', () => {
    const { dpop, storage } = newTestDpop();

    beforeEach(() => {
      jest.spyOn(storage, 'findNonce').mockResolvedValue(TEST_DPOP_NONCE);
    });

    let output: unknown;

    beforeEach(async () => {
      output = await dpop.getNonce();
    });

    it('delegates to storage.findNonce()', () =>
      expect(output).toBe(TEST_DPOP_NONCE));
  });

  describe('setNonce', () => {
    const { dpop, storage } = newTestDpop();

    beforeEach(() => {
      jest.spyOn(storage, 'setNonce').mockResolvedValue();
    });

    beforeEach(() => dpop.setNonce(TEST_DPOP_NONCE));

    it('delegates to storage.setNonce()', () =>
      expect(storage.setNonce).toHaveBeenCalledWith(TEST_DPOP_NONCE));
  });

  describe('getOrGenerateKeyPair()', () => {
    const { dpop, storage } = newTestDpop();

    describe('key pair already exists', () => {
      beforeEach(() => {
        storage.findKeyPair = () => Promise.resolve(TEST_DPOP_KEYPAIR);
        jest.spyOn(dpopUtils, 'generateKeyPair');
        jest.spyOn(storage, 'setKeyPair');
      });

      let output: dpopUtils.KeyPair;

      beforeEach(async () => {
        output = await dpop['getOrGenerateKeyPair']();
      });

      it('does not generate a key pair', () =>
        expect(dpopUtils.generateKeyPair).not.toHaveBeenCalled());

      it('does not store a key pair', () =>
        expect(storage.setKeyPair).not.toHaveBeenCalled());

      it('returns the key pair', () => expect(output).toBe(TEST_DPOP_KEYPAIR));
    });

    describe('otherwise', () => {
      beforeEach(() => {
        storage.findKeyPair = () => Promise.resolve(undefined);

        jest
          .spyOn(dpopUtils, 'generateKeyPair')
          .mockResolvedValue(TEST_DPOP_KEYPAIR);

        jest.spyOn(storage, 'setKeyPair').mockResolvedValue();
      });

      let output: dpopUtils.KeyPair;

      beforeEach(async () => {
        output = await dpop['getOrGenerateKeyPair']();
      });

      it('generates a key pair', () =>
        expect(dpopUtils.generateKeyPair).toHaveBeenCalled());

      it('stores the key pair', () =>
        expect(storage.setKeyPair).toHaveBeenCalled());

      it('returns the key pair', () => expect(output).toBe(TEST_DPOP_KEYPAIR));
    });
  });

  describe('generateProof()', () => {
    const url = 'https://example.com';
    const method = 'POST';

    describe('not passing a nonce', () => {
      const { dpop, storage } = newTestDpop();

      beforeEach(() => {
        storage.findNonce = () => Promise.resolve(TEST_DPOP_NONCE);
        dpop['getOrGenerateKeyPair'] = () => Promise.resolve(TEST_DPOP_KEYPAIR);
        jest
          .spyOn(dpopUtils, 'generateProof')
          .mockResolvedValue(TEST_DPOP_PROOF);
      });

      let output: string;

      beforeEach(async () => {
        output = await dpop.generateProof({
          url,
          method,
          accessToken: TEST_ACCESS_TOKEN
        });
      });

      it('delegates to generateProof() properly', () =>
        expect(dpopUtils.generateProof).toHaveBeenCalledWith({
          keyPair: TEST_DPOP_KEYPAIR,
          url,
          method,
          nonce: TEST_DPOP_NONCE,
          accessToken: TEST_ACCESS_TOKEN
        }));

      it('returns as expected', () => expect(output).toBe(TEST_DPOP_PROOF));
    });

    describe('passing a specific nonce', () => {
      const { dpop, storage } = newTestDpop();

      const fakeNonce = 'this-is-my-fake-nonce';

      beforeEach(() => {
        storage.findNonce = () => Promise.reject(new Error('not to be used!'));
        dpop['getOrGenerateKeyPair'] = () => Promise.resolve(TEST_DPOP_KEYPAIR);
        jest
          .spyOn(dpopUtils, 'generateProof')
          .mockResolvedValue(TEST_DPOP_PROOF);
      });

      let output: string;

      beforeEach(async () => {
        output = await dpop.generateProof({
          url,
          method,
          nonce: fakeNonce,
          accessToken: TEST_ACCESS_TOKEN
        });
      });

      it('delegates to generateProof() properly', () =>
        expect(dpopUtils.generateProof).toHaveBeenCalledWith({
          keyPair: TEST_DPOP_KEYPAIR,
          url,
          method,
          nonce: fakeNonce,
          accessToken: TEST_ACCESS_TOKEN
        }));

      it('returns as expected', () => expect(output).toBe(TEST_DPOP_PROOF));
    });
  });

  describe('calculateThumbprint()', () => {
    const { dpop } = newTestDpop();

    const fakeThumbprint = 'aaabbbccc123';

    beforeEach(() => {
      dpop['getOrGenerateKeyPair'] = () => Promise.resolve(TEST_DPOP_KEYPAIR);
      jest
        .spyOn(dpopUtils, 'calculateThumbprint')
        .mockResolvedValue(fakeThumbprint);
    });

    let output: string;

    beforeEach(async () => {
      output = await dpop.calculateThumbprint();
    });

    it('returns as expected', () => expect(output).toBe(fakeThumbprint));
  });

  describe('clear()', () => {
    const { dpop, storage } = newTestDpop();

    beforeEach(() => {
      jest.spyOn(storage, 'clearNonces').mockResolvedValue();
      jest.spyOn(storage, 'clearKeyPairs').mockResolvedValue();
    });

    beforeEach(() => dpop.clear());

    it('clears nonces', () => expect(storage.clearNonces).toHaveBeenCalled());

    it('clears keyPairs', () =>
      expect(storage.clearKeyPairs).toHaveBeenCalled());
  });
});
