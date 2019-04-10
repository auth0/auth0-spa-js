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
Cypress.Commands.add('login', () => {
  cy.get('#login_redirect').click();

  cy.get('.auth0-lock-input-username .auth0-lock-input')
    .clear()
    .type('johnfoo+integration@gmail.com');
  cy.get('.auth0-lock-input-password .auth0-lock-input')
    .clear()
    .type('1234');
  cy.get('.auth0-lock-submit').click();
  return whenReady().then(win => win.auth0.handleRedirectCallback());
});

Cypress.Commands.add('loginNoCallback', () => {
  cy.get('#login_redirect').click();

  cy.get('.auth0-lock-input-username .auth0-lock-input')
    .clear()
    .type('johnfoo+integration@gmail.com');
  cy.get('.auth0-lock-input-password .auth0-lock-input')
    .clear()
    .type('1234');
  cy.get('.auth0-lock-submit').click();
});

Cypress.Commands.add('resetTests', () => {
  cy.visit('http://localhost:3000');
  cy.get('#logout').click();
});
