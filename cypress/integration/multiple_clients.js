import { whenReady, shouldInclude, tolerance, get } from '../support/utils';

const login = instanceId => {
  get(`client-login-${instanceId}`).click();
  cy.get('.login-card input[name=login]').clear().type('test');
  cy.get('.login-card input[name=password]').clear().type('test');

  cy.get('.login-submit').click();
  // Need to click one more time to give consent.
  // It is actually a different button with the same class.
  cy.get('.login-submit').click();
};

describe('using multiple clients in the app', () => {
  beforeEach(() => {
    cy.server();
    cy.visit('http://127.0.0.1:3000/multiple_clients.html');
    get('client-logout-1').click();
    cy.window().then(win => win.localStorage.clear());
    cy.visit('http://127.0.0.1:3000/multiple_clients.html');
  });

  afterEach(cy.fixCookies);

  it('can log into just one client', () => {
    whenReady();

    // Get a token for the exact client we log into and no more
    login(1);
    get('client-access-token-1').should('not.be.empty');
    get('client-access-token-2').should('be.empty');
    get('client-access-token-3').should('be.empty');

    // Logging into a second client should not work
    get('client-token-2').click();

    shouldInclude(get('client-error-2'), 'requested scopes not granted');

    // Verify check session
    cy.reload();
    whenReady();
    get('client-access-token-1').should('not.be.empty');
  });
});
