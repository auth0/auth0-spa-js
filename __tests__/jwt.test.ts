import { decode, verify } from '../src/jwt';
import { getCrypto } from '../src/utils';
import IDTokenVerifier from 'idtoken-verifier';
import jwt from 'jsonwebtoken';
import { generateKeyPairSync } from 'crypto';
// Using built-in Jest types rather than @jest/globals
// import { expect } from '@jest/globals';

const verifyOptions = {
  iss: 'https://brucke.auth0.com/',
  aud: 'k5u3o2fiAA8XweXEEX604KCwCjzjtMU6',
  nonce: 'omcw.ptjx3~.8VBm3OuMziLdn5PB0uXG',
  clientId: 'the_client_id'
};

const symmetricKey = 'shared secret';

const createPrivateKey = () => {
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048
  });
  return privateKey.export({
    format: 'pem',
    type: 'pkcs8'
  });
};

const DEFAULT_PAYLOAD = <any>{
  sub: 'id|123',
  payload: true,
  nonce: verifyOptions.nonce,
  azp: verifyOptions.aud
};
const createJWT = (
  payload = DEFAULT_PAYLOAD,
  options: Record<string, any> = {}
) => {
  const key = options.algorithm === 'HS256' ? symmetricKey : createPrivateKey();

  return jwt.sign(payload, key, {
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

describe('jwt', () => {
  const IDTOKEN_ERROR_MESSAGE = 'ID token could not be decoded';
  let now: number;
  let realDateNowFn: () => number;

  beforeEach(() => {
    // Mock the date, but pin it to the current time so that everything gets the same time
    realDateNowFn = Date.now;
    now = realDateNowFn();
    global.Date.now = jest.fn(() => now);
  });

  afterEach(() => {
    global.Date.now = realDateNowFn;
  });

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

  it('verifies correctly', async () => {
    const id_token = await createJWT();

    const { encoded, header, claims } = await verify({
      ...verifyOptions,
      id_token
    });

    expect({ encoded, header, payload: claims }).toMatchObject(
      verifier.decode(id_token)
    );

    return new Promise<void>(res => {
      verifier.verify(id_token, verifyOptions.nonce, (err, payload) => {
        expect(err).toBe(null);
        expect(claims).toMatchObject(payload as Record<string, string>);
        res();
      });
    });
  });

  it('verifies correctly with multiple audiences and azp', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, {
      audience: ['item 1', verifyOptions.aud]
    });

    const { encoded, header, claims } = await verify({
      ...verifyOptions,
      id_token
    });
    expect({ encoded, header, payload: claims }).toMatchObject(
      verifier.decode(id_token)
    );
  });

  it('verifies correctly with an organization ID', async () => {
    const org_id = 'org_123';

    const id_token = await createJWT({ ...DEFAULT_PAYLOAD, org_id });

    const { encoded, header, claims } = await verify({
      ...verifyOptions,
      id_token,
      organization: org_id
    });

    expect({ encoded, header, payload: claims }).toMatchObject(
      verifier.decode(id_token)
    );
  });

  it('verifies correctly with an organization Name', async () => {
    const org_name = 'my-org';

    const id_token = await createJWT({ ...DEFAULT_PAYLOAD, org_name });

    const { encoded, header, claims } = await verify({
      ...verifyOptions,
      id_token,
      organization: org_name
    });

    expect({ encoded, header, payload: claims }).toMatchObject(
      verifier.decode(id_token)
    );
  });

  it('verifies correctly with an organization Name in wrong case', async () => {
    const org_name = 'my-org';

    const id_token = await createJWT({ ...DEFAULT_PAYLOAD, org_name });

    const { encoded, header, claims } = await verify({
      ...verifyOptions,
      id_token,
      organization: 'My-org'
    });

    expect({ encoded, header, payload: claims }).toMatchObject(
      verifier.decode(id_token)
    );
  });

  it('verifies correctly with an organization Name surrounded by whitespace', async () => {
    const org_name = 'my-org';

    const id_token = await createJWT({ ...DEFAULT_PAYLOAD, org_name });

    const { encoded, header, claims } = await verify({
      ...verifyOptions,
      id_token,
      organization: '  my-org  '
    });

    expect({ encoded, header, payload: claims }).toMatchObject(
      verifier.decode(id_token)
    );
  });

  it('validates id_token is present', async () => {
    await expect(verify({ ...verifyOptions, id_token: '' })).rejects.toThrow(
      'ID token is required but missing'
    );
  });

  it('validates algorithm', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, {
      algorithm: 'HS256'
    });

    await expect(verify({ ...verifyOptions, id_token })).rejects.toThrow(
      `Signature algorithm of "HS256" is not supported. Expected the ID token to be signed with "RS256".`
    );
  });

  it('validates issuer is present', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, { issuer: '' });
    await expect(verify({ ...verifyOptions, id_token })).rejects.toThrow(
      'Issuer (iss) claim must be a string present in the ID token'
    );
  });
  it('validates issuer', async () => {
    const id_token = await createJWT();
    await expect(verify({ ...verifyOptions, id_token, iss: 'wrong' })).rejects.toThrow(
      `Issuer (iss) claim mismatch in the ID token; expected "wrong", found "${verifyOptions.iss}"`
    );
  });
  it('validates `sub` is present', async () => {
    const id_token = await createJWT({ ...DEFAULT_PAYLOAD, sub: undefined });
    await expect(verify({ ...verifyOptions, id_token })).rejects.toThrow(
      'Subject (sub) claim must be a string present in the ID token'
    );
  });
  it('validates aud is present', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, { audience: '' });
    await expect(verify({ ...verifyOptions, id_token })).rejects.toThrow(
      'Audience (aud) claim must be a string or array of strings present in the ID token'
    );
  });
  it('validates audience with `aud` is an array', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, {
      audience: ['client_id']
    });
    await expect(verify({ ...verifyOptions, id_token, aud: 'wrong' })).rejects.toThrow(
      `Audience (aud) claim mismatch in the ID token; expected "wrong" but was not one of "client_id"`
    );
  });
  it('validates audience with `aud` is a string', async () => {
    const id_token = await createJWT();
    await expect(verify({ ...verifyOptions, id_token, aud: 'wrong' })).rejects.toThrow(
      `Audience (aud) claim mismatch in the ID token; expected "wrong" but found "${verifyOptions.aud}"`
    );
  });
  it('validates exp', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, {
      expiresIn: '-1h'
    });
    await expect(verify({ ...verifyOptions, id_token })).rejects.toThrow(
      `Expiration Time (exp) claim error in the ID token`
    );
  });
  it('validates exp using custom now', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, {
      expiresIn: '-1h'
    });
    await expect(
      verify({ ...verifyOptions, id_token, now: Date.now() - 3600 * 1000 })
    ).resolves.not.toThrow();
  });
  it('validates nbf', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, {
      notBefore: '1h'
    });
    await expect(verify({ ...verifyOptions, id_token })).rejects.toThrow(
      `Not Before time (nbf) claim in the ID token indicates that this token can't be used just yet.`
    );
  });
  it('validates iat is present', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, { noTimestamp: true });
    await expect(verify({ ...verifyOptions, id_token })).rejects.toThrow(
      'Issued At (iat) claim must be a number present in the ID token'
    );
  });
  it('does not validate nonce is present when options.nonce is undefined', async () => {
    const id_token = await createJWT({ ...DEFAULT_PAYLOAD, nonce: undefined });
    await expect(
      verify({ ...verifyOptions, nonce: undefined, id_token })
    ).resolves.not.toThrow();
  });
  it('validates nonce is present', async () => {
    const id_token = await createJWT({ ...DEFAULT_PAYLOAD, nonce: undefined });
    await expect(verify({ ...verifyOptions, id_token })).rejects.toThrow(
      'Nonce (nonce) claim must be a string present in the ID token'
    );
  });
  it('validates nonce', async () => {
    const id_token = await createJWT();
    await expect(
      verify({ ...verifyOptions, id_token, nonce: 'wrong' })
    ).rejects.toThrow(
      `Nonce (nonce) claim mismatch in the ID token; expected "wrong", found "${verifyOptions.nonce}"`
    );
  });
  it('does not validate azp is present when `aud` is a string', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, {
      audience: 'aud'
    });
    await expect(
      verify({ ...verifyOptions, id_token, aud: 'aud' })
    ).resolves.not.toThrow();
  });
  it('does not validate azp is present when `aud` is an array with a single item', async () => {
    const id_token = await createJWT(DEFAULT_PAYLOAD, {
      audience: ['item 1']
    });
    await expect(
      verify({ ...verifyOptions, id_token, aud: 'item 1' })
    ).resolves.not.toThrow();
  });
  it('validates azp is present when `aud` is an array with more than one item', async () => {
    const id_token = await createJWT(
      { ...DEFAULT_PAYLOAD, azp: undefined },
      {
        audience: ['item 1', 'other_value']
      }
    );
    await expect(
      verify({ ...verifyOptions, id_token, aud: 'other_value' })
    ).rejects.toThrow(
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
    await expect(
      verify({ ...verifyOptions, id_token, aud: 'other_value' })
    ).rejects.toThrow(
      `Authorized Party (azp) claim mismatch in the ID token; expected "other_value", found "not_the_client_id"`
    );
  });
  it('validate auth_time is present when max_age is provided', async () => {
    const id_token = await createJWT({ ...DEFAULT_PAYLOAD });

    await expect(verify({ ...verifyOptions, id_token, max_age: 123 })).rejects.toThrow(
      'Authentication Time (auth_time) claim must be a number present in the ID token when Max Age (max_age) is specified'
    );
  });

  it('validate auth_time + max_age is in the future', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const maxAge = 1;
    const leeway = 60;
    const authTime = Math.floor(yesterday.getTime() / 1000);
    const authTimeDateCorrected = new Date((authTime + maxAge + leeway) * 1000);

    const id_token = await createJWT({
      ...DEFAULT_PAYLOAD,
      auth_time: authTime
    });

    await expect(
      verify({ ...verifyOptions, id_token, max_age: maxAge, leeway })
    ).rejects.toThrow(
      `Authentication Time (auth_time) claim in the ID token indicates that too much time has passed since the last end-user authentication. Current time (${new Date(
        now
      )}) is after last auth at ${authTimeDateCorrected}`
    );
  });

  it('validate auth_time + max_age is in the future using custom now', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const maxAge = 1;
    const leeway = 60;
    const authTime = Math.floor(yesterday.getTime() / 1000);

    const id_token = await createJWT({
      ...DEFAULT_PAYLOAD,
      auth_time: authTime
    });

    await expect(
      verify({
        ...verifyOptions,
        id_token,
        max_age: maxAge,
        leeway,
        now: Math.floor(yesterday.getTime())
      })
    ).resolves.not.toThrow();
  });

  it('validate org_id is present when organization id is provided', async () => {
    const id_token = await createJWT({ ...DEFAULT_PAYLOAD });

    await expect(
      verify({ ...verifyOptions, id_token, organization: 'org_123' })
    ).rejects.toThrow(
      'Organization ID (org_id) claim must be a string present in the ID token'
    );
  });

  it('validate org_id matches the claim when organization id is provided', async () => {
    const id_token = await createJWT({
      ...DEFAULT_PAYLOAD,
      org_id: 'test_org_456'
    });

    await expect(
      verify({ ...verifyOptions, id_token, organization: 'org_123' })
    ).rejects.toThrow(
      'Organization ID (org_id) claim mismatch in the ID token; expected "org_123", found "test_org_456"'
    );
  });

  it('validate org_name is present when organization name is provided', async () => {
    const id_token = await createJWT({ ...DEFAULT_PAYLOAD });

    await expect(
      verify({ ...verifyOptions, id_token, organization: 'my-org' })
    ).rejects.toThrow(
      'Organization Name (org_name) claim must be a string present in the ID token'
    );
  });

  it('validate org_id matches the claim when organization id is provided', async () => {
    const id_token = await createJWT({
      ...DEFAULT_PAYLOAD,
      org_name: 'my-other-org'
    });

    await expect(
      verify({ ...verifyOptions, id_token, organization: 'my-org' })
    ).rejects.toThrow(
      'Organization Name (org_name) claim mismatch in the ID token; expected "my-org", found "my-other-org"'
    );
  });

  describe('signature validation', () => {
    it('should skip signature validation when validateSignature is false', async () => {
      const id_token = await createJWT(DEFAULT_PAYLOAD);
      
      const result = await verify({ 
        ...verifyOptions, 
        id_token, 
        validateSignature: false 
      });
      
      expect(result.claims.payload).toBe(true);
    });

    it('should skip signature validation when validateSignature is undefined', async () => {
      const id_token = await createJWT(DEFAULT_PAYLOAD);
      
      const result = await verify({ 
        ...verifyOptions, 
        id_token 
      });
      
      expect(result.claims.payload).toBe(true);
    });

    // Note: Real signature validation tests would require setting up a proper JWKS endpoint
    // or mocking the jose library. For now, we test that the code path is reached.
    it('should attempt signature validation when validateSignature is true', async () => {
      const id_token = await createJWT(DEFAULT_PAYLOAD);
      
      // This will fail since we don't have a real JWKS endpoint, but we test that
      // the validation is attempted (as opposed to being skipped)
      await expect(verify({ 
        ...verifyOptions, 
        id_token, 
        validateSignature: true 
      })).rejects.toThrow('Signature verification failed');
    });
  });
});
