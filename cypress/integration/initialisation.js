import { whenReady } from '../support/utils';

describe('initialisation', function () {
  beforeEach(cy.resetTests);

  it('should expose a factory method and constructor', function () {
    whenReady().then(win => {
      assert.isFunction(
        win.createAuth0Client,
        'The createAuth0Client function should be declared on the window.'
      );
      assert.isFunction(
        win.Auth0Client,
        'The Auth0Client constructor should be declared on the window.'
      );
    });
  });
});
