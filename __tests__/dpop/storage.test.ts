import { beforeEach, describe, expect } from '@jest/globals';
import 'fake-indexeddb/auto';
import { DpopStorage } from '../../src/dpop/storage';
import {
  TEST_CLIENT_ID,
  TEST_DPOP_KEYPAIR,
  TEST_DPOP_NONCE
} from '../constants';

describe('DpopStorage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  let storage: DpopStorage;

  beforeEach(async () => {
    // start fresh
    window.indexedDB = new IDBFactory();

    storage = new DpopStorage(TEST_CLIENT_ID);
  });

  describe('createDbHandle()', () => {
    const fakeNewVersion = Number.MAX_SAFE_INTEGER;

    beforeEach(() => {
      storage['getVersion'] = () => fakeNewVersion;
    });

    let output: IDBDatabase;

    beforeEach(async () => {
      output = await storage['createDbHandle']();
    });

    it('database is properly upgraded and created', () =>
      expect(output.version).toBe(fakeNewVersion));
  });

  describe('getDbHandle()', () => {
    const fakeDbHandle = {} as IDBDatabase;

    beforeEach(() => {
      storage = new DpopStorage(TEST_CLIENT_ID);
      storage['createDbHandle'] = jest.fn().mockResolvedValue(fakeDbHandle);
    });

    describe('handle exists', () => {
      beforeEach(() => {
        storage['dbHandle'] = fakeDbHandle;
      });

      beforeEach(() => storage['getDbHandle']());

      it('does not create handle', () =>
        expect(storage['createDbHandle']).not.toHaveBeenCalled());
    });

    describe('otherwise', () => {
      beforeEach(() => {
        storage['dbHandle'] = undefined;
      });

      beforeEach(() => storage['getDbHandle']());

      it('creates new handle', () =>
        expect(storage['createDbHandle']).toHaveBeenCalled());
    });
  });

  describe('executeDbRequest()', () => {
    describe('on successful request', () => {
      let output: unknown;

      beforeEach(async () => {
        output = await storage['executeDbRequest']('keypair', 'readwrite', t =>
          t.getAll()
        );
      });

      it('returns result', () => expect(output).toEqual([]));
    });

    describe('on failed request', () => {
      let error: Error | undefined;

      beforeEach(async () => {
        try {
          await storage['executeDbRequest'](
            'non-existing-table',
            'readwrite',
            t => t.getAll()
          );
        } catch (err) {
          error = err;
        }
      });

      it('throws error', () =>
        expect(error?.message).toBe(
          'No objectStore named non-existing-table in this database'
        ));
    });
  });

  describe('setNonce()', () => {
    beforeEach(() => {
      storage['save'] = jest.fn();
    });

    beforeEach(() => storage.setNonce(TEST_DPOP_NONCE));

    it('saves nonce properly', () =>
      expect(storage['save']).toHaveBeenCalledWith(
        'nonce',
        TEST_CLIENT_ID,
        TEST_DPOP_NONCE
      ));
  });

  describe('setKeyPair()', () => {
    beforeEach(() => {
      storage['save'] = jest.fn();
    });

    beforeEach(() => storage.setKeyPair(TEST_DPOP_KEYPAIR));

    it('saves key pair properly', () =>
      expect(storage['save']).toHaveBeenCalledWith(
        'keypair',
        TEST_CLIENT_ID,
        TEST_DPOP_KEYPAIR
      ));
  });

  describe('save()', () => {
    const table = 'nonce';
    const key = 'some-key';
    const value = Math.random().toString();

    beforeEach(() => storage['save'](table, key, value));

    it('saves as expected', () =>
      expect(storage['find'](table, key)).resolves.toBe(value));
  });

  describe('findNonce()', () => {
    beforeEach(() => {
      storage['find'] = jest.fn();
    });

    beforeEach(() => storage.findNonce());

    it('delegates to find() properly', () =>
      expect(storage['find']).toHaveBeenCalledWith('nonce', TEST_CLIENT_ID));
  });

  describe('findKeyPair()', () => {
    beforeEach(() => {
      storage['find'] = jest.fn();
    });

    beforeEach(() => storage.findKeyPair());

    it('delegates to find() properly', () =>
      expect(storage['find']).toHaveBeenCalledWith('keypair', TEST_CLIENT_ID));
  });

  describe('clearNonces()', () => {
    beforeEach(() => {
      storage['clear'] = jest.fn();
    });

    beforeEach(() => storage.clearNonces());

    it('delegates to clear() properly', () =>
      expect(storage['clear']).toHaveBeenCalledWith('nonce', TEST_CLIENT_ID));
  });

  describe('clearKeyPairs()', () => {
    beforeEach(() => {
      storage['clear'] = jest.fn();
    });

    beforeEach(() => storage.clearKeyPairs());

    it('delegates to clear() properly', () =>
      expect(storage['clear']).toHaveBeenCalledWith('keypair', TEST_CLIENT_ID));
  });

  describe('clear()', () => {
    const table = 'nonce';
    const key = 'some-key';
    const value = Math.random().toString();

    let beforeClear: unknown;
    let afterClear: unknown;

    beforeEach(async () => {
      await storage['save'](table, key, value);
      beforeClear = await storage['find'](table, key);

      await storage['clear'](table, key);
      afterClear = await storage['find'](table, key);
    });

    it('clears as expected', () => {
      expect(beforeClear).not.toBeUndefined();
      expect(afterClear).toBeUndefined();
    });
  });
});
