import { MfaContextManager } from '../../src/mfa/MfaContextManager';

describe('MfaContextManager', () => {
    let manager: MfaContextManager;

    beforeEach(() => {
        jest.useFakeTimers();
        manager = new MfaContextManager();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('set and get', () => {
        it('should store and retrieve context', () => {
            const mfaToken = 'test-token';
            const context = { scope: 'openid profile', audience: 'https://api.example.com' };

            manager.set(mfaToken, context);
            const result = manager.get(mfaToken);

            expect(result).toMatchObject(context);
            expect(result?.createdAt).toBeDefined();
        });

        it('should return undefined for non-existent token', () => {
            const result = manager.get('non-existent-token');
            expect(result).toBeUndefined();
        });

        it('should store multiple contexts independently', () => {
            manager.set('token1', { scope: 'scope1', audience: 'audience1' });
            manager.set('token2', { scope: 'scope2', audience: 'audience2' });

            expect(manager.get('token1')?.scope).toBe('scope1');
            expect(manager.get('token2')?.scope).toBe('scope2');
            expect(manager.size).toBe(2);
        });

        it('should overwrite existing context for same token', () => {
            manager.set('token1', { scope: 'scope1', audience: 'audience1' });
            manager.set('token1', { scope: 'scope2', audience: 'audience2' });

            expect(manager.get('token1')?.scope).toBe('scope2');
            expect(manager.size).toBe(1);
        });
    });

    describe('remove', () => {
        it('should remove context', () => {
            manager.set('token1', { scope: 'scope1' });
            manager.remove('token1');

            expect(manager.get('token1')).toBeUndefined();
            expect(manager.size).toBe(0);
        });

        it('should not throw when removing non-existent token', () => {
            expect(() => manager.remove('non-existent')).not.toThrow();
        });
    });

    describe('TTL expiration', () => {
        it('should return undefined for expired context on get', () => {
            manager.set('token1', { scope: 'scope1' });

            // Advance time past TTL (10 minutes)
            jest.advanceTimersByTime(11 * 60 * 1000);

            expect(manager.get('token1')).toBeUndefined();
        });

        it('should return context if not expired', () => {
            manager.set('token1', { scope: 'scope1' });

            // Advance time but not past TTL
            jest.advanceTimersByTime(9 * 60 * 1000);

            expect(manager.get('token1')?.scope).toBe('scope1');
        });

        it('should cleanup expired entries on set', () => {
            manager.set('token1', { scope: 'scope1' });

            // Advance time past TTL
            jest.advanceTimersByTime(11 * 60 * 1000);

            // Set a new token - should trigger cleanup
            manager.set('token2', { scope: 'scope2' });

            // token1 should be cleaned up
            expect(manager.size).toBe(1);
            expect(manager.get('token1')).toBeUndefined();
            expect(manager.get('token2')?.scope).toBe('scope2');
        });

        it('should cleanup multiple expired entries', () => {
            manager.set('token1', { scope: 'scope1' });
            manager.set('token2', { scope: 'scope2' });

            // Advance time past TTL
            jest.advanceTimersByTime(11 * 60 * 1000);

            // Set a new token - should trigger cleanup
            manager.set('token3', { scope: 'scope3' });

            expect(manager.size).toBe(1);
        });
    });

    describe('custom TTL', () => {
        it('should respect custom TTL', () => {
            const customManager = new MfaContextManager(5 * 60 * 1000); // 5 minutes
            customManager.set('token1', { scope: 'scope1' });

            // Advance 4 minutes - should still be valid
            jest.advanceTimersByTime(4 * 60 * 1000);
            expect(customManager.get('token1')?.scope).toBe('scope1');

            // Advance 2 more minutes (total 6) - should be expired
            jest.advanceTimersByTime(2 * 60 * 1000);
            expect(customManager.get('token1')).toBeUndefined();
        });
    });
});
