import { shouldBe, whenReady } from '../support/utils';

describe('getTokenSilently', function() {
  beforeEach(cy.resetTests);
  afterEach(cy.logout);

  it('returns an error when not logged in', function(done) {
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
            cy.reload().wait(5000);

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

      describe('when using refresh tokens', () => {
        /**
         * This test will fail with a 'consent_required' error when running on localhost, but the fact that it does
         * proves that the iframe method was attempted even though we're supposed to be using refresh tokens.
         */
        it.skip('attempts to retrieve an access token by falling back to the iframe method', () => {
          return whenReady().then(win => {
            cy.toggleSwitch('local-storage');
            cy.toggleSwitch('use-cache');

            cy.login().then(() => {
              cy.toggleSwitch('refresh-tokens').wait(1000);
              win.localStorage.clear();

              cy.get('[data-cy=get-token]')
                .click()
                .wait(500)
                .get('[data-cy=access-token]')
                .should('have.length', 1);

              cy.get('[data-cy=error]').should('contain', 'consent_required');
            });
          });
        });
      });
    });
  });
});
