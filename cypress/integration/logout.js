import { configureTenant } from '../support/utils';

describe('logout', function () {
  beforeEach(cy.resetTests);
  afterEach(cy.fixCookies);

  it('works correctly', function () {
    configureTenant();
    cy.login();
    cy.isAuthenticated().should('contain', 'true');
    cy.logout();
    cy.getUser().should('not.exist');
    cy.isAuthenticated().should('contain', 'false');
    cy.getTokenSilently().then(() => cy.getError().should('be.visible'));
  });
});
