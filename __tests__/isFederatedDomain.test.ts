import { isFederatedDomain } from '../src/domain-discovery';
import { isFederatedDomain as _isFederatedDomain } from '@auth0/auth0-auth-js';
import { DEFAULT_AUTH0_CLIENT } from '../src/constants';

jest.mock('@auth0/auth0-auth-js', () => ({
  isFederatedDomain: jest.fn().mockResolvedValue(true)
}));

const mockInner = _isFederatedDomain as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('isFederatedDomain wrapper', () => {
  it('delegates to the auth-js implementation', async () => {
    const result = await isFederatedDomain('tenant.auth0.com', 'acme.com');
    expect(result).toBe(true);
    expect(mockInner).toHaveBeenCalledTimes(1);
  });

  it('injects DEFAULT_AUTH0_CLIENT as telemetry when no options are given', async () => {
    await isFederatedDomain('tenant.auth0.com', 'acme.com');
    expect(mockInner).toHaveBeenCalledWith(
      'tenant.auth0.com',
      'acme.com',
      expect.objectContaining({ telemetry: DEFAULT_AUTH0_CLIENT })
    );
  });

  it('injects DEFAULT_AUTH0_CLIENT as telemetry when options has no telemetry', async () => {
    await isFederatedDomain('tenant.auth0.com', 'acme.com', { customFetch: fetch });
    expect(mockInner).toHaveBeenCalledWith(
      'tenant.auth0.com',
      'acme.com',
      expect.objectContaining({ telemetry: DEFAULT_AUTH0_CLIENT })
    );
  });

  it('respects caller-provided telemetry over the default', async () => {
    const customTelemetry = { name: 'my-wrapper', version: '1.0.0' };
    await isFederatedDomain('tenant.auth0.com', 'acme.com', {
      telemetry: customTelemetry
    });
    expect(mockInner).toHaveBeenCalledWith(
      'tenant.auth0.com',
      'acme.com',
      expect.objectContaining({ telemetry: customTelemetry })
    );
  });

  it('strips https:// prefix from auth0Domain before passing to auth-js', async () => {
    await isFederatedDomain('https://tenant.auth0.com', 'acme.com');
    expect(mockInner).toHaveBeenCalledWith(
      'tenant.auth0.com',
      'acme.com',
      expect.objectContaining({ telemetry: DEFAULT_AUTH0_CLIENT })
    );
  });
});
