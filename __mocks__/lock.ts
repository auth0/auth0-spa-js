/**
 * Mock implementation for src/lock.ts
 */

import type { ILockManager } from '../src/lock';

export const mockRunWithLock = jest.fn();
export const mockLockShouldFail = false;

// Track calls for backwards compatibility with tests
const lockCalls = new Map<string, number>();

export const getLockManager = jest.fn().mockReturnValue({
  runWithLock: mockRunWithLock.mockImplementation(
    async (key, timeout, callback) => {
      lockCalls.set(key, (lockCalls.get(key) || 0) + 1);

      if (mockLockShouldFail) {
        throw new Error('Timeout');
      }

      return await callback();
    }
  )
});

export const createLockManager = jest.fn().mockReturnValue(getLockManager());

export const resetLockManager = jest.fn(() => {
  lockCalls.clear();
  mockRunWithLock.mockClear();
});

export class WebLocksApiManager implements ILockManager {
  runWithLock = mockRunWithLock;
}

export class LegacyLockManager implements ILockManager {
  runWithLock = mockRunWithLock;
}
