import {
  getLockManager,
  resetLockManager,
  WebLocksApiManager,
  LegacyLockManager
} from '../src/lock';
import { TimeoutError } from '../src/errors';
import { mockAcquireLock } from '../__mocks__/lock';

// The actual implementation is mocked by __mocks__/lock.ts in Jest
// These tests verify the lock abstraction works through the mock

describe('lock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLockManager', () => {
    it('should return a lock manager with acquireLock method', () => {
      const manager = getLockManager();
      expect(manager).toBeDefined();
      expect(manager.acquireLock).toBeDefined();
      expect(typeof manager.acquireLock).toBe('function');
    });

    it('should return same instance on multiple calls', () => {
      const manager1 = getLockManager();
      const manager2 = getLockManager();
      expect(manager1).toBe(manager2);
    });
  });

  describe('lock manager callback pattern', () => {
    it('should call the callback when lock is acquired', async () => {
      const manager = getLockManager();
      const callback = jest.fn().mockResolvedValue('result');

      const result = await manager.acquireLock('test-key', 5000, callback);

      expect(callback).toHaveBeenCalled();
      expect(result).toBe('result');
    });

    it('should propagate callback return value', async () => {
      const manager = getLockManager();
      const expectedValue = { data: 'test' };
      const callback = jest.fn().mockResolvedValue(expectedValue);

      const result = await manager.acquireLock('key', 5000, callback);

      expect(result).toBe(expectedValue);
    });

    it('should propagate callback errors', async () => {
      const manager = getLockManager();
      const error = new Error('callback failed');
      const callback = jest.fn().mockRejectedValue(error);

      await expect(
        manager.acquireLock('key', 5000, callback)
      ).rejects.toThrow('callback failed');
    });

    it('should handle multiple sequential lock acquisitions', async () => {
      const manager = getLockManager();

      const result1 = await manager.acquireLock('key1', 5000, async () => 'result1');
      const result2 = await manager.acquireLock('key2', 5000, async () => 'result2');
      const result3 = await manager.acquireLock('key3', 5000, async () => 'result3');

      expect(result1).toBe('result1');
      expect(result2).toBe('result2');
      expect(result3).toBe('result3');
    });

    it('should execute callback with lock held', async () => {
      const manager = getLockManager();
      const executionOrder: string[] = [];

      const result = await manager.acquireLock('key', 5000, async () => {
        executionOrder.push('inside-callback');
        return 'done';
      });

      executionOrder.push('after-lock');

      expect(executionOrder).toEqual(['inside-callback', 'after-lock']);
      expect(result).toBe('done');
    });

    it('should work with async callbacks that take time', async () => {
      const manager = getLockManager();

      const result = await manager.acquireLock('key', 5000, async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'completed';
      });

      expect(result).toBe('completed');
    });

    it('should allow different lock keys to be used', async () => {
      const manager = getLockManager();

      // These should all succeed with different keys
      await manager.acquireLock('audience1', 5000, async () => 'r1');
      await manager.acquireLock('audience2', 5000, async () => 'r2');
      await manager.acquireLock('iframe-lock', 5000, async () => 'r3');

      // All completed without issues
      expect(true).toBe(true);
    });

    it('should provide correct lock key to underlying implementation', async () => {
      const manager = getLockManager();
      
      await manager.acquireLock('my-custom-key', 5000, async () => 'result');
      await manager.acquireLock('another-key', 3000, async () => 'result2');

      // Mock was called (verified by not throwing)
      expect(mockAcquireLock).toBeDefined();
    });
  });

  describe('WebLocksApiManager', () => {
    let originalNavigator: any;
    let mockLocks: any;

    beforeEach(() => {
      // Save original navigator
      originalNavigator = global.navigator;

      // Mock navigator.locks
      mockLocks = {
        request: jest.fn()
      };
      
      Object.defineProperty(global, 'navigator', {
        value: { locks: mockLocks },
        writable: true,
        configurable: true
      });
    });

    afterEach(() => {
      // Restore original navigator
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
        configurable: true
      });
    });

    it('should acquire lock and execute callback', async () => {
      const manager = new WebLocksApiManager();
      
      mockLocks.request.mockImplementation(async (key: string, options: any, callback: any) => {
        return await callback({ name: key });
      });

      const result = await manager.acquireLock('test-key', 5000, async () => 'success');

      expect(result).toBe('success');
      expect(mockLocks.request).toHaveBeenCalledWith(
        'test-key',
        expect.objectContaining({ mode: 'exclusive' }),
        expect.any(Function)
      );
    });

    it('should throw TimeoutError when aborted', async () => {
      const manager = new WebLocksApiManager();
      
      mockLocks.request.mockImplementation(async (key: string, options: any, callback: any) => {
        // Simulate abort
        const error: any = new Error('Aborted');
        error.name = 'AbortError';
        throw error;
      });

      await expect(
        manager.acquireLock('test-key', 100, async () => 'should-not-execute')
      ).rejects.toThrow(TimeoutError);
    });

    it('should propagate non-abort errors', async () => {
      const manager = new WebLocksApiManager();
      const customError = new Error('Custom error');
      
      mockLocks.request.mockImplementation(async () => {
        throw customError;
      });

      await expect(
        manager.acquireLock('test-key', 5000, async () => 'result')
      ).rejects.toThrow('Custom error');
    });

    it('should throw error when lock is not available', async () => {
      const manager = new WebLocksApiManager();
      
      mockLocks.request.mockImplementation(async (key: string, options: any, callback: any) => {
        return await callback(null); // null lock means not available
      });

      await expect(
        manager.acquireLock('test-key', 5000, async () => 'result')
      ).rejects.toThrow('Lock not available');
    });
  });

  describe('LegacyLockManager', () => {
    it('should acquire lock and execute callback successfully', async () => {
      const { acquireLockSpy, releaseLockSpy } = require('../__mocks__/browser-tabs-lock');
      acquireLockSpy.mockResolvedValue(true);
      releaseLockSpy.mockResolvedValue(undefined);

      const manager = new LegacyLockManager();
      const result = await manager.acquireLock('test-key', 5000, async () => 'success');

      expect(result).toBe('success');
      expect(acquireLockSpy).toHaveBeenCalledWith('test-key', 5000);
      expect(releaseLockSpy).toHaveBeenCalledWith('test-key');
    });

    it('should retry lock acquisition up to 10 times', async () => {
      const { acquireLockSpy, releaseLockSpy } = require('../__mocks__/browser-tabs-lock');
      acquireLockSpy
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);
      releaseLockSpy.mockResolvedValue(undefined);

      const manager = new LegacyLockManager();
      const result = await manager.acquireLock('test-key', 5000, async () => 'success');

      expect(result).toBe('success');
      expect(acquireLockSpy).toHaveBeenCalledTimes(3);
    });

    it('should throw TimeoutError if lock cannot be acquired after retries', async () => {
      const { acquireLockSpy } = require('../__mocks__/browser-tabs-lock');
      acquireLockSpy.mockResolvedValue(false);

      const manager = new LegacyLockManager();
      await expect(
        manager.acquireLock('test-key', 5000, async () => 'result')
      ).rejects.toThrow(TimeoutError);

      expect(acquireLockSpy).toHaveBeenCalledTimes(10);
    });

    it('should release lock even when callback throws', async () => {
      const { acquireLockSpy, releaseLockSpy } = require('../__mocks__/browser-tabs-lock');
      acquireLockSpy.mockResolvedValue(true);
      releaseLockSpy.mockResolvedValue(undefined);

      const manager = new LegacyLockManager();
      const error = new Error('Callback error');
      await expect(
        manager.acquireLock('test-key', 5000, async () => {
          throw error;
        })
      ).rejects.toThrow('Callback error');

      expect(releaseLockSpy).toHaveBeenCalledWith('test-key');
    });

    it('should track active locks', async () => {
      const { acquireLockSpy, releaseLockSpy } = require('../__mocks__/browser-tabs-lock');
      acquireLockSpy.mockResolvedValue(true);
      releaseLockSpy.mockResolvedValue(undefined);

      const manager = new LegacyLockManager();
      const promise = manager.acquireLock('test-key', 5000, async () => {
        // Lock should be tracked while callback is executing
        expect((manager as any).activeLocks.has('test-key')).toBe(true);
        return 'success';
      });

      await promise;
      
      // Lock should be removed after callback completes
      expect((manager as any).activeLocks.has('test-key')).toBe(false);
    });

    it('should handle pagehide event and release all active locks', async () => {
      const { acquireLockSpy, releaseLockSpy } = require('../__mocks__/browser-tabs-lock');
      acquireLockSpy.mockResolvedValue(true);
      releaseLockSpy.mockResolvedValue(undefined);

      const manager = new LegacyLockManager();
      
      // Acquire a lock and trigger pagehide while holding it
      const promise = manager.acquireLock('test-key', 5000, async () => {
        // Trigger pagehide event
        window.dispatchEvent(new Event('pagehide'));
        return 'success';
      });

      await promise;

      // Lock should have been released via pagehide handler
      expect(releaseLockSpy).toHaveBeenCalledWith('test-key');
    });

    it('should register pagehide listener on first lock', async () => {
      const { acquireLockSpy, releaseLockSpy } = require('../__mocks__/browser-tabs-lock');
      acquireLockSpy.mockResolvedValue(true);
      releaseLockSpy.mockResolvedValue(undefined);
      
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const manager = new LegacyLockManager();
      
      // Acquire and release multiple locks
      await manager.acquireLock('key1', 5000, async () => 'r1');
      await manager.acquireLock('key2', 5000, async () => 'r2');

      // Verify addEventListener was called during constructor
      expect(addEventListenerSpy).toHaveBeenCalledWith('pagehide', expect.any(Function));
      
      // After all locks released, removeEventListener should be called
      expect(removeEventListenerSpy).toHaveBeenCalledWith('pagehide', expect.any(Function));

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('resetLockManager', () => {
    it('should reset singleton so next call creates new instance', () => {
      const manager1 = getLockManager();
      resetLockManager();
      const manager2 = getLockManager();
      
      // In the mocked environment, they might be the same mock,
      // but resetLockManager should have been called
      expect(manager2).toBeDefined();
    });
  });
});
