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

  cy.get('.auth0-lock-input-password .auth0-lock-input').clear().type('1234');
  cy.get('.auth0-lock-submit').click();
};

const handleCallback = () => {
  cy.get('#handle_redirect_callback').click();
  return cy.get('[data-cy=profile]');
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

Cypress.Commands.add('loginNoCallback', () => login());

Cypress.Commands.add('resetTests', () => {
  cy.server();
  cy.visit('http://localhost:3000');
  cy.get('#reset-config').click();
  cy.get('#logout').click();
  cy.window().then(win => win.localStorage.clear());
});
