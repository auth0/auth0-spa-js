Cypress.Commands.add('useV1', ({ clientScope, foo }) => {
  cy.visit('http://localhost:3000/v1.html');

  // create client
  clientScope && cy.get('[data-cy=client-scope]').clear().type(clientScope);
  foo && cy.get('[data-cy=foo]').clear().type(foo);
  cy.get('[data-cy=create-client]').click();

  // logout
  cy.get('[data-cy=logout]').click();
});

Cypress.Commands.add('loginV1', ({ loginScope, clientScope }) => {
  // set login scope
  loginScope && cy.get('[data-cy=login-scope]').clear().type(loginScope);
  cy.get('[data-cy=login]').click();

  // create client
  clientScope && cy.get('[data-cy=client-scope]').clear().type(clientScope);
  cy.get('[data-cy=create-client]').click();

  // handle callback
  cy.get('[data-cy=handle-redirect-callback]').click();

  // expect user to show up
  cy.get('[data-cy=profile]').should('exist');
});

Cypress.Commands.add('useV2', ({ clientScope, foo }) => {
  cy.visit('http://localhost:3000/v2.html');

  // create client
  clientScope && cy.get('[data-cy=client-scope]').clear().type(clientScope);
  foo && cy.get('[data-cy=foo]').clear().type(foo);
  cy.get('[data-cy=create-client]').click();
});

describe('migration', function () {
  it('Should migrate without setting any scopes', function () {
    cy.server();

    cy.useV1({});
    cy.loginV1({});

    cy.useV2({});

    cy.get('[data-cy=profile]').should('exist');
    cy.get('[data-cy=profile]').should('not.contain', 'bar123');
  });

  it('Should migrate with setting scopes when constructing Auth0Client', function () {
    cy.server();

    cy.useV1({ clientScope: 'Scope1' });
    cy.loginV1({ clientScope: 'Scope1' });

    cy.useV2({ clientScope: 'Scope1' });

    cy.get('[data-cy=profile]').should('exist');
    cy.get('[data-cy=profile]').should('not.contain', 'bar123');
  });

  it('Should migrate with setting scopes when logging in', function () {
    cy.server();

    cy.useV1({});
    cy.loginV1({ loginScope: 'Scope2' });

    cy.useV2({});

    cy.get('[data-cy=profile]').should('exist');
    cy.get('[data-cy=profile]').should('not.contain', 'bar123');
  });

  it('Should migrate when setting scopes when constructing Auth0Client and logging in', function () {
    cy.server();

    cy.useV1({ clientScope: 'Scope1' });
    cy.loginV1({ clientScope: 'Scope1', loginScope: 'Scope2' });

    cy.useV2({ clientScope: 'Scope1' });

    cy.get('[data-cy=profile]').should('exist');
    cy.get('[data-cy=profile]').should('not.contain', 'bar123');
  });

  it('Should migrate without setting any scopes using custom claim', function () {
    cy.server();

    cy.useV1({ foo: 'bar123' });
    cy.loginV1({});

    cy.useV2({ foo: 'bar123' });

    cy.get('[data-cy=profile]').should('exist');
    cy.get('[data-cy=profile]').should('contain', 'bar123');
  });

  it('Should migrate with setting scopes when constructing Auth0Client using custom claim', function () {
    cy.server();

    cy.useV1({ clientScope: 'Scope1', foo: 'bar123' });
    cy.loginV1({ clientScope: 'Scope1' });

    cy.useV2({ clientScope: 'Scope1' });

    cy.get('[data-cy=profile]').should('exist');
    cy.get('[data-cy=profile]').should('contain', 'bar123');
  });

  it('Should migrate with setting scopes when logging in using custom claim', function () {
    cy.server();

    cy.useV1({ foo: 'bar123' });
    cy.loginV1({ loginScope: 'Scope2' });

    cy.useV2({});

    cy.get('[data-cy=profile]').should('exist');
    cy.get('[data-cy=profile]').should('contain', 'bar123');
  });

  it('Should migrate when setting scopes when constructing Auth0Client and logging in using custom claim', function () {
    cy.server();

    cy.useV1({ clientScope: 'Scope1', foo: 'bar123' });
    cy.loginV1({ clientScope: 'Scope1', loginScope: 'Scope2' });

    cy.useV2({ clientScope: 'Scope1' });

    cy.get('[data-cy=profile]').should('exist');
    cy.get('[data-cy=profile]').should('contain', 'bar123');
  });
});
