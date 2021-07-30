import { configureTenant } from '../support/utils';

describe('handleRedirectCallback', function () {
  beforeEach(cy.resetTests);

  it('caches token and user', function () {
    configureTenant();
    cy.loginNoCallback();
    cy.handleRedirectCallback();
    cy.isAuthenticated().should('contain', 'true');
    cy.getAccessTokens().should('have.length', 1);
    cy.getUser().should('be.visible');
  });
});
