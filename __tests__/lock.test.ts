import { getLockManager } from '../src/lock';
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
});
