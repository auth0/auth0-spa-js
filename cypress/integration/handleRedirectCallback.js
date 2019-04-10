import { shouldBe, shouldNotBeUndefined, whenReady } from '../support/utils';

describe('handleRedirectCallback', function() {
  beforeEach(cy.resetTests);

  it('caches token and user', function() {
    cy.loginNoCallback().then(() => {
      whenReady().then(win => {
        return win.auth0
          .handleRedirectCallback()
          .then(() =>
            Cypress.Promise.all([
              win.auth0
                .getUser()
                .then(user =>
                  shouldBe('johnfoo+integration@gmail.com', user.email)
                ),
              win.auth0
                .getTokenSilently()
                .then(token => shouldNotBeUndefined(token)),
              win.auth0
                .isAuthenticated()
                .then(isAuthenticated => shouldBe(true, isAuthenticated))
            ])
          );
      });
    });
  });
});
