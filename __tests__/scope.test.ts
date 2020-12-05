import { getMissingScope, getUniqueScopes } from '../src/scope';

describe('getUniqueScopes', () => {
  it('removes duplicates', () => {
    expect(getUniqueScopes('openid openid', 'email')).toBe('openid email');
  });

  it('handles whitespace', () => {
    expect(getUniqueScopes(' openid    profile  ', ' ')).toBe('openid profile');
  });

  it('handles undefined/empty/null/whitespace', () => {
    expect(
      getUniqueScopes('openid profile', ' ', undefined, 'email', '', null)
    ).toBe('openid profile email');
  });
});

describe('getMissingScopes', () => {
  it('returns missing scopes', () => {
    expect(getMissingScope('openid test test2', 'openid')).toBe('test test2');
  });

  it('returns an empty string if nothing missing', () => {
    expect(getMissingScope(' openid test', 'openid test')).toBe('');
  });
});
