import { decode } from 'qss';
import {
  shouldBe,
  shouldNotBe,
  shouldBeUndefined,
  shouldNotBeUndefined,
  whenReady
} from '../support/utils';

describe('getTokenSilently', function() {
  beforeEach(cy.resetTests);

  it('returns an error when not logged in', function(done) {
    whenReady().then(win =>
      win.auth0.getTokenSilently().catch(error => {
        shouldBe('login_required', error.error);
        done();
      })
    );
  });

  describe('when using an iframe', () => {
    beforeEach(() => {
      return whenReady().then(() => cy.login());
    });

    afterEach(cy.logout);

    it('gets a new access token', () => {
      cy.get('#getToken').click();
      cy.get('[data-cy=access-token]').should('have.length', 2); // 1 from handleRedirectCallback, 1 from clicking "Get access token"
      cy.get('[data-cy=error]').should('not.exist');
    });
  });
});
