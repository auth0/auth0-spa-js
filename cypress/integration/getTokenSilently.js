import { decode } from 'qss';
import {
  shouldBe,
  shouldNotBe,
  shouldBeUndefined,
  shouldNotBeUndefined,
  whenReady
} from '../support/utils';

describe('getTokenSilently', function() {
  beforeEach(cy.resetTests);

  it('return error when not logged in', function(done) {
    whenReady().then(win =>
      win.auth0.getTokenSilently().catch(error => {
        shouldBe('login_required', error.error);
        done();
      })
    );
  });

  it.skip('Builds URL correctly', function(done) {
    cy.login().then(() => {
      whenReady().then(win => {
        var iframe = win.document.createElement('iframe');
        cy.stub(win.document, 'createElement', type =>
          type === 'iframe' ? iframe : window.document.createElement
        );
        return win.auth0.getTokenSilently().then(() => {
          const parsedUrl = new URL(iframe.src);
          shouldBe(parsedUrl.host, 'auth.brucke.club');
          const pageParams = decode(parsedUrl.search.substr(1));
          shouldBeUndefined(pageParams.code_verifier);
          shouldNotBeUndefined(pageParams.code_challenge);
          shouldNotBeUndefined(pageParams.code_challenge_method);
          shouldNotBeUndefined(pageParams.state);
          shouldNotBeUndefined(pageParams.nonce);
          shouldBe(pageParams.redirect_uri, win.location.origin);
          shouldBe(pageParams.response_mode, 'web_message');
          shouldBe(pageParams.response_type, 'code');
          shouldBe(pageParams.scope, 'openid profile email');
          shouldBe(pageParams.client_id, 'wLSIP47wM39wKdDmOj6Zb5eSEw3JVhVp');
          done();
        });
      });
    });
  });

  it('return cached token after login', function(done) {
    cy.login().then(() => {
      whenReady().then(win =>
        win.auth0.getTokenSilently().then(token => {
          shouldNotBeUndefined(token);
          win.auth0.getTokenSilently().then(token2 => {
            shouldNotBeUndefined(token2);
            shouldBe(token, token2);
            done();
          });
        })
      );
    });
  });

  it('ignores cache if `ignoreCache:true`', function(done) {
    cy.login().then(() => {
      whenReady().then(win =>
        win.auth0.getTokenSilently().then(token => {
          shouldNotBeUndefined(token);
          win.auth0.getTokenSilently({ ignoreCache: true }).then(token2 => {
            shouldNotBeUndefined(token2);
            shouldNotBe(token, token2);
            done();
          });
        })
      );
    });
  });

  it('returns consent_required when using an audience without consent', function(done) {
    cy.login().then(() => {
      whenReady().then(win =>
        win.auth0
          .getTokenSilently({ audience: 'https://brucke.auth0.com/api/v2/' })
          .catch(error => {
            shouldBe('consent_required', error.error);
            done();
          })
      );
    });
  });
});
