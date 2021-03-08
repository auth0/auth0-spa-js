import { getUniqueScopes } from '../src/scope';

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
