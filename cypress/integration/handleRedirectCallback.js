describe('handleRedirectCallback', function () {
  beforeEach(cy.resetTests);

  it('caches token and user', function () {
    cy.loginNoCallback();
    cy.handleRedirectCallback();
    cy.isAuthenticated().should('contain', 'true');
    cy.getAccessTokens().should('have.length', 1);
    cy.getUser().should('be.visible');
  });
});
