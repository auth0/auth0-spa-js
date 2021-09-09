import fetch from 'unfetch';
import { MfaRequiredError } from '../src/errors';
import { switchFetch, getJSON } from '../src/http';

jest.mock('../src/worker/token.worker');
jest.mock('unfetch');

const mockUnfetch = <jest.Mock>fetch;

describe('switchFetch', () => {
  it('clears timeout when successful', async () => {
    mockUnfetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve()
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
        json: () => Promise.resolve({ error: 'mfa_required' })
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
          Promise.resolve({ error: 'mfa_required', mfa_token: '1234' })
      })
    );

    await expect(
      getJSON('https://test.com/', null, null, null, {}, undefined)
    ).rejects.toHaveProperty('mfa_token', '1234');
  });
});
