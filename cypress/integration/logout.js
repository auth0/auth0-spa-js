import { shouldBe, shouldBeUndefined, whenReady } from '../support/utils';

describe('logout', function() {
  beforeEach(cy.resetTests);

  it('works correctly', function() {
    cy.login().then(() => {
      whenReady().then(win => {
        win.auth0.logout({});
        return cy.wait(2000).then(() =>
          Cypress.Promise.all([
            win.auth0.getUser().then(user => {
              shouldBeUndefined(user);
            }),
            win.auth0.getTokenSilently().catch(e => {
              shouldBe(e.error, 'login_required');
            })
          ])
        );
      });
    });
  });
});
