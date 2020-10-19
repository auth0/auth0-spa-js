import { decode } from 'qss';
import {
  shouldBe,
  shouldBeUndefined,
  shouldNotBeUndefined,
  whenReady,
  shouldInclude
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

  it('can perform the login flow', () => {
    whenReady().then(win => {
      cy.loginNoCallback();

      cy.url().then(url => shouldInclude(url, 'https://brucke.auth0.com'));

      cy.get('#loaded').then(() => {
        expect(win.sessionStorage.getItem('a0.spajs.txs')).to.exist;

        cy.handleRedirectCallback().then(() => {
          expect(win.sessionStorage.getItem('a0.spajs.txs')).to.not.exist;
        });
      });
    });
  });

  it('can perform the login flow with cookie transactions', () => {
    whenReady().then(win => {
      cy.toggleSwitch('cookie-txns');
      cy.loginNoCallback();

      cy.url().then(url => shouldInclude(url, 'https://brucke.auth0.com'));

      cy.get('#loaded').then(() => {
        cy.getCookie('a0.spajs.txs').should('exist');

        cy.handleRedirectCallback().then(() => {
          cy.getCookie('a0.spajs.txs').should('not.exist');
        });
      });
    });
  });
});
