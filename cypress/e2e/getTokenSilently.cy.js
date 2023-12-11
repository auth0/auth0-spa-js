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
  });
});
