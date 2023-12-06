import { whenReady } from '../support/utils';

describe('initialisation', function () {
  beforeEach(cy.resetTests);
  afterEach(cy.fixCookies);

  it('should expose a factory method and constructor', function () {
    whenReady().then(win => {
      assert.isFunction(
        win.auth0.createAuth0Client,
        'The createAuth0Client function should be declared on window.auth0.'
      );
      assert.isFunction(
        win.auth0.Auth0Client,
        'The Auth0Client constructor should be declared on window.auth0.'
      );
    });
  });
});
