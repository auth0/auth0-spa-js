import { whenReady } from '../support/utils';

describe('getTokenSilently', () => {
  beforeEach(cy.resetTests);
  afterEach(cy.fixCookies);

  it('returns an error when not logged in', () => {
    whenReady();

    cy.getTokenSilently();

    cy.getError().should('exist');
    cy.getError().should('contain', 'End-User authentication is required');
  });

  it('can use form post data to call the token endpoint', () => {
    cy.intercept({
      method: 'POST',
      url: '**/oauth/token'
    }).as('tokenApiCheck');

    whenReady();

    cy.login();
    cy.getTokenSilently();
    cy.getAccessTokens().should('have.length', 2); // 1 from handleRedirectCallback, 1 from clicking "Get access token"
    cy.getError().should('not.exist');

    cy.wait('@tokenApiCheck').should(xhr => {
      assert.equal(
        xhr.request.headers['content-type'],
        'application/x-www-form-urlencoded'
      );
    });
  });

  describe('when using an iframe', () => {
    describe('using an in-memory store', () => {
      it('gets a new access token', () => {
        whenReady();

        cy.login();
        cy.getTokenSilently();

        cy.getAccessTokens().should('have.length', 2); // 1 from handleRedirectCallback, 1 from clicking "Get access token"
        cy.getError().should('not.exist');
      });

      it('can get the access token after refreshing the page', () => {
        whenReady();

        cy.login();
        cy.reload();
        cy.getTokenSilently();

        cy.getAccessTokens().should('have.length', 1);
        cy.getError().should('not.exist');
      });
    });

    describe('using local storage', () => {
      it('can get the access token after refreshing the page', () => {
        whenReady();

        cy.setSwitch('local-storage', true);
        cy.login();
        cy.reload();
        cy.getTokenSilently();
        cy.getAccessTokens().should('have.length', 1);

        cy.window().then(win => {
          expect(
            win.localStorage.getItem(
              '@@auth0spajs@@::testing::default::openid profile email'
            )
          ).to.not.be.null;
        });

        cy.getError().should('not.exist');
      });
    });
  });

  const formDataToObject = formData => {
    const queryParams = new URLSearchParams(formData);
    const parsedQuery = {};

    queryParams.forEach((val, key) => {
      parsedQuery[key] = val;
    });

    return parsedQuery;
  };

  describe('when using refresh tokens', () => {
    it('retrieves an access token using a refresh token', () => {
      whenReady();

      cy.setSwitch('local-storage', true);
      cy.setSwitch('use-cache', false);
      cy.setSwitch('refresh-tokens', true);

      cy.login();

      cy.intercept({
        method: 'POST',
        url: '**/oauth/token'
      }).as('tokenApiCheck');

      cy.getAccessTokens().should('have.length', 1);
      cy.getTokenSilently();
      cy.getAccessTokens().should('have.length', 2);

      cy.wait('@tokenApiCheck').should(xhr => {
        assert.equal(
          formDataToObject(xhr.request.body).grant_type,
          'refresh_token',
          'used a refresh_token to get an access_token'
        );
      });
    });

    it('retrieves an access token for another audience using a refresh token', () => {
      whenReady();

      cy.setSwitch('local-storage', true);
      cy.setSwitch('use-cache', false);
      cy.setSwitch('refresh-tokens', true);
      cy.setSwitch('refresh-token-fallback', true);

      cy.login();

      cy.intercept({
        method: 'POST',
        url: '**/oauth/token'
      }).as('tokenApiCheck');

      cy.getTokenSilently();
      cy.getAccessTokens().should('have.length', 2);

      cy.wait('@tokenApiCheck').should(xhr => {
        assert.equal(
          formDataToObject(xhr.request.body).grant_type,
          'refresh_token',
          'used a refresh_token to get an access_token'
        );
      });

      cy.getTokenSilently(1);
      cy.getAccessTokens(1).should('have.length', 1);

      cy.wait('@tokenApiCheck').should(xhr => {
        assert.equal(
          formDataToObject(xhr.request.body).grant_type,
          'authorization_code',
          'get a refresh_token for a new audience with an iframe'
        );
      });

      cy.getTokenSilently(1);
      cy.getAccessTokens(1).should('have.length', 2);

      cy.wait('@tokenApiCheck').should(xhr => {
        assert.equal(
          formDataToObject(xhr.request.body).grant_type,
          'refresh_token',
          'use a refresh_token to get a new access_token'
        );
      });
    });

    describe('with workerUrl', () => {
      const workerUrl = 'auth0-spa-js.worker.development.js';

      it('loads the hosted worker file', () => {
        whenReady();

        cy.intercept({
          method: 'GET',
          url: workerUrl
        }).as('workerLoaded');

        cy.setSwitch('refresh-tokens', true);
        cy.setSwitch('use-worker-url', true);

        cy.wait('@workerLoaded').its('response.statusCode').should('eq', 200);
      });

      it('retrieves tokens using the hosted worker file', () => {
        whenReady();

        cy.setSwitch('refresh-tokens', true);
        cy.setSwitch('use-worker-url', true);
        cy.setSwitch('use-cache', false);

        cy.intercept({
          method: 'POST',
          url: '**/oauth/token'
        }).as('tokenApiCheck');

        cy.login();
        cy.getAccessTokens().should('have.length', 1);

        cy.wait('@tokenApiCheck')
          .its('request')
          .then(request => {
            cy.wrap(request)
              .its('headers.referer')
              .should('contain', workerUrl);
            cy.wrap(request)
              .its('body')
              .should('contain', 'grant_type=authorization_code');
          });

        cy.getTokenSilently();
        cy.getAccessTokens().should('have.length', 2);

        cy.wait('@tokenApiCheck')
          .its('request')
          .then(request => {
            cy.wrap(request)
              .its('headers.referer')
              .should('contain', workerUrl);
            cy.wrap(request)
              .its('body')
              .should('contain', 'grant_type=refresh_token');
          });
      });
    });
  });

  describe('when using multi-resource refresh tokens', () => {
    it('retrieves an access token using a refresh token', () => {
      whenReady();

      cy.setSwitch('local-storage', true);
      cy.setSwitch('use-cache', false);
      cy.setSwitch('multi-resource-refresh-tokens', true);

      cy.login();

      cy.intercept({
        method: 'POST',
        url: '**/oauth/token'
      }).as('tokenApiCheck');

      cy.getAccessTokens().should('have.length', 1);
      cy.getTokenSilently();
      cy.getAccessTokens().should('have.length', 2);

      cy.wait('@tokenApiCheck').should(xhr => {
        assert.equal(
          formDataToObject(xhr.request.body).grant_type,
          'refresh_token',
          'used a refresh_token to get an access_token'
        );
      });
    });

    function testRequestingMultipleTokens() {
      cy.login();

      cy.intercept({
        method: 'POST',
        url: '**/oauth/token'
      }).as('tokenApiCheck');

      cy.getTokenSilently();
      cy.getAccessTokens().should('have.length', 2);

      cy.wait('@tokenApiCheck').should(xhr => {
        const body = formDataToObject(xhr.request.body);
        assert.equal(
          body.grant_type,
          'refresh_token',
          'used a refresh_token to get an access_token'
        );
        assert.equal(
          body.audience,
          undefined,
          'did not specify an audience for default access_token'
        );
      });

      cy.getTokenSilently(1);
      cy.getAccessTokens(1).should('have.length', 1);

      let expectedAudience, expectedScope;
      cy.getAudience(1).then(e => (expectedAudience = e.text()));
      cy.getScope(1).then(e => (expectedScope = e.val()));

      cy.wait('@tokenApiCheck').should(xhr => {
        const body = formDataToObject(xhr.request.body);
        assert.equal(
          body.grant_type,
          'refresh_token',
          'used a refresh_token to get an access_token for second API'
        );
        assert.equal(
          body.audience,
          expectedAudience,
          'used the audience for the second API'
        );
        assert.match(
          body.scope,
          new RegExp(`(^| )${expectedScope}( |$)`),
          'used the scope for the second API'
        );
      });
    }

    it('retrieves access tokens for multiple audiences using a refresh token', () => {
      whenReady();

      cy.setSwitch('local-storage', true);
      cy.setSwitch('use-cache', false);
      cy.setSwitch('multi-resource-refresh-tokens', true);

      testRequestingMultipleTokens();
    });

    describe('with workerUrl', () => {
      const workerUrl = 'auth0-spa-js.worker.development.js';

      it('loads the hosted worker file', () => {
        whenReady();

        cy.intercept({
          method: 'GET',
          url: workerUrl
        }).as('workerLoaded');

        cy.setSwitch('multi-resource-refresh-tokens', true);
        cy.setSwitch('use-worker-url', true);

        cy.wait('@workerLoaded').its('response.statusCode').should('eq', 200);
      });

      it('retrieves access tokens for multiple audiences using the hosted worker file', () => {
        whenReady();

        cy.setSwitch('multi-resource-refresh-tokens', true);
        cy.setSwitch('use-worker-url', true);
        cy.setSwitch('use-cache', false);

        testRequestingMultipleTokens();
      });
    });
  });
});
