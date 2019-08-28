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
  azp: verifyOptions.client_id
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
      'id_token not present in authentication response'
    );
  });

  it('validates algorithm', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, {
      algorithm: 'HS256'
    });
    expect(() => verify({ ...verifyOptions, id_token })).toThrow(
      'Invalid algorithm'
    );
  });
  it('validates issuer is present', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, { issuer: '' });
    expect(() => verify({ ...verifyOptions, id_token })).toThrow(
      'id_token does not contain a `iss` claim'
    );
  });
  it('validates issuer', async () => {
    const id_token = await createJWT();
    expect(() => verify({ ...verifyOptions, id_token, iss: 'wrong' })).toThrow(
      'Invalid issuer'
    );
  });
  it('validates `sub` is present', async () => {
    const id_token = await createJWT({ ...DEFAULT_PAYLOAD, sub: undefined });
    expect(() => verify({ ...verifyOptions, id_token })).toThrow(
      'id_token does not contain a `sub` claim'
    );
  });
  it('validates aud is present', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, { audience: '' });
    expect(() => verify({ ...verifyOptions, id_token })).toThrow(
      'id_token does not contain an `aud` claim'
    );
  });
  it('validates audience with `aud` is an array', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, {
      audience: ['client_id']
    });
    expect(() => verify({ ...verifyOptions, id_token, aud: 'wrong' })).toThrow(
      'Invalid audience'
    );
  });
  it('validates audience with `aud` is a string', async () => {
    const id_token = await createJWT();
    expect(() => verify({ ...verifyOptions, id_token, aud: 'wrong' })).toThrow(
      'Invalid audience'
    );
  });
  it('validates exp', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, {
      expiresIn: '-1h'
    });
    expect(() => verify({ ...verifyOptions, id_token })).toThrow(
      'id_token expired'
    );
  });
  it('validates nbf', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, {
      notBefore: '1h'
    });
    expect(() => verify({ ...verifyOptions, id_token })).toThrow(
      'token is not yet valid (invalid notBefore)'
    );
  });
  it('validates iat is present', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, { noTimestamp: true });
    expect(() => verify({ ...verifyOptions, id_token })).toThrow(
      'id_token does not contain an `iat` claim'
    );
  });
  it('validates iat', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const id_token = await createJWT({
      ...DEFAULT_PAYLOAD,
      iat: tomorrow.getTime()
    });
    expect(() => verify({ ...verifyOptions, id_token })).toThrow(
      'id_token was issued in the future (invalid iat)'
    );
  });
  it('validates nonce is present', async () => {
    const id_token = await createJWT({ ...DEFAULT_PAYLOAD, nonce: undefined });
    expect(() => verify({ ...verifyOptions, id_token })).toThrow(
      'id_token does not contain a `nonce` claim'
    );
  });
  it('validates nonce', async () => {
    const id_token = await createJWT();
    expect(() =>
      verify({ ...verifyOptions, id_token, nonce: 'wrong' })
    ).toThrow('Invalid nonce');
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
    ).toThrow('id_token does not contain an `azp` claim');
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
    ).toThrow('Invalid authorized party');
  });
  it('validate auth_time is present when max_age is provided', async () => {
    const id_token = await createJWT({ ...DEFAULT_PAYLOAD });
    expect(() =>
      verify({ ...verifyOptions, id_token, max_age: '123' })
    ).toThrow('id_token does not contain an `auth_time` claim');
  });
  it('validate auth_time + max_age is in the future', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const id_token = await createJWT({
      ...DEFAULT_PAYLOAD,
      auth_time: `${yesterday.getTime()}`
    });
    expect(() => verify({ ...verifyOptions, id_token, max_age: '1' })).toThrow(
      'auth_time error'
    );
  });
});
