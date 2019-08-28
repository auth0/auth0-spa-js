import { urlDecodeB64 } from './utils';

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
  const [header, payload, signature] = token.split('.');
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

export const verify = (options: JWTVerifyOptions) => {
  if (!options.id_token) {
    throw new Error('id_token not present in authentication response');
  }

  const decoded = decode(options.id_token);

  if (!decoded.user.sub) {
    throw new Error('id_token does not contain a `sub` claim');
  }

  if (decoded.header.alg !== 'RS256') {
    throw new Error('Invalid algorithm');
  }
  if (!decoded.claims.iss) {
    throw new Error('id_token does not contain a `iss` claim');
  }
  if (decoded.claims.iss !== options.iss) {
    throw new Error('Invalid issuer');
  }
  if (!decoded.claims.aud) {
    throw new Error('id_token does not contain an `aud` claim');
  }
  if (Array.isArray(decoded.claims.aud)) {
    if (!decoded.claims.aud.includes(options.aud)) {
      throw new Error('Invalid audience');
    }
    if (decoded.claims.aud.length > 1) {
      if (!decoded.claims.azp) {
        throw new Error('id_token does not contain an `azp` claim');
      }
      if (decoded.claims.azp !== options.client_id) {
        throw new Error('Invalid authorized party');
      }
    }
  } else if (decoded.claims.aud !== options.aud) {
    throw new Error('Invalid audience');
  }

  if (!decoded.claims.nonce) {
    throw new Error('id_token does not contain a `nonce` claim');
  }

  if (decoded.claims.nonce !== options.nonce) {
    throw new Error('Invalid nonce');
  }

  if (options.max_age && !decoded.claims.auth_time) {
    throw new Error('id_token does not contain an `auth_time` claim');
  }

  /* istanbul ignore next */
  if (!decoded.claims.exp) {
    throw new Error('id_token does not contain an `exp` claim');
  }
  if (!decoded.claims.iat) {
    throw new Error('id_token does not contain an `iat` claim');
  }

  const now = new Date();
  const expDate = new Date(0);
  const iatDate = new Date(0);
  const nbfDate = new Date(0);
  const authTimeDate = new Date(
    parseInt(decoded.claims.auth_time) + parseInt(options.max_age)
  );
  const leeway = options.leeway || 60;
  expDate.setUTCSeconds(decoded.claims.exp + leeway);
  iatDate.setUTCSeconds(decoded.claims.iat - leeway);
  nbfDate.setUTCSeconds(decoded.claims.nbf - leeway);

  if (now > expDate) {
    throw new Error('id_token expired');
  }
  if (now < iatDate) {
    throw new Error('id_token was issued in the future (invalid iat)');
  }
  if (typeof decoded.claims.nbf !== 'undefined' && now < nbfDate) {
    throw new Error('token is not yet valid (invalid notBefore)');
  }
  if (typeof decoded.claims.auth_time !== 'undefined' && now > authTimeDate) {
    throw new Error('auth_time error');
  }
  return decoded;
};
