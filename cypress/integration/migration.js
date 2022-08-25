describe('migration', function () {
  //beforeEach(cy.resetTests);
  //afterEach(cy.fixCookies);

  it('runs scenario 1 (without foo)', function () {
    cy.server();

    runScenarioWithoutFoo({});
  });

  it('runs scenario 2 (without foo)', function () {
    cy.server();
    runScenarioWithoutFoo({ clientScope: 'Scope1' });
  });

  it('runs scenario 3 (without foo)', function () {
    cy.server();

    runScenarioWithoutFoo({ loginScope: 'Scope2' });
  });

  it('runs scenario 4 (without foo)', function () {
    cy.server();

    runScenarioWithoutFoo({ clientScope: 'Scope1', loginScope: 'Scope2' });
  });

  it('runs scenario 1 (with foo)', function () {
    cy.server();

    runScenarioWithFoo({ foo: 'bar123' });
  });

  it('runs scenario 2 (with foo)', function () {
    cy.server();
    runScenarioWithFoo({ clientScope: 'Scope1', foo: 'bar123' });
  });

  it('runs scenario 3 (with foo)', function () {
    cy.server();

    runScenarioWithFoo({ loginScope: 'Scope2', foo: 'bar123' });
  });

  it('runs scenario 4 (with foo)', function () {
    cy.server();

    runScenarioWithFoo({
      clientScope: 'Scope1',
      loginScope: 'Scope2',
      foo: 'bar123'
    });
  });

  it('runs scenario 5 (without foo)', function () {
    cy.server();

    runScenarioWithoutFoo({
      clientScope: 'Scope1 Scope2',
      loginScope: 'Scope3'
    });

    // go to v2
    cy.visit('http://localhost:3000/v2.html');

    // create client
    cy.get('[data-cy=client-scope]').clear().type('Scope1 Scope2');
    cy.get('[data-cy=create-client]').click();

    cy.get('[data-cy=get-token-scope]').clear().type('Scope1 Scope2');
    cy.get('[data-cy=get-token]').click();
    cy.get('[data-cy=profile]').should('not.contain', 'bar123');

    // go to v2
    cy.visit('http://localhost:3000/v2.html');

    // create client
    cy.get('[data-cy=client-scope]').clear().type('Scope1 Scope2');
    cy.get('[data-cy=foo]').clear().type('bar123');
    cy.get('[data-cy=create-client]').click();

    cy.get('[data-cy=profile]').should('not.contain', 'bar123');

    cy.get('[data-cy=get-token-scope]').clear().type('Scope1 Scope2');
    cy.get('[data-cy=get-token]').click();
    cy.get('[data-cy=profile]').should('contain', 'bar123');
  });

  function runScenarioWithoutFoo({ clientScope, loginScope }) {
    cy.visit('http://localhost:3000/v1.html');

    // create client
    clientScope && cy.get('[data-cy=client-scope]').clear().type(clientScope);
    cy.get('[data-cy=create-client]').click();

    // logout
    cy.get('[data-cy=logout]').click();

    // login
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

    // go to v2
    cy.visit('http://localhost:3000/v2.html');

    // create client
    clientScope && cy.get('[data-cy=client-scope]').clear().type(clientScope);
    cy.get('[data-cy=foo]').clear().type('bar123');
    cy.get('[data-cy=create-client]').click();

    // expect user to show up
    cy.get('[data-cy=profile]').should('exist');
    cy.get('[data-cy=profile]').should('not.contain', 'bar123');

    cy.get('[data-cy=get-token]').click();
    cy.get('[data-cy=profile]').should('contain', 'bar123');
  }

  function runScenarioWithFoo({ clientScope, loginScope, foo }) {
    cy.visit('http://localhost:3000/v1.html');

    // create client
    clientScope && cy.get('[data-cy=client-scope]').clear().type(clientScope);
    foo && cy.get('[data-cy=foo]').clear().type(foo);
    cy.get('[data-cy=create-client]').click();

    // logout
    cy.get('[data-cy=logout]').click();

    // login
    // set login scope
    loginScope && cy.get('[data-cy=login-scope]').clear().type(loginScope);
    cy.get('[data-cy=login]').click();

    // create client
    cy.get('[data-cy=create-client]').click();

    // handle callback
    cy.get('[data-cy=handle-redirect-callback]').click();

    // expect user to show up
    cy.get('[data-cy=profile]').should('exist');

    // go to v2
    cy.visit('http://localhost:3000/v2.html');

    // create client
    foo && cy.get('[data-cy=foo]').clear().type(foo);
    cy.get('[data-cy=create-client]').click();

    // expect user to show up
    cy.get('[data-cy=profile]').should('exist');
    foo && cy.get('[data-cy=profile]').should('contain', foo);
  }
});
