/**
 * @jest-environment node
 */
import { Auth0Client } from '../src/Auth0Client';
import { expect } from '@jest/globals';

describe('In a Node SSR environment', () => {
  it('can be constructed', () => {
    expect(
      () => new Auth0Client({ clientId: 'foo', domain: 'bar' })
    ).not.toThrow();
  });

  it('can check authenticated state', async () => {
    const client = new Auth0Client({ clientId: 'foo', domain: 'bar' });
    expect(await client.isAuthenticated()).toBeFalsy();
    expect(await client.getUser()).toBeUndefined();
  });
});
