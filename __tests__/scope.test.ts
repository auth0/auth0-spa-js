import { getUniqueScopes } from '../src/scope';

describe('getUniqueScopes', () => {
  it('removes duplicates', () => {
    expect(getUniqueScopes('openid openid', 'email')).toBe('openid email');
  });
  it('handles whitespace', () => {
    expect(getUniqueScopes(' openid    profile  ', ' ')).toBe('openid profile');
  });
  it('handles undefined/empty/null', () => {
    expect(
      getUniqueScopes('openid profile', 'email', undefined, '', null)
    ).toBe('openid profile email');
  });
});
