import { shouldBe, shouldBeUndefined, whenReady } from '../support/utils';

describe('logout', () => {
  beforeEach(cy.resetTests);

  it('works correctly', () => {
    cy.login().then(() => {
      whenReady().then(win => {
        win.auth0.logout({});
        return cy.wait(2000).then(() => {
          const user = win.auth0.getUser();
          shouldBeUndefined(user);

          try {
            win.auth0.getTokenSilently();
          } catch (e) {
            shouldBe(e.error, 'login_required');
          }
        });
      });
    });
  });
});
