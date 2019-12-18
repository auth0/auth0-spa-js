import urljoin from 'url-join';
import * as base64 from './base64';
import unfetch from 'unfetch';
import Promise from 'promise-polyfill';

export function process(jwks) {
  var modulus = base64.decodeToHEX(jwks.n);
  var exp = base64.decodeToHEX(jwks.e);

  return {
    modulus: modulus,
    exp: exp
  };
}

function checkStatus(response) {
  if (response.ok) {
    return response.json();
  }
  var error = new Error(response.statusText);
  error.response = response;
  return Promise.reject(error);
}

export function getJWKS(options, cb) {
  const localFetch = typeof fetch == 'undefined' ? unfetch : fetch;
  var url = options.jwksURI || urljoin(options.iss, '.well-known', 'jwks.json');
  return localFetch(url)
    .then(checkStatus)
    .then(function(data) {
      var matchingKey = null;
      var a;
      var key;
      // eslint-disable-next-line no-plusplus
      for (a = 0; a < data.keys.length && matchingKey === null; a++) {
        key = data.keys[a];
        if (key.kid === options.kid) {
          matchingKey = key;
        }
      }
      return cb(null, process(matchingKey));
    })
    .catch(function(e) {
      cb(e);
    });
}
