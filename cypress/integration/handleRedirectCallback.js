import { shouldBe, shouldNotBeUndefined, whenReady } from '../support/utils';

describe('handleRedirectCallback', () => {
  beforeEach(cy.resetTests);

  it('caches token and user', () => {
    cy.loginNoCallback().then(() => {
      whenReady().then(win => {
        return win.auth0.handleRedirectCallback().then(() => {
          const user = win.auth0.getUser();
          shouldBe('johnfoo+integration@gmail.com', user.email);

          const token = win.auth0.getTokenSilently();
          shouldNotBeUndefined(token);

          const isAuthenticated = win.auth0.isAuthenticated();
          shouldBe(true, isAuthenticated);
        });
      });
    });
  });
});
