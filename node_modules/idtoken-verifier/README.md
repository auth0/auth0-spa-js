# idtoken-verifier

[![Build Status][circleci-image]][circleci-url]
[![NPM version][npm-image]][npm-url]
[![Coverage][codecov-image]][codecov-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

A lightweight library to decode and verify RS JWT meant for the browser.

## Usage

```js
import IdTokenVerifier from 'idtoken-verifier';

const verifier = new IdTokenVerifier({
    issuer: 'https://my.auth0.com/',
    audience: 'gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt'
});

verifier.verify(id_token, nonce, (error, payload) => {
    ...
});

var decoded = verifier.decode(id_token);
```

### IdTokenVerifier

Initializes the verifier.

Parameters:

- configuration
  - issuer: the issuer you trust to sign the tokens.
  - audience: the audience the token is issued for.
  - leeway: when there is a clock skew times between the signing and verifying servers. The leeway should not be bigger than five minutes.
  - jwksCache: the verifier will try to fetch the JWKS from the `/.well-known/jwks.json` endpoint (or `jwksURI` if provided) each time it verifies a token. You can provide a cache to store the keys and avoid repeated requests. For the contract, check [this example](https://github.com/auth0/jwt-js-rsa-verification/blob/master/src/helpers/dummy-cache.js). Hint: for in-memory cache, an easy way is to just provide `new Map()`, which is a valid object for jwksCache.
  - jwksURI: A valid, direct URI to fetch the JSON Web Key Set (JWKS). Defaults to `${id_token.iss}/.well-known/jwks.json`
- callback
  - error: the validation error if any, null otherwise
  - payload: the decoded jwt payload

### verifier.verify

This method will decode the token, verify the issuer, audience, expiration, algorithm and nonce claims and after that will verify the token signature.

Parameters

- id_token: the id_token to verify.
- nonce: the nonce previously sent to tha authorization server.
- callback

### verifier.decode

This method will decode the token header and payload _WITHOUT_ doing any verification.

Parameters

- id_token: the id_token to decode.

Return

- header: the decoded header.
- payload: the decoded payload.
- encoded: the parts without decode
  - header: the header string.
  - payload: the payload string.
  - signature: the signature string.

## Support

To make it as lightweight as posible, it only provides support for RS256 tokens. It can be easily extensible to other RS\* algorithms.

## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public GitHub issue tracker. The [Responsible Disclosure Program](https://auth0.com/whitehat) details the procedure for disclosing security issues.

## Author

[Auth0](https://auth0.com)

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.

<!-- Vaaaaarrrrsss -->

[npm-image]: https://img.shields.io/npm/v/idtoken-verifier.svg?style=flat-square
[npm-url]: https://npmjs.org/package/idtoken-verifier
[circleci-image]: http://img.shields.io/circleci/project/github/auth0/idtoken-verifier.svg?branch=master&style=flat-square
[circleci-url]: https://circleci.com/gh/auth0/idtoken-verifier
[codecov-image]: https://img.shields.io/codecov/c/github/auth0/idtoken-verifier.svg?style=flat-square
[codecov-url]: https://codecov.io/github/auth0/idtoken-verifier?branch=master
[license-image]: http://img.shields.io/npm/l/idtoken-verifier.svg?style=flat-square
[license-url]: #license
[downloads-image]: http://img.shields.io/npm/dm/idtoken-verifier.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/idtoken-verifier
