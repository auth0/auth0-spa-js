import { whenReady } from './utils';

// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --

const login = () => {
  cy.get('#login_redirect').click();

  cy.get('.auth0-lock-input-username .auth0-lock-input')
    .clear()
    .type('johnfoo+integration@gmail.com');

  cy.get('.auth0-lock-input-password .auth0-lock-input')
    .clear()
    .type(Cypress.env('INTEGRATION_PASSWORD'));
  cy.get('.auth0-lock-submit').click();
};

const handleCallback = () => {
  return cy
    .get('[data-cy=handle-redirect-callback]')
    .click()
    .get('[data-cy=profile]');
};

Cypress.Commands.add('login', () => {
  login();

  return whenReady().then(() => handleCallback());
});

Cypress.Commands.add('handleRedirectCallback', () => handleCallback());

Cypress.Commands.add('logout', () => cy.get('[data-cy=logout]').click());

Cypress.Commands.add('toggleSwitch', name =>
  cy.get(`[data-cy=switch-${name}]`).click()
);

Cypress.Commands.add('setScope', scope =>
  cy.get(`[data-cy=scope]`).clear().type(scope)
);

Cypress.Commands.add('isAuthenticated', () =>
  cy.get(`[data-cy=authenticated]`)
);

Cypress.Commands.add('getUser', () => cy.get('[data-cy=profile]'));

Cypress.Commands.add('getError', () => cy.get(`[data-cy=error]`));

Cypress.Commands.add('getAccessTokens', index =>
  cy.get(index ? `[data-cy=access-token-${index}]` : '[data-cy=access-token]')
);

Cypress.Commands.add('getTokenSilently', index =>
  cy.get(index ? `[data-cy=get-token-${index}]` : `[data-cy=get-token]`).click()
);

Cypress.Commands.add('loginNoCallback', () => {
  login();

  return whenReady();
});

Cypress.Commands.add('resetTests', () => {
  cy.server();
  cy.visit('http://localhost:3000');
  cy.get('#reset-config').click();
  cy.get('#logout').click();
  cy.window().then(win => win.localStorage.clear());
});
