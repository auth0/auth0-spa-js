/**
 * @jest-environment node
 */
import { retryPromise, singlePromise } from '../src/promise-utils';

describe('Promise Utils', () => {
  describe('singlePromise', () => {
    it('reuses the same promise when the key matches', async () => {
      const cb = jest.fn().mockResolvedValue({});

      await Promise.all([
        singlePromise(cb as any, 'test-key'),
        singlePromise(cb as any, 'test-key')
      ]);

      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('does not reuse the same promise when the key is different', async () => {
      const cb = jest.fn().mockResolvedValue({});

      await Promise.all([
        singlePromise(cb as any, 'test-key'),
        singlePromise(cb as any, 'test-key2')
      ]);

      expect(cb).toHaveBeenCalledTimes(2);
    });

    it('does not reuse the same promise when the key matches but the first promise resolves before calling the second', async () => {
      const cb = jest.fn().mockResolvedValue({});

      await singlePromise(cb as any, 'test-key');
      await singlePromise(cb as any, 'test-key');

      expect(cb).toHaveBeenCalledTimes(2);
    });
  });

  describe('retryPromise', () => {
    it('does not retry promise when it resolves to true', async () => {
      const cb = jest.fn().mockResolvedValue(true);

      const value = await retryPromise(cb as any);

      expect(value).toBe(true);
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('retries promise until it resolves to true', async () => {
      let i = 1;
      const cb = jest.fn().mockImplementation(() => {
        if (i === 3) {
          return Promise.resolve(true);
        }

        i++;
        return Promise.resolve(false);
      });

      const value = await retryPromise(cb as any);

      expect(value).toBe(true);
      expect(cb).toHaveBeenCalledTimes(3);
    });

    it('resolves to false when all retries resolve to false', async () => {
      const cb = jest.fn().mockResolvedValue(false);

      const value = await retryPromise(cb as any, 5);

      expect(value).toBe(false);
      expect(cb).toHaveBeenCalledTimes(5);
    });
  });
});
