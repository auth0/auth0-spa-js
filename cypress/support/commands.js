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

  cy.get('.login-card input[name=login]').clear().type('asd@asd.asd');

  cy.get('.login-card input[name=password]')
    .clear()
    .type(Cypress.env('INTEGRATION_PASSWORD'));

  cy.get('.login-submit').click();
  cy.get('.login-submit').click();
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

Cypress.Commands.add('logout', () => {
  cy.get('[data-cy=logout]').click();
  cy.url().then(url => {
    console.log(url);
    if (url.indexOf('v2/logout') > -1) {
      cy.get('[name=logout]').click();
    }
  });
});

Cypress.Commands.add('toggleSwitch', name =>
  cy.get(`[data-cy=switch-${name}]`).click()
);

Cypress.Commands.add('setSwitch', (name, value) => {
  if (value) {
    cy.get(`#${name}-switch`).check({ force: true });
  } else {
    cy.get(`#${name}-switch`).uncheck({ force: true });
  }
});

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
  cy.visit('http://127.0.0.1:3000');
  cy.get('#reset-config').click();
  cy.get('#logout').click();
  cy.window().then(win => win.localStorage.clear());
  cy.get('[data-cy=use-node-oidc-provider]').click();
});

Cypress.Commands.add('fixCookies', () => {
  // Temporary fix for https://github.com/cypress-io/cypress/issues/6375
  if (Cypress.isBrowser('firefox')) {
    cy.getCookies({ log: false }).then(cookies =>
      cookies.forEach(cookie => cy.clearCookie(cookie.name, { log: false }))
    );
    cy.log('clearCookies');
  } else {
    cy.clearCookies();
  }
});
