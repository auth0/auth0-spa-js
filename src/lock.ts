import BrowserTabsLock from 'browser-tabs-lock';
import { TimeoutError } from './errors';

/**
 * Lock manager abstraction for cross-tab synchronization.
 * Supports both modern Web Locks API and legacy localStorage-based locking.
 */

/** Lock manager interface - callback pattern ensures automatic lock release */
export interface ILockManager {
  /**
   * Run callback while holding a lock.
   * Lock is automatically released when callback completes or throws.
   *
   * @param key - Lock identifier
   * @param timeout - Maximum time to wait for lock acquisition (ms)
   * @param callback - Function to execute while holding the lock
   * @returns Promise resolving to callback's return value
   * @throws Error if lock cannot be acquired within timeout
   */
  runWithLock<T>(
    key: string,
    timeout: number,
    callback: () => Promise<T>
  ): Promise<T>;
}

/** Web Locks API implementation - true mutex with OS-level queuing */
export class WebLocksApiManager implements ILockManager {
  async runWithLock<T>(
    key: string,
    timeout: number,
    callback: () => Promise<T>
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      return await navigator.locks.request(
        key,
        { mode: 'exclusive', signal: controller.signal },
        async lock => {
          clearTimeout(timeoutId);
          if (!lock) throw new Error('Lock not available');
          return await callback();
        }
      );
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error?.name === 'AbortError') throw new TimeoutError();
      throw error;
    }
  }
}

/** Legacy localStorage-based locking with retry logic for older browsers */
export class LegacyLockManager implements ILockManager {
  private lock: BrowserTabsLock;
  private activeLocks: Set<string> = new Set();
  private pagehideHandler: () => void;

  constructor() {
    this.lock = new BrowserTabsLock();

    this.pagehideHandler = () => {
      this.activeLocks.forEach(key => this.lock.releaseLock(key));
      this.activeLocks.clear();
    };
  }

  async runWithLock<T>(
    key: string,
    timeout: number,
    callback: () => Promise<T>
  ): Promise<T> {
    // Retry logic to handle race conditions in localStorage-based locking
    const retryAttempts = 10;
    let acquired = false;

    for (let i = 0; i < retryAttempts && !acquired; i++) {
      acquired = await this.lock.acquireLock(key, timeout);
    }

    if (!acquired) {
      throw new TimeoutError();
    }

    this.activeLocks.add(key);

    // Add pagehide listener when acquiring first lock
    if (this.activeLocks.size === 1 && typeof window !== 'undefined') {
      window.addEventListener('pagehide', this.pagehideHandler);
    }

    try {
      return await callback();
    } finally {
      this.activeLocks.delete(key);
      await this.lock.releaseLock(key);

      // Remove pagehide listener when all locks are released
      if (this.activeLocks.size === 0 && typeof window !== 'undefined') {
        window.removeEventListener('pagehide', this.pagehideHandler);
      }
    }
  }
}

/**
 * Feature detection for Web Locks API support
 */
function isWebLocksSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.locks?.request === 'function'
  );
}

function createLockManager(): ILockManager {
  return isWebLocksSupported()
    ? new WebLocksApiManager()
    : new LegacyLockManager();
}

/**
 * Get the singleton lock manager instance.
 * Uses Web Locks API in modern browsers, falls back to localStorage in older browsers.
 */
let lockManager: ILockManager | null = null;

export function getLockManager(): ILockManager {
  if (!lockManager) {
    lockManager = createLockManager();
  }
  return lockManager;
}

// For testing: allow resetting the singleton
export function resetLockManager(): void {
  lockManager = null;
}
