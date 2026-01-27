import type { MfaFactorType, OobChannel } from './types';

/**
 * Mapping configuration for a factor type
 */
export interface FactorMapping {
  authenticatorTypes: ['otp'] | ['oob'];
  oobChannels?: OobChannel[];
}

/**
 * Maps MFA factor types to auth-js enrollment parameters
 */
export const FACTOR_MAPPING: Record<MfaFactorType, FactorMapping> = {
  otp: {
    authenticatorTypes: ['otp']
  },
  sms: {
    authenticatorTypes: ['oob'],
    oobChannels: ['sms']
  },
  email: {
    authenticatorTypes: ['oob'],
    oobChannels: ['email']
  },
  push: {
    authenticatorTypes: ['oob'],
    oobChannels: ['auth0']
  },
  voice: {
    authenticatorTypes: ['oob'],
    oobChannels: ['voice']
  }
};

/**
 * MFA grant type constants for verification
 */
export const MfaGrantTypes = {
  /** Grant type for OTP (TOTP) verification */
  OTP: 'http://auth0.com/oauth/grant-type/mfa-otp',

  /** Grant type for OOB (SMS, Email, Push) verification */
  OOB: 'http://auth0.com/oauth/grant-type/mfa-oob',

  /** Grant type for recovery code verification */
  RECOVERY_CODE: 'http://auth0.com/oauth/grant-type/mfa-recovery-code'
} as const;
