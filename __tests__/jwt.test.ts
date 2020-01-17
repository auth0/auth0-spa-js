import { decode, verify } from '../src/jwt';
import IDTokenVerifier from 'idtoken-verifier';
import jwt from 'jsonwebtoken';
import pem from 'pem';
interface Certificate {
  serviceKey: string;
  certificate: string;
  publicKey: string;
}

const verifyOptions = {
  iss: 'https://brucke.auth0.com/',
  aud: 'k5u3o2fiAA8XweXEEX604KCwCjzjtMU6',
  nonce: 'omcw.ptjx3~.8VBm3OuMziLdn5PB0uXG',
  client_id: 'the_client_id'
};

const createCertificate = (): Promise<Certificate> =>
  new Promise((res, rej) => {
    pem.createCertificate({ days: 1, selfSigned: true }, function(err, keys) {
      if (err) {
        return rej(err);
      }
      pem.getPublicKey(keys.certificate, function(e, p) {
        if (e) {
          return rej(e);
        }
        res({
          serviceKey: keys.serviceKey,
          certificate: keys.certificate,
          publicKey: p.publicKey
        });
      });
    });
  });

const DEFAULT_PAYLOAD = <any>{
  sub: 'id|123',
  payload: true,
  nonce: verifyOptions.nonce,
  azp: verifyOptions.aud
};
const createJWT = async (payload = DEFAULT_PAYLOAD, options = {}) => {
  const cert = await createCertificate();
  return jwt.sign(payload, cert.serviceKey, {
    algorithm: 'RS256',
    audience: verifyOptions.aud,
    issuer: verifyOptions.iss,
    expiresIn: '1h',
    keyid: 'NEVBNUNBOTgxRkE5NkQzQzc4OTBEMEFFRDQ5N0Q2Qjk0RkQ1MjFGMQ',
    ...options
  });
};

const verifier = new IDTokenVerifier({
  issuer: verifyOptions.iss,
  audience: verifyOptions.aud
});
verifier.getRsaVerifier = (_, __, cb) => cb(null, { verify: () => true });

describe('jwt', async () => {
  it('decodes correctly', () => {
    const id_token =
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp0cnVlLCJpYXQiOjE1NTEzNjIzOTAsImV4cCI6MTU1MTM2NTk5MCwiYXVkIjoiazV1M28yZmlBQThYd2VYRUVYNjA0S0N3Q2p6anRNVTYiLCJpc3MiOiJodHRwczovL2JydWNrZS5hdXRoMC5jb20vIn0.MeU2xC4qwr6JvYeDjCRbzT78mvugpVcSlkoGqRsA-ig-JUHuKMsBO1mNgsilRaxulf_zEl-XktKpq9IisamKSRe1UeboESXsZ02nbZqP5i0X4pdYnTI9Z51Iuet2GAJqPDTMpyj-BA0yiROd1X3Ot91_Fh1ZU7EyZmYdoyJrx_Cue1ituMMIWBk1JOs6rMKy1xVCFoDk20upQzf5Xuy2oGtaRhrQzz5sdRR9Y5yxEN5kzcHrGVaZ_fLMYkUDF_aKv4PTFU-I-0HpP_-4PtcjTUJpeXDK_7BzpA6fAdnqaRTl6iYgNKl7R19_8QfQpoTkeJBmZ7HxW_13s03G5jNLSg';
    const result = decode(id_token);
    const { encoded, header, claims } = result;
    expect({ encoded, header, payload: claims }).toMatchObject(
      verifier.decode(id_token)
    );
    expect(result).toMatchObject({
      encoded: {
        header: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9',
        payload:
          'eyJwYXlsb2FkIjp0cnVlLCJpYXQiOjE1NTEzNjIzOTAsImV4cCI6MTU1MTM2NTk5MCwiYXVkIjoiazV1M28yZmlBQThYd2VYRUVYNjA0S0N3Q2p6anRNVTYiLCJpc3MiOiJodHRwczovL2JydWNrZS5hdXRoMC5jb20vIn0',
        signature:
          'MeU2xC4qwr6JvYeDjCRbzT78mvugpVcSlkoGqRsA-ig-JUHuKMsBO1mNgsilRaxulf_zEl-XktKpq9IisamKSRe1UeboESXsZ02nbZqP5i0X4pdYnTI9Z51Iuet2GAJqPDTMpyj-BA0yiROd1X3Ot91_Fh1ZU7EyZmYdoyJrx_Cue1ituMMIWBk1JOs6rMKy1xVCFoDk20upQzf5Xuy2oGtaRhrQzz5sdRR9Y5yxEN5kzcHrGVaZ_fLMYkUDF_aKv4PTFU-I-0HpP_-4PtcjTUJpeXDK_7BzpA6fAdnqaRTl6iYgNKl7R19_8QfQpoTkeJBmZ7HxW_13s03G5jNLSg'
      },
      header: { alg: 'RS256', typ: 'JWT' },
      user: {
        payload: true
      },
      claims: {
        __raw: id_token,
        aud: 'k5u3o2fiAA8XweXEEX604KCwCjzjtMU6',
        exp: 1551365990,
        iat: 1551362390,
        iss: 'https://brucke.auth0.com/'
      }
    });
  });
  describe('validates id_token', () => {
    const IDTOKEN_ERROR_MESSAGE = 'ID token could not be decoded';
    it('throws when there is less than 3 parts', () => {
      expect(() => decode('test')).toThrow(IDTOKEN_ERROR_MESSAGE);
      expect(() => decode('test.')).toThrow(IDTOKEN_ERROR_MESSAGE);
      expect(() => decode('test.test')).toThrow(IDTOKEN_ERROR_MESSAGE);
      expect(() => decode('test.test.test.test')).toThrow(
        IDTOKEN_ERROR_MESSAGE
      );
    });
    it('throws when there is no header', () => {
      expect(() => decode('.test.test')).toThrow(IDTOKEN_ERROR_MESSAGE);
    });
    it('throws when there is no payload', () => {
      expect(() => decode('test..test')).toThrow(IDTOKEN_ERROR_MESSAGE);
    });
    it('throws when there is no signature', () => {
      expect(() => decode('test.test.')).toThrow(IDTOKEN_ERROR_MESSAGE);
    });
  });
  it('verifies correctly', async done => {
    const id_token = await createJWT();
    const { encoded, header, claims } = verify({
      ...verifyOptions,
      id_token
    });
    expect({ encoded, header, payload: claims }).toMatchObject(
      verifier.decode(id_token)
    );
    verifier.verify(id_token, verifyOptions.nonce, (err, payload) => {
      expect(err).toBe(null);
      expect(claims).toMatchObject(payload);
      done();
    });
  });
  it('verifies correctly with multiple audiences and azp', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, {
      audience: ['item 1', verifyOptions.aud]
    });

    const { encoded, header, claims } = verify({
      ...verifyOptions,
      id_token
    });
    expect({ encoded, header, payload: claims }).toMatchObject(
      verifier.decode(id_token)
    );
  });
  it('validates id_token is present', async () => {
    expect(() => verify({ ...verifyOptions, id_token: '' })).toThrow(
      'ID token is required but missing'
    );
  });

  it('validates algorithm', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, {
      algorithm: 'HS256'
    });
    expect(() => verify({ ...verifyOptions, id_token })).toThrow(
      `Signature algorithm of "HS256" is not supported. Expected the ID token to be signed with "RS256".`
    );
  });
  it('validates issuer is present', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, { issuer: '' });
    expect(() => verify({ ...verifyOptions, id_token })).toThrow(
      'Issuer (iss) claim must be a string present in the ID token'
    );
  });
  it('validates issuer', async () => {
    const id_token = await createJWT();
    expect(() => verify({ ...verifyOptions, id_token, iss: 'wrong' })).toThrow(
      `Issuer (iss) claim mismatch in the ID token; expected "wrong", found "${verifyOptions.iss}"`
    );
  });
  it('validates `sub` is present', async () => {
    const id_token = await createJWT({ ...DEFAULT_PAYLOAD, sub: undefined });
    expect(() => verify({ ...verifyOptions, id_token })).toThrow(
      'Subject (sub) claim must be a string present in the ID token'
    );
  });
  it('validates aud is present', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, { audience: '' });
    expect(() => verify({ ...verifyOptions, id_token })).toThrow(
      'Audience (aud) claim must be a string or array of strings present in the ID token'
    );
  });
  it('validates audience with `aud` is an array', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, {
      audience: ['client_id']
    });
    expect(() => verify({ ...verifyOptions, id_token, aud: 'wrong' })).toThrow(
      `Audience (aud) claim mismatch in the ID token; expected "wrong" but was not one of "client_id"`
    );
  });
  it('validates audience with `aud` is a string', async () => {
    const id_token = await createJWT();
    expect(() => verify({ ...verifyOptions, id_token, aud: 'wrong' })).toThrow(
      `Audience (aud) claim mismatch in the ID token; expected "wrong" but found "${verifyOptions.aud}"`
    );
  });
  it('validates exp', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, {
      expiresIn: '-1h'
    });
    expect(() => verify({ ...verifyOptions, id_token })).toThrow(
      `Expiration Time (exp) claim error in the ID token`
    );
  });
  it('validates nbf', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, {
      notBefore: '1h'
    });
    expect(() => verify({ ...verifyOptions, id_token })).toThrow(
      `Not Before time (nbf) claim in the ID token indicates that this token can't be used just yet.`
    );
  });
  it('validates iat is present', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, { noTimestamp: true });
    expect(() => verify({ ...verifyOptions, id_token })).toThrow(
      'Issued At (iat) claim must be a number present in the ID token'
    );
  });
  it('does not validate nonce is present when options.nonce is undefined', async () => {
    const id_token = await createJWT({ ...DEFAULT_PAYLOAD, nonce: undefined });
    expect(() =>
      verify({ ...verifyOptions, nonce: undefined, id_token })
    ).not.toThrow();
  });
  it('validates nonce is present', async () => {
    const id_token = await createJWT({ ...DEFAULT_PAYLOAD, nonce: undefined });
    expect(() => verify({ ...verifyOptions, id_token })).toThrow(
      'Nonce (nonce) claim must be a string present in the ID token'
    );
  });
  it('validates nonce', async () => {
    const id_token = await createJWT();
    expect(() =>
      verify({ ...verifyOptions, id_token, nonce: 'wrong' })
    ).toThrow(
      `Nonce (nonce) claim mismatch in the ID token; expected "wrong", found "${verifyOptions.nonce}"`
    );
  });
  it('does not validate azp is present when `aud` is a string', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, {
      audience: 'aud'
    });
    expect(() =>
      verify({ ...verifyOptions, id_token, aud: 'aud' })
    ).not.toThrow();
  });
  it('does not validate azp is present when `aud` is an array with a single item', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, {
      audience: ['item 1']
    });
    expect(() =>
      verify({ ...verifyOptions, id_token, aud: 'item 1' })
    ).not.toThrow();
  });
  it('validates azp is present when `aud` is an array with more than one item', async () => {
    const id_token = await createJWT(
      { ...DEFAULT_PAYLOAD, azp: undefined },
      {
        audience: ['item 1', 'other_value']
      }
    );
    expect(() =>
      verify({ ...verifyOptions, id_token, aud: 'other_value' })
    ).toThrow(
      'Authorized Party (azp) claim must be a string present in the ID token when Audience (aud) claim has multiple values'
    );
  });
  it('validates azp when `aud` is an array with more than one item', async () => {
    const id_token = await createJWT(
      { ...DEFAULT_PAYLOAD, azp: 'not_the_client_id' },
      {
        audience: ['item 1', 'other_value']
      }
    );
    expect(() =>
      verify({ ...verifyOptions, id_token, aud: 'other_value' })
    ).toThrow(
      `Authorized Party (azp) claim mismatch in the ID token; expected "other_value", found "not_the_client_id"`
    );
  });
  it('validate auth_time is present when max_age is provided', async () => {
    const id_token = await createJWT({ ...DEFAULT_PAYLOAD });
    expect(() => verify({ ...verifyOptions, id_token, max_age: 123 })).toThrow(
      'Authentication Time (auth_time) claim must be a number present in the ID token when Max Age (max_age) is specified'
    );
  });
  it('validate auth_time + max_age is in the future', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const id_token = await createJWT({
      ...DEFAULT_PAYLOAD,
      auth_time: yesterday.getTime()
    });
    expect(() => verify({ ...verifyOptions, id_token, max_age: 1 })).toThrow(
      'Authentication Time (auth_time) claim in the ID token indicates that too much time has passed since the last end-user authentication.'
    );
  });
});
