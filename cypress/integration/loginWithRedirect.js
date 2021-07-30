import { decode } from 'qss';

import {
  shouldBe,
  shouldBeUndefined,
  shouldNotBeUndefined,
  whenReady,
  shouldInclude,
  tolerance,
  configureTenant
} from '../support/utils';

describe('loginWithRedirect', function () {
  beforeEach(cy.resetTests);

  it('can perform the login flow', () => {
    whenReady().then(() => {
      configureTenant();

      cy.loginNoCallback();

      cy.url().should(url => shouldInclude(url, 'http://localhost:3000'));

      whenReady().then(win => {
        expect(win.sessionStorage.getItem('a0.spajs.txs')).to.exist;

        cy.handleRedirectCallback().then(() => {
          expect(win.sessionStorage.getItem('a0.spajs.txs')).to.not.exist;
        });
      });
    });
  });

  it('can perform the login flow with cookie transactions', () => {
    whenReady();
    configureTenant();

    cy.toggleSwitch('cookie-txns');

    const tomorrowInSeconds = Math.floor(Date.now() / 1000) + 86400;

    cy.loginNoCallback();

    cy.url().then(url => shouldInclude(url, 'https://brucke.auth0.com'));

    whenReady();

    cy.getCookie('a0.spajs.txs')
      .should('exist')
      .should(cookie => {
        // Check that the cookie value is at least within a second of what we expect, to make
        // the test a little less brittle.
        expect(tolerance(cookie.expiry, tomorrowInSeconds, 1)).to.be.true;
      });

    cy.handleRedirectCallback().then(() => {
      cy.getCookie('a0.spajs.txs').should('not.exist');
    });
  });
});
