import { decode } from 'qss';
import {
  shouldBe,
  shouldBeUndefined,
  shouldNotBeUndefined,
  whenReady,
  shouldInclude,
  tolerance
} from '../support/utils';

describe('loginWithRedirect', function () {
  beforeEach(cy.resetTests);

  it('Builds URL correctly', function () {
    whenReady();

    cy.get('#login_redirect').click();

    cy.url().should(url => {
      const parsedUrl = new URL(url);
      const pageParams = decode(parsedUrl.search.substr(1));

      shouldBe(parsedUrl.host, 'brucke.auth0.com');
      shouldBeUndefined(pageParams.code_verifier);
      shouldNotBeUndefined(pageParams.code_challenge);
      shouldNotBeUndefined(pageParams.code_challenge_method);
      shouldNotBeUndefined(pageParams.state);
      shouldNotBeUndefined(pageParams.nonce);
      shouldBe(pageParams.redirect_uri, 'http://localhost:3000');
      shouldBe(pageParams.response_mode, 'query');
      shouldBe(pageParams.response_type, 'code');
      shouldBe(pageParams.scope, 'openid profile email');
      shouldBe(pageParams.protocol, 'oauth2');
      shouldBe(pageParams.client, 'wLSIP47wM39wKdDmOj6Zb5eSEw3JVhVp');
    });
  });

  it('Appends unique scopes to the default scopes', function () {
    whenReady();

    cy.setScope('openid profile email test test test2');
    cy.get('#login_redirect').click();

    cy.url().should(url => {
      const { scope } = decode(new URL(url).search.substr(1));
      shouldBe(scope, 'openid profile email test test2');
    });
  });

  it('can perform the login flow', () => {
    whenReady().then(() => {
      cy.loginNoCallback();

      cy.url().should(url => shouldInclude(url, 'https://brucke.auth0.com'));

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
