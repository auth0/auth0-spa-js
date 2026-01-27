import { getAuthJsEnrollParams, getGrantType } from '../../src/mfa/utils';
import { MfaGrantTypes } from '../../src/mfa/constants';

describe('getAuthJsEnrollParams', () => {
  describe('OTP factor conversion', () => {
    it('should convert OTP factor to auth-js format', () => {
      const result = getAuthJsEnrollParams({
        mfaToken: 'test-token',
        factorType: 'otp'
      });

      expect(result).toEqual({
        mfaToken: 'test-token',
        authenticatorTypes: ['otp']
      });
    });
  });

  describe('SMS factor conversion', () => {
    it('should convert SMS factor to auth-js format with phoneNumber', () => {
      const result = getAuthJsEnrollParams({
        mfaToken: 'test-token',
        factorType: 'sms',
        phoneNumber: '+12025551234'
      });

      expect(result).toEqual({
        mfaToken: 'test-token',
        authenticatorTypes: ['oob'],
        oobChannels: ['sms'],
        phoneNumber: '+12025551234'
      });
    });
  });

  describe('Email factor conversion', () => {
    it('should convert email factor to auth-js format with email', () => {
      const result = getAuthJsEnrollParams({
        mfaToken: 'test-token',
        factorType: 'email',
        email: 'user@example.com'
      });

      expect(result).toEqual({
        mfaToken: 'test-token',
        authenticatorTypes: ['oob'],
        oobChannels: ['email'],
        email: 'user@example.com'
      });
    });

    it('should convert email factor without email (uses default)', () => {
      const result = getAuthJsEnrollParams({
        mfaToken: 'test-token',
        factorType: 'email'
      });

      expect(result).toEqual({
        mfaToken: 'test-token',
        authenticatorTypes: ['oob'],
        oobChannels: ['email']
      });
    });
  });

  describe('Push factor conversion', () => {
    it('should convert push factor to auth-js format', () => {
      const result = getAuthJsEnrollParams({
        mfaToken: 'test-token',
        factorType: 'push'
      });

      expect(result).toEqual({
        mfaToken: 'test-token',
        authenticatorTypes: ['oob'],
        oobChannels: ['auth0']
      });
    });
  });

  describe('Voice factor conversion', () => {
    it('should convert voice factor to auth-js format with phoneNumber', () => {
      const result = getAuthJsEnrollParams({
        mfaToken: 'test-token',
        factorType: 'voice',
        phoneNumber: '+12025551234'
      });

      expect(result).toEqual({
        mfaToken: 'test-token',
        authenticatorTypes: ['oob'],
        oobChannels: ['voice'],
        phoneNumber: '+12025551234'
      });
    });
  });
});

describe('getGrantType', () => {
  it('should infer OTP grant type from otp field', () => {
    const result = getGrantType({
      mfaToken: 'test-token',
      otp: '123456'
    });
    expect(result).toBe(MfaGrantTypes.OTP);
  });

  it('should infer OOB grant type from oobCode field', () => {
    const result = getGrantType({
      mfaToken: 'test-token',
      oobCode: 'oob-code-123',
      bindingCode: '123456'
    });
    expect(result).toBe(MfaGrantTypes.OOB);
  });

  it('should infer RECOVERY_CODE grant type from recoveryCode field', () => {
    const result = getGrantType({
      mfaToken: 'test-token',
      recoveryCode: 'XXXX-XXXX-XXXX'
    });
    expect(result).toBe(MfaGrantTypes.RECOVERY_CODE);
  });

  it('should return undefined when no verification field is provided', () => {
    const result = getGrantType({
      mfaToken: 'test-token'
    });
    expect(result).toBeUndefined();
  });
});
