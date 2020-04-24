import { decode } from 'qss';
import {
  shouldBe,
  shouldBeUndefined,
  shouldNotBeUndefined,
  whenReady
} from '../support/utils';

describe('loginWithRedirect', function () {
  beforeEach(cy.resetTests);

  it('Builds URL correctly', function () {
    whenReady().then(win => {
      return win.auth0.loginWithRedirect({
        redirect_uri: 'http://localhost:3000/'
      });
    });

    cy.wait(2000);

    cy.url().then(url => {
      const parsedUrl = new URL(url);
      shouldBe(parsedUrl.host, 'brucke.auth0.com');
      const pageParams = decode(parsedUrl.search.substr(1));
      shouldBeUndefined(pageParams.code_verifier);
      shouldNotBeUndefined(pageParams.code_challenge);
      shouldNotBeUndefined(pageParams.code_challenge_method);
      shouldNotBeUndefined(pageParams.state);
      shouldNotBeUndefined(pageParams.nonce);
      shouldBe(pageParams.redirect_uri, 'http://localhost:3000/');
      shouldBe(pageParams.response_mode, 'query');
      shouldBe(pageParams.response_type, 'code');
      shouldBe(pageParams.scope, 'openid profile email');
      shouldBe(pageParams.protocol, 'oauth2');
      shouldBe(pageParams.client, 'wLSIP47wM39wKdDmOj6Zb5eSEw3JVhVp');
    });
  });

  it('Appends unique scopes to the default scopes', function () {
    whenReady().then(win => {
      return win.auth0.loginWithRedirect({
        redirect_uri: 'http://localhost:3000/',
        scope: 'openid profile email test test test2'
      });
    });
    cy.wait(2000);
    cy.url().then(url => {
      const pageParams = decode(new URL(url).search.substr(1));
      shouldBe(pageParams.scope, 'openid profile email test test2');
    });
  });

  it('clears transaction cookies after login', () => {
    whenReady().then(() => {
      cy.login({ skipCallback: true }).then(() => {
        // Make sure the cookie is there
        cy.getCookies().then(cookies => {
          const transactionCookies = cookies
            .map(c => c.name)
            .filter(c => c.indexOf('a0.spajs.txs.') === 0);

          shouldBe(transactionCookies.length, 1);
        });

        // Handle the redirect and check the cookie
        cy.handleRedirectCallback();

        cy.getCookies().then(cookies => {
          const transactionCookies = cookies
            .map(c => c.name)
            .filter(c => c.indexOf('a0.spajs.txs.') === 0);

          shouldBe(transactionCookies.length, 0);
        });
      });
    });
  });

  it('clears all transaction cookies when the advanced feature is toggled on', () => {
    whenReady().then(() => {
      cy.login({ skipCallback: true }).then(() => {
        cy.loginAuthenticated({ skipCallback: true }).then(() => {
          cy.getCookies().then(cookies => {
            const transactionCookies = cookies
              .map(c => c.name)
              .filter(c => c.indexOf('a0.spajs.txs.') === 0);

            shouldBe(transactionCookies.length, 2);
          });

          cy.toggleSwitch('clear-transaction');

          cy.loginAuthenticated({ skipCallback: true }).then(() => {
            cy.getCookies().then(cookies => {
              const transactionCookies = cookies
                .map(c => c.name)
                .filter(c => c.indexOf('a0.spajs.txs.') === 0);

              shouldBe(transactionCookies.length, 1);
            });
          });
        });
      });
    });
  });
});
