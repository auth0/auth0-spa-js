describe('logout', function () {
  beforeEach(cy.resetTests);

  it('works correctly', function () {
    cy.login();
    cy.isAuthenticated().should('contain', 'true');
    cy.logout();
    cy.getUser().should('not.be.visible');
    cy.isAuthenticated().should('contain', 'false');
    cy.getTokenSilently().then(() => cy.getError().should('be.visible'));
  });
});
