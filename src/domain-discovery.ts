import {
  isFederatedDomain as _isFederatedDomain,
  IsFederatedDomainOptions
} from '@auth0/auth0-auth-js';
import { DEFAULT_AUTH0_CLIENT } from './constants';

export type { IsFederatedDomainOptions };

/**
 * Checks whether an email domain is managed for enterprise SSO on the given Auth0 tenant.
 * Wraps the auth-js primitive to inject spa-js telemetry by default.
 *
 * @param auth0Domain - Tenant domain, e.g. 'tenant.auth0.com'. A leading 'https://' or 'http://' is stripped automatically.
 * @param emailDomain - The email domain to check, e.g. 'acme.com'.
 */
export function isFederatedDomain(
  auth0Domain: string,
  emailDomain: string,
  options?: IsFederatedDomainOptions
): Promise<boolean> {
  const bare = auth0Domain.replace(/^https?:\/\//, '');
  return _isFederatedDomain(bare, emailDomain, {
    ...options,
    telemetry: options?.telemetry ?? DEFAULT_AUTH0_CLIENT
  });
}
