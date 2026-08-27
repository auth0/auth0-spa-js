## Multi-Factor Authentication (MFA)

The MFA API allows you to manage multi-factor authentication for users. The SDK automatically handles MFA context, eliminating the need for manual parsing of error payloads.

> [!NOTE]
> Multi Factor Authentication support via SDKs is currently in Early Access. To request access to this feature, contact your Auth0 representative.

- [Understanding the MFA Response](#understanding-the-mfa-response)
- [Handling MFA required errors](#handling-mfa-required-errors)
- [Getting Authenticators](#getting-authenticators)
- [Getting Enrollment Factors](#getting-enrollment-factors)
- [Enrollment](#enrollment)
  - [Enrolling OTP (Authenticator App)](#enrolling-otp-authenticator-app)
  - [Enrolling SMS](#enrolling-sms)
  - [Enrolling Email](#enrolling-email)
  - [Enrolling Push Notification](#enrolling-push-notification)
- [Challenge](#challenge)
  - [Challenge with SMS](#challenge-with-sms)
  - [Challenge with Email](#challenge-with-email)
  - [Challenge with Push Notification](#challenge-with-push-notification)
  - [Challenge with OTP](#challenge-with-otp)
- [Verify](#verify)
  - [Verify with OOB](#verify-with-oob)
  - [Verify with OTP](#verify-with-otp)
  - [Verify with Push Notification](#verify-with-push-notification)
  - [Verify with Recovery Code](#verify-with-recovery-code)
- [Complete MFA Flow Example](#complete-mfa-flow-example)
- [Error Handling](#error-handling)

### Setup

Before using the MFA API, configure MFA in your [Auth0 Dashboard](https://manage.auth0.com) under **Security** > **Multi-factor Auth**. For detailed configuration, see the [Auth0 MFA documentation](https://auth0.com/docs/secure/multi-factor-authentication/customize-mfa/customize-mfa-enrollments-universal-login).

#### Understanding the MFA Response

When MFA is required, the error payload contains an `mfa_requirements` object that indicates either a **challenge** flow (user has enrolled authenticators) or an **enroll** flow (user needs to set up MFA).

**Challenge Flow Response** (user has existing authenticators):

```json
{
  "error": "mfa_required",
  "error_description": "Multifactor authentication required",
  "mfa_token": "Fe26.2*...",
  "mfa_requirements": {
    "challenge": [
      { "type": "otp" },
      { "type": "email" }
      ...
    ]
  }
}
```

**Enroll Flow Response** (user needs to enroll an authenticator):

```json
{
  "error": "mfa_required",
  "error_description": "Multifactor authentication required",
  "mfa_token": "Fe26.2*...",
  "mfa_requirements": {
    "enroll": [
      { "type": "otp" },
      { "type": "phone" },
      { "type": "push-notification" }
      ...
    ]
  }
}
```

Based on the response:
- **`mfa_requirements.challenge`**: User has enrolled authenticators → proceed with **List Authenticators → Challenge → Verify** flow
- **`mfa_requirements.enroll`**: User needs to set up MFA → proceed with **Enroll → Verify** flow

> [!NOTE]
> The SDK handles this logic automatically. When you call `getEnrollmentFactors()` or `getAuthenticators()`, the SDK uses the stored context to return the appropriate data.

### Handling MFA Required Errors

When MFA is required, the SDK automatically stores the context. You can then call MFA methods with just the token:

```js
try {
  await auth0.getTokenSilently();
} catch (error) {
  if (error instanceof MfaRequiredError) {
    // Check if enrollment is required
    const enrollmentFactors = await auth0.mfa.getEnrollmentFactors(error.mfa_token);

    if (enrollmentFactors.length > 0) {
      // User needs to enroll - show enrollment options
      console.log('Available enrollment factors:', enrollmentFactors);
    } else {
      // User has enrolled authenticators - proceed with challenge
      const authenticators = await auth0.mfa.getAuthenticators(error.mfa_token);
      console.log('Available authenticators:', authenticators);
    }
  }
}
```

### Getting Authenticators

The SDK automatically filters authenticators based on challenge types from the MFA context:

```js
try {
  await auth0.getTokenSilently();
} catch (error) {
  if (error instanceof MfaRequiredError) {
    const authenticators = await auth0.mfa.getAuthenticators(error.mfa_token);
    // SDK automatically filters by challenge types from the error
    showAuthenticatorPicker(authenticators);
  }
}
```

### Getting Enrollment Factors

Check what MFA factors are available for enrollment:

```js
try {
  const factors = await auth0.mfa.getEnrollmentFactors(mfaToken);

  if (factors.length > 0) {
    console.log('Available enrollment options:', factors);
    showEnrollmentOptions(factors);
  } else {
    console.log('User already enrolled');
  }
} catch (error) {
  if (error instanceof MfaEnrollmentFactorsError) {
    console.error('Could not retrieve enrollment factors:', error.error_description);
  }
}
```

### Enrollment

#### Enrolling OTP (Authenticator App) [auth0-docs](enrolment)

```js
// Enroll OTP authenticator (Google Authenticator, Microsoft Authenticator, etc.)
const enrollment = await auth0.mfa.enroll({
  mfaToken: mfaToken,
  factorType: 'otp'
});

// Display QR code to user
const qrCodeUri = enrollment.barcodeUri; // otpauth://totp/...
const secret = enrollment.secret; // Base32 secret for manual entry
```

#### Enrolling SMS

```js
// Enroll SMS authenticator
const smsEnrollment = await auth0.mfa.enroll({
  mfaToken: mfaToken,
  factorType: 'sms',
  phoneNumber: '+12025551234' // E.164 format
});

const oobCode = smsEnrollment.oobCode; // Use this code to complete enrollment verification;
```

#### Enrolling Voice

```js
// Enroll Voice authenticator
const voiceEnrollment = await auth0.mfa.enroll({
  mfaToken: mfaToken,
  factorType: 'voice',
  phoneNumber: '+12025551234' // E.164 format
});

const oobCode = voiceEnrollment.oobCode; // Use this code to complete enrollment verification
```

#### Enrolling Email

```js
// Enroll Email authenticator
const emailEnrollment = await auth0.mfa.enroll({
  mfaToken: mfaToken,
  factorType: 'email',
  email: 'user@example.com' 
});

const oobCode = emailEnrollment.oobCode; // Use this code to complete enrollment verification
```

#### Enrolling Push Notification

```js
// Enroll Push Notification authenticator (Auth0 Guardian)
const pushEnrollment = await auth0.mfa.enroll({
  mfaToken: mfaToken,
  factorType: 'push'
});

// Display QR code for Guardian app enrollment
const qrCodeUri = pushEnrollment.barcodeUri; // Scan with Auth0 Guardian app
const oobCode = pushEnrollment.oobCode;

// User scans QR code with Auth0 Guardian mobile app
// Push notifications will be used for future MFA challenges
```

### Challenge

#### Challenge with SMS

```js
// Initiate SMS challenge - sends code via text message
const challenge = await auth0.mfa.challenge({
  mfaToken: mfaToken,
  challengeType: 'oob',
  authenticatorId: 'sms|dev_xxx'
});

const oobCode = challenge.oobCode; // Save for verification
// User will receive SMS with verification code
```

#### Challenge with Email

```js
// Initiate Email challenge - sends code via email
const challenge = await auth0.mfa.challenge({
  mfaToken: mfaToken,
  challengeType: 'oob',
  authenticatorId: 'email|dev_xxx'
});

const oobCode = challenge.oobCode; // Save for verification
// User will receive email with verification code
```

#### Challenge with Push Notification

```js
// Initiate Push Notification challenge - sends push to Guardian app
const challenge = await auth0.mfa.challenge({
  mfaToken: mfaToken,
  challengeType: 'oob',
  authenticatorId: 'push|dev_xxx'
});

const oobCode = challenge.oobCode; // Save for verification
// User receives push notification on their Auth0 Guardian mobile app
// They approve/deny the authentication request
```

#### Challenge with OTP

> [!NOTE]
> Once you have successfully enrolled an OTP factor, you do not need to explicitly call the challenge method to generate a code. The code is generated automatically by your authenticator app—simply open it and provide the displayed code in the verify call.

### Verify

#### Verify with OOB (SMS or email)

```js
// Verify MFA challenge and get tokens
const tokens = await auth0.mfa.verify({
  mfaToken: mfaToken,
  oobCode: challenge.oobCode,
  bindingCode: '123456' // Code user received via SMS
});

const accessToken = tokens.access_token; // Use to call your API
const idToken = tokens.id_token; // Contains user identity information
```

#### Verify with OTP

```js
// Verify OTP code from authenticator app
const tokens = await auth0.mfa.verify({
  mfaToken: mfaToken,
  otp: '123456' // 6-digit code from authenticator app
});

const accessToken = tokens.access_token;
const idToken = tokens.id_token;
```

#### Verify with Push Notification

```js
// Challenge the push notification authenticator
const challenge = await auth0.mfa.challenge({
  mfaToken: mfaToken,
  challengeType: 'oob',
  authenticatorId: 'push|dev_xxx' // Push authenticator ID
});

// User receives push notification on their mobile device
// They approve the request in the Auth0 Guardian app

// Poll or wait for user to approve, then verify
const tokens = await auth0.mfa.verify({
  mfaToken: mfaToken,
  oobCode: challenge.oobCode,
  bindingCode: 'APPROVAL_CODE' // Code from Guardian app (if binding required)
});

const accessToken = tokens.access_token;
const idToken = tokens.id_token;
```

#### Verify with Recovery Code

Recovery codes can be used to complete MFA verification without initiating a challenge. Each recovery code can only be used once.

```js
const tokens = await auth0.mfa.verify({
  mfaToken: mfaToken,
  recoveryCode: 'XXXX-XXXX-XXXX' // One of the recovery codes
});

const accessToken = tokens.access_token;
const idToken = tokens.id_token;
```

### Complete MFA Flow Example

Here's a complete example showing enrollment and challenge flows:

> [!TIP]
> See a complete MFA implementation in [static/mfa_flow.html](static/mfa_flow.html) that demonstrates enrollment, challenge, and verification flows.

```js
async function handleMfaFlow() {
  try {
    await auth0.getTokenSilently();
  } catch (error) {
    if (error instanceof MfaRequiredError) {
      const mfaToken = error.mfa_token;

      // Check if enrollment is needed
      const enrollmentFactors = await auth0.mfa.getEnrollmentFactors(mfaToken);

      if (enrollmentFactors.length > 0) {
        // User needs to enroll
        const selectedFactor = await showEnrollmentUI(enrollmentFactors);

        // Enroll based on user selection
        if (selectedFactor.type === 'otp') {
          const enrollment = await auth0.mfa.enroll({
            mfaToken: mfaToken,
            factorType: 'otp'
          });
          await showQRCode(enrollment.barcodeUri);

          // User scans QR and enters code to verify enrollment
          const verifyCode = await promptUserForCode();
          const tokens = await auth0.mfa.verify({
            mfaToken: mfaToken,
            otp: verifyCode
          });

          return tokens;
        }
      } else {
        // User has authenticators - proceed with challenge
        const authenticators = await auth0.mfa.getAuthenticators(mfaToken);
        const selected = await showAuthenticatorPicker(authenticators);

        // Initiate challenge
        const challenge = await auth0.mfa.challenge({
          mfaToken: mfaToken,
          challengeType: selected.type === 'otp' ? 'otp' : 'oob',
          authenticatorId: selected.id
        });

        // Get code from user
        const code = await promptUserForCode();

        // Verify
        const tokens = await auth0.mfa.verify({
          mfaToken: mfaToken,
          otp: selected.type === 'otp' ? code : undefined,
          oobCode: selected.type !== 'otp' ? challenge.oobCode : undefined,
          bindingCode: selected.type !== 'otp' ? code : undefined
        });

        return tokens;
      }
    }
  }
}
```

### Error Handling

Each MFA operation has its own typed error for precise error handling:

```js
import {
  MfaEnrollmentError,
  MfaListAuthenticatorsError,
  MfaChallengeError,
  MfaVerifyError,
  MfaEnrollmentFactorsError
} from '@auth0/auth0-spa-js';

// Get authenticators
try {
  const authenticators = await auth0.mfa.getAuthenticators(mfaToken);
} catch (error) {
  if (error instanceof MfaListAuthenticatorsError) {
    console.error('Failed to get authenticators:', error.error_description);
  }
}

// Get enrollment factors
try {
  const factors = await auth0.mfa.getEnrollmentFactors(mfaToken);
} catch (error) {
  if (error instanceof MfaEnrollmentFactorsError) {
    console.error('Context not found:', error.error_description);
    // MFA token may have expired - restart the flow
  }
}

// Enroll authenticator
try {
  const enrollment = await auth0.mfa.enroll({
    mfaToken,
    factorType: 'otp'
  });
} catch (error) {
  if (error instanceof MfaEnrollmentError) {
    console.error('Enrollment failed:', error.error_description);
  }
}

// Challenge authenticator
try {
  const challenge = await auth0.mfa.challenge({
    mfaToken,
    challengeType: 'otp',
    authenticatorId
  });
} catch (error) {
  if (error instanceof MfaChallengeError) {
    console.error('Challenge failed:', error.error_description);
  }
}

// Verify challenge
try {
  const tokens = await auth0.mfa.verify({
    mfaToken,
    otp: '123456'
  });
} catch (error) {
  if (error instanceof MfaVerifyError) {
    if (error.error === 'invalid_otp') {
      console.error('Invalid code entered');
    } else if (error.error === 'expired_token') {
      console.error('MFA token expired - restart flow');
    }
  }
}
```

> [!NOTE]
> You may also encounter an `MfaRequiredError` if you have multiple challenge factors configured.
