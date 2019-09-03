## [v1.2.3](https://github.com/auth0/auth0-spa-js/tree/v1.2.3) (2019-09-02)

**Fixed**

Fix incorrect state extraction from query string https://github.com/auth0/auth0-spa-js/pull/197

## [v1.2.2](https://github.com/auth0/auth0-spa-js/tree/v1.2.2) (2019-08-28)

**Fixed**

Fix SSR errors with fetch polyfill usage https://github.com/auth0/auth0-spa-js/pull/184

## [v1.2.1](https://github.com/auth0/auth0-spa-js/tree/v1.2.1) (2019-08-27)

**Fixed**

Replace promise polyfill for a pure one. This fixes using this library with zone.js. https://github.com/auth0/auth0-spa-js/pull/180

## [v1.2.0](https://github.com/auth0/auth0-spa-js/tree/v1.2.0) (2019-08-26)

**Fixed**

- Expose raw id_token in the getIdTokenClaims method https://github.com/auth0/auth0-spa-js/pull/175
- Fix bug where oauth/token call ignores `options.audience` https://github.com/auth0/auth0-spa-js/pull/134

**Added**

- Add IE11 polyfills https://github.com/auth0/auth0-spa-js/pull/154
- Add popup timeout config https://github.com/auth0/auth0-spa-js/pull/133
- Add ?federated logout param https://github.com/auth0/auth0-spa-js/pull/129

## [v1.1.1](https://github.com/auth0/auth0-spa-js/tree/v1.1.1) (2019-07-22)

**Fixed**

- Make sure the production bundle is ES5 compatible. https://github.com/auth0/auth0-spa-js/pull/98

## [v1.1.0](https://github.com/auth0/auth0-spa-js/tree/v1.1.0) (2019-07-15)

**Changed**

- Allow redirect_uri override in loginWithRedirect - https://github.com/auth0/auth0-spa-js/pull/66
- Make options argument for popup and redirect optional - https://github.com/auth0/auth0-spa-js/pull/61
- Mark redirect_uri optional in RedirectLoginOptions - https://github.com/auth0/auth0-spa-js/pull/53

## [v1.0.2](https://github.com/auth0/auth0-spa-js/tree/v1.0.2) (2019-07-02)

**Changed**

- Add polyfill for TextEncoder - https://github.com/auth0/auth0-spa-js/pull/46

## [v1.0.1](https://github.com/auth0/auth0-spa-js/tree/v1.0.1) (2019-06-24)

**Changed**

- Reduce transaction cookie size - https://github.com/auth0/auth0-spa-js/pull/32

## [v1.0.0](https://github.com/auth0/auth0-spa-js/tree/v1.0.0) (2019-06-19)

**Initial Release**
