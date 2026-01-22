import { MfaRequirements } from '../errors';

/**
 * Represents the stored context for an MFA flow
 */
export interface MfaContext {
    /** The OAuth scope for the original token request */
    scope?: string;
    /** The API audience for the original token request */
    audience?: string;
    /** MFA requirements from the mfa_required error (camelCase for TypeScript conventions) */
    mfaRequirements?: MfaRequirements;
    /** Timestamp when the context was created */
    createdAt: number;
}

/**
 * Default TTL for MFA contexts in milliseconds (10 minutes)
 * This aligns with typical MFA token expiration times
 */
const DEFAULT_TTL_MS = 10 * 60 * 1000;

/**
 * Manages MFA authentication contexts keyed by MFA token.
 *
 * When an mfa_required error occurs, the SDK stores the original request's
 * scope and audience. When the user later provides an MFA token for verification,
 * the SDK retrieves the matching context to complete the token exchange.
 *
 * This enables concurrent MFA flows without state conflicts.
 *
 * @example
 * ```typescript
 * const manager = new MfaContextManager();
 *
 * // Store context when mfa_required error occurs
 * manager.set('mfaTokenAbc', { scope: 'openid profile', audience: 'https://api.example.com' });
 *
 * // Retrieve context when user completes MFA
 * const context = manager.get('mfaTokenAbc');
 * // { scope: 'openid profile', audience: 'https://api.example.com', createdAt: ... }
 *
 * // Remove after successful verification
 * manager.remove('mfaTokenAbc');
 * ```
 */
export class MfaContextManager {
    private contexts: Map<string, MfaContext> = new Map();
    private readonly ttlMs: number;

    /**
     * Creates a new MfaContextManager
     * @param ttlMs - Time-to-live for contexts in milliseconds (default: 10 minutes)
     */
    constructor(ttlMs: number = DEFAULT_TTL_MS) {
        this.ttlMs = ttlMs;
    }

    /**
     * Stores an MFA context keyed by the MFA token.
     * Runs cleanup to remove expired entries before storing.
     *
     * @param mfaToken - The MFA token from the mfa_required error
     * @param context - The scope and audience from the original request
     */
    public set(
        mfaToken: string,
        context: Omit<MfaContext, 'createdAt'>
    ): void {
        this.cleanup();
        this.contexts.set(mfaToken, {
            ...context,
            createdAt: Date.now()
        });
    }

    /**
     * Retrieves the MFA context for a given token.
     * Returns undefined if the token is not found or has expired.
     *
     * @param mfaToken - The MFA token to look up
     * @returns The stored context, or undefined if not found/expired
     */
    public get(mfaToken: string): MfaContext | undefined {
        const context = this.contexts.get(mfaToken);
        if (!context) {
            return undefined;
        }

        // Check if expired
        if (Date.now() - context.createdAt > this.ttlMs) {
            this.contexts.delete(mfaToken);
            return undefined;
        }

        return context;
    }

    /**
     * Removes an MFA context.
     * Should be called after successful MFA verification.
     *
     * @param mfaToken - The MFA token to remove
     */
    public remove(mfaToken: string): void {
        this.contexts.delete(mfaToken);
    }

    /**
     * Removes all expired contexts from the Map.
     * Called automatically on every `set` operation.
     */
    private cleanup(): void {
        const now = Date.now();
        for (const [key, value] of this.contexts) {
            if (now - value.createdAt > this.ttlMs) {
                this.contexts.delete(key);
            }
        }
    }

    /**
     * Returns the number of stored contexts
     */
    public get size(): number {
        return this.contexts.size;
    }
}
