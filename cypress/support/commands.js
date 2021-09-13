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

  cy.get('.login-card input[name=login]').clear().type('test');

  cy.get('.login-card input[name=password]').clear().type('test');

  cy.get('.login-submit').click();
  // Need to click one more time to give consent.
  // It is actually a different button with the same class.
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
  // When hitting the Node OIDC v2/logout, we need to confirm logout
  cy.url().then(url => {
    if (url.indexOf('/v2/logout') > -1) {
      cy.get('button[name=logout]').click();
    }
  });
});

Cypress.Commands.add('setSwitch', (name, value) => {
  // Can only use `check` or `uncheck` on an actual checkbox, but the switch
  // value we're given is for the label. Get the `for` attribute to find the actual
  // checkbox and return that instead.
  const checkbox = () =>
    cy
      .get(`[data-cy=switch-${name}]`)
      .then($label => cy.get(`#${$label.attr('for')}`));

  // These are forced because of the way the checkboxes on the playground are rendered
  // (they're covered by some UI to make them look pretty)
  !!value === true
    ? checkbox().check({ force: true })
    : checkbox().uncheck({ force: true });
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
  cy.window().then(win => win.localStorage.clear());
  cy.get('[data-cy=use-node-oidc-provider]').click();
  cy.get('#logout').click();
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
