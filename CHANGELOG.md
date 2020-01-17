## [v1.6.2](https://github.com/auth0/auth0-spa-js/tree/v1.6.2) (2020-01-13)

**Removed**

Removed future issued-at claim check [stevehobbsdev](https://github.com/stevehobbsdev) - https://github.com/auth0/auth0-spa-js/pull/329

## [v1.6.1](https://github.com/auth0/auth0-spa-js/tree/v1.6.1) (2020-01-07)

**Fixed**

Included core-js polyfill for `String.includes` to fix an issue with browser-tabs-lock in IE11 [stevehobbsdev](https://github.com/stevehobbsdev) - https://github.com/auth0/auth0-spa-js/pull/325
Added import definition to Getting Started section in the Readme for clarity [thundermiracle](https://github.com/thundermiracle) - https://github.com/auth0/auth0-spa-js/pull/294

## [v1.6.0](https://github.com/auth0/auth0-spa-js/tree/v1.6.0) (2019-11-19)

**Added**
Added buildAuthorizeUrl and url parameter to handleRedirectCallback - [austin43](https://github.com/austin43) - https://github.com/auth0/auth0-spa-js/pull/280

**Fixed**
Released browser lock on getTokenSilently error - https://github.com/auth0/auth0-spa-js/pull/276
Updates browser-tabs-lock to fix issue of long acquired lock - [super-tokens](https://github.com/super-tokens) - https://github.com/auth0/auth0-spa-js/commit/3413e30bdb5955c818989cdc050079fa6efb6050

## [v1.5.0](https://github.com/auth0/auth0-spa-js/tree/v1.5.0) (2019-10-31)

**Added**
Add a new property 'fragment' to be appended to the authorize URL on redirect - https://github.com/auth0/auth0-spa-js/pull/249

## [v1.4.2](https://github.com/auth0/auth0-spa-js/tree/v1.4.2) (2019-10-30)

**Fixed**
Update typescript definition for max_age param - https://github.com/auth0/auth0-spa-js/pull/260
Fix for typings files in packaged SDK - https://github.com/auth0/auth0-spa-js/pull/263

## [v1.4.1](https://github.com/auth0/auth0-spa-js/tree/v1.4.1) (2019-10-30)

**Fixed**
Updated types path in package.json https://github.com/auth0/auth0-spa-js/pull/261

## [v1.4.0](https://github.com/auth0/auth0-spa-js/tree/v1.4.0) (2019-10-30)

**Added**
Add 'lock' to prevent `getTokenSilently` to be invoked in parallel https://github.com/auth0/auth0-spa-js/pull/238
Improved OIDC compliance https://github.com/auth0/auth0-spa-js/pull/248

**Fixed**
Fix for race condition when using `sha256` on IE11 https://github.com/auth0/auth0-spa-js/pull/252
Fixed the codeowners file with the correct group https://github.com/auth0/auth0-spa-js/pull/253
Document leeway default value https://github.com/auth0/auth0-spa-js/pull/256
Clear transaction data on error https://github.com/auth0/auth0-spa-js/pull/254

## [v1.3.2](https://github.com/auth0/auth0-spa-js/tree/v1.3.2) (2019-10-17)

**Fixed**
`parseQueryString` now removes hash fragment on query before parsing https://github.com/auth0/auth0-spa-js/pull/246

## [v1.3.1](https://github.com/auth0/auth0-spa-js/tree/v1.3.1) (2019-10-14)

**Fixed**
Fix IE msCrypto.subtle usage https://github.com/auth0/auth0-spa-js/pull/242

## [v1.3.0](https://github.com/auth0/auth0-spa-js/tree/v1.3.0) (2019-10-10)

**Fixed**
Add missing char for nonce/state generation https://github.com/auth0/auth0-spa-js/pull/230
Fix query parsing when using hash routing https://github.com/auth0/auth0-spa-js/pull/231
Fix safari10 initialization error https://github.com/auth0/auth0-spa-js/pull/232

**Changed**
Add early expiration of Access Token in cache https://github.com/auth0/auth0-spa-js/pull/233

## [v1.2.4](https://github.com/auth0/auth0-spa-js/tree/v1.2.4) (2019-09-24)

**Fixed**

Fix empty PKCE code challenge https://github.com/auth0/auth0-spa-js/pull/221

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
