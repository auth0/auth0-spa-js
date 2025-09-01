import { urlDecodeB64, fetchJWKS, findJWKByKid, jwkToCryptoKey, getCrypto } from './utils';
import { IdToken, JWTVerifyOptions } from './global';

const isNumber = (n: any) => typeof n === 'number';

const idTokendecoded = [
  'iss',
  'aud',
  'exp',
  'nbf',
  'iat',
  'jti',
  'azp',
  'nonce',
  'auth_time',
  'at_hash',
  'c_hash',
  'acr',
  'amr',
  'sub_jwk',
  'cnf',
  'sip_from_tag',
  'sip_date',
  'sip_callid',
  'sip_cseq_num',
  'sip_via_branch',
  'orig',
  'dest',
  'mky',
  'events',
  'toe',
  'txn',
  'rph',
  'sid',
  'vot',
  'vtm'
];

export const decode = (token: string) => {
  const parts = token.split('.');
  const [header, payload, signature] = parts;

  if (parts.length !== 3 || !header || !payload || !signature) {
    throw new Error('ID token could not be decoded');
  }
  const payloadJSON = JSON.parse(urlDecodeB64(payload));
  const claims: IdToken = { __raw: token };
  const user: any = {};
  Object.keys(payloadJSON).forEach(k => {
    claims[k] = payloadJSON[k];
    if (!idTokendecoded.includes(k)) {
      user[k] = payloadJSON[k];
    }
  });
  return {
    encoded: { header, payload, signature },
    header: JSON.parse(urlDecodeB64(header)),
    claims,
    user
  };
};

export const verify = async (options: JWTVerifyOptions) => {
  if (!options.id_token) {
    throw new Error('ID token is required but missing');
  }

  const decoded = decode(options.id_token);

  if (!decoded.claims.iss) {
    throw new Error(
      'Issuer (iss) claim must be a string present in the ID token'
    );
  }

  if (decoded.claims.iss !== options.iss) {
    throw new Error(
      `Issuer (iss) claim mismatch in the ID token; expected "${options.iss}", found "${decoded.claims.iss}"`
    );
  }

  if (!decoded.user.sub) {
    throw new Error(
      'Subject (sub) claim must be a string present in the ID token'
    );
  }

  if (decoded.header.alg !== 'RS256') {
    throw new Error(
      `Signature algorithm of "${decoded.header.alg}" is not supported. Expected the ID token to be signed with "RS256".`
    );
  }

  // Perform signature verification if requested
  if (options.validateSignature === true) {
    const isSignatureValid = await verifySignature(options.id_token, options.iss);
    if (!isSignatureValid) {
      throw new Error('JWT signature verification failed');
    }
  }

  if (
    !decoded.claims.aud ||
    !(
      typeof decoded.claims.aud === 'string' ||
      Array.isArray(decoded.claims.aud)
    )
  ) {
    throw new Error(
      'Audience (aud) claim must be a string or array of strings present in the ID token'
    );
  }
  if (Array.isArray(decoded.claims.aud)) {
    if (!decoded.claims.aud.includes(options.aud)) {
      throw new Error(
        `Audience (aud) claim mismatch in the ID token; expected "${
          options.aud
        }" but was not one of "${decoded.claims.aud.join(', ')}"`
      );
    }
    if (decoded.claims.aud.length > 1) {
      if (!decoded.claims.azp) {
        throw new Error(
          'Authorized Party (azp) claim must be a string present in the ID token when Audience (aud) claim has multiple values'
        );
      }
      if (decoded.claims.azp !== options.aud) {
        throw new Error(
          `Authorized Party (azp) claim mismatch in the ID token; expected "${options.aud}", found "${decoded.claims.azp}"`
        );
      }
    }
  } else if (decoded.claims.aud !== options.aud) {
    throw new Error(
      `Audience (aud) claim mismatch in the ID token; expected "${options.aud}" but found "${decoded.claims.aud}"`
    );
  }
  if (options.nonce) {
    if (!decoded.claims.nonce) {
      throw new Error(
        'Nonce (nonce) claim must be a string present in the ID token'
      );
    }
    if (decoded.claims.nonce !== options.nonce) {
      throw new Error(
        `Nonce (nonce) claim mismatch in the ID token; expected "${options.nonce}", found "${decoded.claims.nonce}"`
      );
    }
  }

  if (options.max_age && !isNumber(decoded.claims.auth_time)) {
    throw new Error(
      'Authentication Time (auth_time) claim must be a number present in the ID token when Max Age (max_age) is specified'
    );
  }

  /* c8 ignore next 5 */
  if (decoded.claims.exp == null || !isNumber(decoded.claims.exp)) {
    throw new Error(
      'Expiration Time (exp) claim must be a number present in the ID token'
    );
  }
  if (!isNumber(decoded.claims.iat)) {
    throw new Error(
      'Issued At (iat) claim must be a number present in the ID token'
    );
  }

  const leeway = options.leeway || 60;
  const now = new Date(options.now || Date.now());
  const expDate = new Date(0);

  expDate.setUTCSeconds(decoded.claims.exp + leeway);

  if (now > expDate) {
    throw new Error(
      `Expiration Time (exp) claim error in the ID token; current time (${now}) is after expiration time (${expDate})`
    );
  }

  if (decoded.claims.nbf != null && isNumber(decoded.claims.nbf)) {
    const nbfDate = new Date(0);
    nbfDate.setUTCSeconds(decoded.claims.nbf - leeway);
    if (now < nbfDate) {
      throw new Error(
        `Not Before time (nbf) claim in the ID token indicates that this token can't be used just yet. Current time (${now}) is before ${nbfDate}`
      );
    }
  }

  if (decoded.claims.auth_time != null && isNumber(decoded.claims.auth_time)) {
    const authTimeDate = new Date(0);
    authTimeDate.setUTCSeconds(
      parseInt(decoded.claims.auth_time) + (options.max_age as number) + leeway
    );

    if (now > authTimeDate) {
      throw new Error(
        `Authentication Time (auth_time) claim in the ID token indicates that too much time has passed since the last end-user authentication. Current time (${now}) is after last auth at ${authTimeDate}`
      );
    }
  }

  if (options.organization) {
    const org = options.organization.trim();
    if (org.startsWith('org_')) {
      const orgId = org;
      if (!decoded.claims.org_id) {
        throw new Error(
          'Organization ID (org_id) claim must be a string present in the ID token'
        );
      } else if (orgId !== decoded.claims.org_id) {
        throw new Error(
          `Organization ID (org_id) claim mismatch in the ID token; expected "${orgId}", found "${decoded.claims.org_id}"`
        );
      }
    } else {
      const orgName = org.toLowerCase();
      // TODO should we verify if there is an `org_id` claim?
      if (!decoded.claims.org_name) {
        throw new Error(
          'Organization Name (org_name) claim must be a string present in the ID token'
        );
      } else if (orgName !== decoded.claims.org_name) {
        throw new Error(
          `Organization Name (org_name) claim mismatch in the ID token; expected "${orgName}", found "${decoded.claims.org_name}"`
        );
      }
    }
  }

  return decoded;
};

/**
 * Verifies the signature of a JWT token using JWKS
 * @param token The JWT token string
 * @param issuer The token issuer URL
 * @returns Promise<boolean> True if signature is valid
 */
const verifySignature = async (token: string, issuer: string): Promise<boolean> => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    const [headerB64, payloadB64, signatureB64] = parts;
    const header = JSON.parse(urlDecodeB64(headerB64));
    
    // Check if we have a key ID
    if (!header.kid) {
      throw new Error('JWT header missing key ID (kid)');
    }
    
    // Check algorithm
    if (!['RS256', 'RS384', 'RS512'].includes(header.alg)) {
      throw new Error(`Unsupported signature algorithm: ${header.alg}`);
    }
    
    // Fetch JWKS
    const jwks = await fetchJWKS(issuer);
    
    // Find the key
    const jwk = findJWKByKid(jwks, header.kid);
    if (!jwk) {
      throw new Error(`No matching key found for kid: ${header.kid}`);
    }
    
    // Convert JWK to CryptoKey
    const cryptoKey = await jwkToCryptoKey(jwk);
    
    // Prepare signature verification
    const signatureData = `${headerB64}.${payloadB64}`;
    const signatureBytes = Uint8Array.from(
      atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), 
      c => c.charCodeAt(0)
    );
    
    // Determine hash algorithm based on JWT algorithm
    let hashAlgorithm = 'SHA-256';
    if (header.alg === 'RS384') {
      hashAlgorithm = 'SHA-384';
    } else if (header.alg === 'RS512') {
      hashAlgorithm = 'SHA-512';
    }
    
    // Verify signature
    const isValid = await getCrypto().subtle.verify(
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: { name: hashAlgorithm }
      },
      cryptoKey,
      signatureBytes,
      new TextEncoder().encode(signatureData)
    );
    
    return isValid;
  } catch (error) {
    throw new Error(`Signature verification failed: ${error.message}`);
  }
};
