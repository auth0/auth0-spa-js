import fetch from 'unfetch';
import { fetchWithTimeout } from '../src/http';

jest.mock('../src/worker/token.worker');
jest.mock('unfetch');

const mockUnfetch = <jest.Mock>fetch;

describe('fetchWithTimeout', () => {
  it('clears timeout when successful', async () => {
    mockUnfetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve()
      })
    );
    jest.spyOn(window, 'clearTimeout');
    await fetchWithTimeout('https://test.com/', null, null, {}, undefined);
    expect(clearTimeout).toBeCalledTimes(1);
  });
});
