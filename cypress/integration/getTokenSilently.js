import { shouldBe, whenReady } from '../support/utils';

describe('getTokenSilently', function () {
  beforeEach(cy.resetTests);
  afterEach(cy.logout);

  it('returns an error when not logged in', function (done) {
    whenReady().then(win =>
      win.auth0.getTokenSilently().catch(error => {
        shouldBe('login_required', error.error);
        done();
      })
    );
  });

  describe('when using an iframe', () => {
    describe('using an in-memory store', () => {
      it('gets a new access token', () => {
        return whenReady().then(win => {
          cy.login().then(() => {
            cy.get('[data-cy=get-token]').click();
            cy.get('[data-cy=access-token]').should('have.length', 2); // 1 from handleRedirectCallback, 1 from clicking "Get access token"
            cy.get('[data-cy=error]').should('not.exist');
          });
        });
      });

      it('can get the access token after refreshing the page', () => {
        return whenReady().then(win => {
          cy.login().then(() => {
            cy.reload();

            cy.get('[data-cy=get-token]')
              .click()
              .wait(500)
              .get('[data-cy=access-token]')
              .should('have.length', 1);

            cy.get('[data-cy=error]').should('not.exist');
          });
        });
      });
    });

    describe('using local storage', () => {
      it('can get the access token after refreshing the page', () => {
        return whenReady().then(win => {
          cy.toggleSwitch('local-storage');

          cy.login().then(() => {
            cy.reload();
            cy.get('#loaded', { timeout: 5000 });

            cy.get('[data-cy=get-token]')
              .click()
              .wait(500)
              .get('[data-cy=access-token]')
              .should('have.length', 1)
              .then(() => {
                expect(
                  win.localStorage.getItem(
                    '@@auth0spajs@@::wLSIP47wM39wKdDmOj6Zb5eSEw3JVhVp::default::openid profile email'
                  )
                ).to.not.be.null;
              });

            cy.get('[data-cy=error]').should('not.exist');
          });
        });
      });
    });
  });

  describe('when using refresh tokens', () => {
    it('retrieves an access token using a refresh token', () => {
      return whenReady().then(win => {
        cy.toggleSwitch('local-storage');
        cy.toggleSwitch('use-cache');
        cy.toggleSwitch('refresh-tokens');

        cy.login().then(() => {
          cy.route({
            method: 'POST',
            url: '**/oauth/token'
          }).as('tokenApiCheck');

          cy.get('[data-cy=get-token]')
            .should('have.length', 1)
            .click()
            .wait(500)
            .get('[data-cy=access-token]')
            .should('have.length', 2);

          cy.wait('@tokenApiCheck').then(xhr => {
            assert.equal(
              xhr.request.body.grant_type,
              'refresh_token',
              'used a refresh_token to get an access_token'
            );
          });
        });
      });
    });

    it('retrieves an access token for another audience using a refresh token', () => {
      return whenReady().then(win => {
        cy.toggleSwitch('local-storage');
        cy.toggleSwitch('use-cache');
        cy.toggleSwitch('refresh-tokens');

        cy.login().then(() => {
          cy.route({
            method: 'POST',
            url: '**/oauth/token'
          }).as('tokenApiCheck');

          cy.get('[data-cy=get-token]')
            .click()
            .wait(500)
            .get('[data-cy=access-token]')
            .should('have.length', 2);

          cy.wait('@tokenApiCheck').then(xhr => {
            console.log(xhr);
            assert.equal(
              xhr.request.body.grant_type,
              'refresh_token',
              'used a refresh_token to get an access_token'
            );
          });

          cy.get('[data-cy=get-token-1]')
            .click()
            .wait(500)
            .get('[data-cy=access-token-1]')
            .should('have.length', 1);

          cy.wait('@tokenApiCheck').then(xhr => {
            console.log(xhr);
            assert.equal(
              xhr.request.body.grant_type,
              'authorization_code',
              'get a refresh_token for a new audience with an iframe'
            );
          });

          cy.get('[data-cy=get-token-1]')
            .click()
            .wait(500)
            .get('[data-cy=access-token-1]')
            .should('have.length', 2);

          cy.wait('@tokenApiCheck').then(xhr => {
            console.log(xhr);
            assert.equal(
              xhr.request.body.grant_type,
              'refresh_token',
              'use a refresh_token to get a new access_token'
            );
          });
        });
      });
    });
  });
});
