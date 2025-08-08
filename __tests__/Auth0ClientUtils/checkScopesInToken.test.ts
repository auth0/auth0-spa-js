import { checkScopesInToken } from '../../src/Auth0Client.utils';
import { TEST_ACCESS_TOKEN, TEST_SCOPES } from '../constants';

const createMockToken = (scopes: string): string => {
    const payload = { scope: scopes };
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    return `header.${base64Payload}.signature`;
};

describe('checkScopesInToken', () => {
    it('returns true if all required scopes are present in the token', () => {
        const token = createMockToken(`${TEST_SCOPES} another-scope`);
        const requiredScope = `${TEST_SCOPES} another-scope`;

        const result = checkScopesInToken(token, requiredScope);

        expect(result).toBe(true);
    });

    it('returns false if any required scope is missing from the token', () => {
        const token = createMockToken(TEST_SCOPES);
        const requiredScope = `${TEST_SCOPES} missing-scope`;

        const result = checkScopesInToken(token, requiredScope);

        expect(result).toBe(false);
    });

    it('returns false if the token is invalid', () => {
        const token = TEST_ACCESS_TOKEN
        const requiredScope = TEST_SCOPES;

        const result = checkScopesInToken(token, requiredScope);

        expect(result).toBe(false);
    });
});
