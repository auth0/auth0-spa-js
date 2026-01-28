import { FACTOR_MAPPING, MfaGrantTypes } from './constants';
import type { EnrollParams, VerifyParams, MfaGrantType } from './types';

/**
 * Converts factor-based enrollment params to auth-js format
 *
 * @param params - The enrollment parameters with factorType
 * @returns Parameters in auth-js format with authenticatorTypes/oobChannels
 */
export function getAuthJsEnrollParams(params: EnrollParams) {
  const mapping = FACTOR_MAPPING[params.factorType];

  return {
    mfaToken: params.mfaToken,
    authenticatorTypes: mapping.authenticatorTypes,
    ...(mapping.oobChannels && { oobChannels: mapping.oobChannels }),
    ...('phoneNumber' in params && { phoneNumber: params.phoneNumber }),
    ...('email' in params && { email: params.email })
  };
}

/**
 * Gets the grant type from verification parameters based on which field is provided.
 *
 * Priority order: otp > oobCode > recoveryCode
 *
 * @param params - The verification parameters
 * @returns The grant type or undefined if no verification field is present
 */
export function getGrantType(params: VerifyParams): MfaGrantType | undefined {
  if ('otp' in params && params.otp) {
    return MfaGrantTypes.OTP;
  }
  if ('oobCode' in params && params.oobCode) {
    return MfaGrantTypes.OOB;
  }
  if ('recoveryCode' in params && params.recoveryCode) {
    return MfaGrantTypes.RECOVERY_CODE;
  }
  return undefined;
}
