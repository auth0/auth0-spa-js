# Change Log

## [v1.4.1](https://github.com/auth0/idtoken-verifier/tree/v1.4.1) (2019-07-09)

[Full Changelog](https://github.com/auth0/idtoken-verifier/compare/v1.4.0...v1.4.1)

**Fixed**

- Use unfetch without requiring window at load time [\#42](https://github.com/auth0/idtoken-verifier/pull/42) ([luisrudge](https://github.com/luisrudge))

## [v1.4.0](https://github.com/auth0/idtoken-verifier/tree/v1.4.0) (2019-06-18)

[Full Changelog](https://github.com/auth0/idtoken-verifier/compare/v1.3.0...v1.4.0)

**Fixed**

- Validate claims after verifying the signature of the token [\#39](https://github.com/auth0/idtoken-verifier/pull/39) ([luisrudge](https://github.com/luisrudge))

## [v1.3.0](https://github.com/auth0/idtoken-verifier/tree/v1.3.0) (2019-06-05)

[Full Changelog](https://github.com/auth0/idtoken-verifier/compare/v1.2.0...v1.3.0)

**Changed**

- Increase leeway limit to 300s [\#31](https://github.com/auth0/idtoken-verifier/pull/31) ([luisrudge](https://github.com/luisrudge))
- Replace superagent with unfetch [\#27](https://github.com/auth0/idtoken-verifier/pull/27) ([luisrudge](https://github.com/luisrudge))

## [v1.2.0](https://github.com/auth0/idtoken-verifier/tree/v1.2.0) (2018-03-21)

[Full Changelog](https://github.com/auth0/idtoken-verifier/compare/v1.1.2...v1.2.0)

**Added**

- Add option to set the endpoint to fetch the jwks.json file [\#19](https://github.com/auth0/idtoken-verifier/pull/19) ([luisrudge](https://github.com/luisrudge))
- Adding access_token validation method `validateAccessToken` [\#17](https://github.com/auth0/idtoken-verifier/pull/17) ([luisrudge](https://github.com/luisrudge))

## [v1.1.2](https://github.com/auth0/idtoken-verifier/tree/v1.1.2) (2018-03-01)

[Full Changelog](https://github.com/auth0/idtoken-verifier/compare/v1.1.1...v1.1.2)

**Fixed**

- Fixing issue with IdTokenVerifier.getRsaVerifier [\#14](https://github.com/auth0/idtoken-verifier/pull/14) ([dfung](https://github.com/dfung))

- Use base64-js methods instead of browser globals atob and btoa [\#15](https://github.com/auth0/idtoken-verifier/pull/15) ([maxbeatty](https://github.com/maxbeatty))

## [v1.1.1](https://github.com/auth0/idtoken-verifier/tree/v1.1.1) (2018-01-15)

[Full Changelog](https://github.com/auth0/idtoken-verifier/compare/v1.1.0...v1.1.1)

**Changed**

- Upgrade superagent version [\#10](https://github.com/auth0/idtoken-verifier/pull/10) ([luisrudge](https://github.com/luisrudge))

## [v1.1.0](https://github.com/auth0/idtoken-verifier/tree/v1.1.0) (2017-06-15)

[Full Changelog](https://github.com/auth0/idtoken-verifier/compare/v1.0.2...v1.1.0)

**Changed**

- Replace iat check with nbf check. [\#7](https://github.com/auth0/idtoken-verifier/pull/7) ([nicosabena](https://github.com/nicosabena))

## [v1.0.2](https://github.com/auth0/auth0.js/tree/v1.0.2) (2017-05-08)

[Full Changelog](https://github.com/auth0/auth0.js/compare/v1.0.1...v1.0.2)

**Fixed**

- FIX decode base64 string with special characters. [\#6](https://github.com/auth0/idtoken-verifier/pull/6) ([dctoon](https://github.com/dctoon))

## [v1.0.1](https://github.com/auth0/auth0.js/tree/v1.0.1) (2017-05-08)

[Full Changelog](https://github.com/auth0/auth0.js/compare/v1.0.0...v1.0.1)

**Fixed**

- Handle JSON.parse errors during decode [\#3](https://github.com/auth0/idtoken-verifier/pull/3) ([rolodato](https://github.com/rolodato))

## [v1.0.0](https://github.com/auth0/idtoken-verifier/tree/v1.0.0) (2016-12-30)

[Full Changelog](https://github.com/auth0/idtoken-verifier/tree/v1.0.0)

A lightweight library to decode and verify RS JWT meant for the browser.

### Usage

```js
var IdTokenVerifier = require('idtoken-verifier');

var verifier = new IdTokenVerifier({
        issuer: 'https://my.auth0.com/',
        audience: 'gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt'
    });

verifier.verify(id_token, nonce, function(error, payload) {
    ...
});

var decoded = verifier.decode(id_token);
```
