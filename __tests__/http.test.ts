import {
  MfaRequiredError,
  MissingRefreshTokenError,
  UseDpopNonceError
} from '../src/errors';
import { switchFetch, getJSON } from '../src/http';
import { expect } from '@jest/globals';
import { TEST_AUDIENCE, TEST_CLIENT_ID, TEST_SCOPES } from './constants';
import { Dpop } from '../src/dpop/dpop';

jest.mock('../src/worker/token.worker');

const mockUnfetch = <jest.Mock>fetch;

afterEach(() => {
  jest.resetAllMocks();
});

describe('switchFetch', () => {
  it('clears timeout when successful', async () => {
    mockUnfetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(),
        headers: new Headers()
      })
    );
    jest.spyOn(window, 'clearTimeout');
    await switchFetch('https://test.com/', null, null, {}, undefined);
    expect(clearTimeout).toBeCalledTimes(1);
  });
});

describe('getJson', () => {
  it('throws MfaRequiredError when mfa_required is returned', async () => {
    mockUnfetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'mfa_required' }),
        headers: new Headers()
      })
    );

    await expect(
      getJSON('https://test.com/', null, null, null, {}, undefined)
    ).rejects.toBeInstanceOf(MfaRequiredError);
  });

  it('reads the mfa_token when mfa_required is returned', async () => {
    mockUnfetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        json: () =>
          Promise.resolve({ error: 'mfa_required', mfa_token: '1234' }),
        headers: new Headers()
      })
    );

    await expect(
      getJSON('https://test.com/', null, null, null, {}, undefined)
    ).rejects.toHaveProperty('mfa_token', '1234');
  });

  it('throws MissingRefreshTokenError when missing_refresh_token is returned', async () => {
    mockUnfetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'missing_refresh_token' }),
        headers: new Headers()
      })
    );

    await expect(
      getJSON('https://test.com/', null, null, null, {}, undefined)
    ).rejects.toBeInstanceOf(MissingRefreshTokenError);
  });

  it('includes the DPoP proof when handler passed', async () => {
    const dpop = new Dpop(TEST_CLIENT_ID);

    const fakeDpopProof = 'abc.xyz.123';

    dpop.generateProof = () => Promise.resolve(fakeDpopProof);

    mockUnfetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
      headers: new Headers()
    });

    await getJSON(
      'https://example.com',
      undefined,
      TEST_AUDIENCE,
      TEST_SCOPES,
      {},
      undefined,
      undefined,
      dpop
    );

    expect(mockUnfetch.mock.calls[0][1].headers.dpop).toBe(fakeDpopProof);
  });

  it('does not include the DPoP proof when handler not passed', async () => {
    mockUnfetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
      headers: new Headers()
    });

    await getJSON(
      'https://example.com',
      undefined,
      TEST_AUDIENCE,
      TEST_SCOPES,
      {},
      undefined,
      undefined,
      undefined
    );

    expect(mockUnfetch.mock.calls[0][1].headers?.dpop).toBeUndefined();
  });

  it('updates the nonce when present in response', async () => {
    const dpop = new Dpop(TEST_CLIENT_ID);

    jest.spyOn(dpop, 'generateProof').mockResolvedValueOnce('unused');
    jest.spyOn(dpop, 'setNonce').mockResolvedValueOnce();

    const fakeDpopNonce = 'abcdef123456';

    mockUnfetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
      headers: new Headers({ 'dpop-nonce': fakeDpopNonce })
    });

    await getJSON(
      'https://example.com',
      undefined,
      TEST_AUDIENCE,
      TEST_SCOPES,
      {},
      undefined,
      undefined,
      dpop
    );

    expect(dpop.setNonce).toHaveBeenCalledWith(fakeDpopNonce);
  });

  it('does not update nonce when absent in response', async () => {
    const dpop = new Dpop(TEST_CLIENT_ID);

    jest.spyOn(dpop, 'generateProof').mockResolvedValueOnce('unused');
    jest.spyOn(dpop, 'setNonce').mockResolvedValueOnce();

    mockUnfetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
      headers: new Headers() // no dpop-nonce header
    });

    await getJSON(
      'https://example.com',
      undefined,
      TEST_AUDIENCE,
      TEST_SCOPES,
      {},
      undefined,
      undefined,
      dpop
    );

    expect(dpop.setNonce).not.toHaveBeenCalled();
  });

  it('throws UseDpopNonceError when nonce is wrong twice', async () => {
    const dpop = new Dpop(TEST_CLIENT_ID);

    jest.spyOn(dpop, 'generateProof').mockResolvedValue('unused');
    jest.spyOn(dpop, 'setNonce').mockResolvedValue();

    // always reject
    mockUnfetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'use_dpop_nonce' }),
      headers: new Headers()
    });

    let error: Error | undefined;

    try {
      await getJSON(
        'https://example.com',
        undefined,
        TEST_AUDIENCE,
        TEST_SCOPES,
        {},
        undefined,
        undefined,
        dpop
      );
    } catch (err) {
      error = err;
    }

    expect(error).toBeInstanceOf(UseDpopNonceError);
  });

  it('does not throw when nonce is wrong but then valid', async () => {
    const dpop = new Dpop(TEST_CLIENT_ID);

    jest.spyOn(dpop, 'generateProof').mockResolvedValue('unused');
    jest.spyOn(dpop, 'setNonce').mockResolvedValue();

    mockUnfetch
      // reject first try and respond with a new nonce
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'use_dpop_nonce' }),
        headers: new Headers({ 'dpop-nonce': 'new_good_nonce' })
      })

      // then accept second try
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
        headers: new Headers()
      });

    let output: unknown;

    try {
      output = await getJSON(
        'https://example.com',
        undefined,
        TEST_AUDIENCE,
        TEST_SCOPES,
        {},
        undefined,
        undefined,
        dpop
      );
    } catch (err) {}

    expect(output).not.toBeUndefined();
  });
});
