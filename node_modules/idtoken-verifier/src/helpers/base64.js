import base64 from 'base64-js';

export function padding(str) {
  var mod = str.length % 4;
  var pad = 4 - mod;

  if (mod === 0) {
    return str;
  }

  return str + new Array(1 + pad).join('=');
}

export function byteArrayToString(array) {
  var result = '';
  for (var i = 0; i < array.length; i++) {
    result += String.fromCharCode(array[i]);
  }
  return result;
}

export function stringToByteArray(str) {
  var arr = new Array(str.length);
  for (var a = 0; a < str.length; a++) {
    arr[a] = str.charCodeAt(a);
  }
  return arr;
}

export function byteArrayToHex(raw) {
  var HEX = '';

  for (var i = 0; i < raw.length; i++) {
    var _hex = raw[i].toString(16);
    HEX += _hex.length === 2 ? _hex : '0' + _hex;
  }

  return HEX;
}

export function encodeString(str) {
  return base64
    .fromByteArray(
      stringToByteArray(
        encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
          return String.fromCharCode('0x' + p1);
        })
      )
    )
    .replace(/\+/g, '-') // Convert '+' to '-'
    .replace(/\//g, '_'); // Convert '/' to '_';
}

export function decodeToString(str) {
  str = padding(str)
    .replace(/\-/g, '+') // Convert '-' to '+'
    .replace(/_/g, '/'); // Convert '_' to '/'

  return decodeURIComponent(
    byteArrayToString(base64.toByteArray(str))
      .split('')
      .map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );
}

export function decodeToHEX(str) {
  return byteArrayToHex(base64.toByteArray(padding(str)));
}

export function base64ToBase64Url(base64String) {
  var SAFE_URL_ENCODING_MAPPING = {
    '+': '-',
    '/': '_',
    '=': ''
  };

  return base64String.replace(/[+/=]/g, function(m) {
    return SAFE_URL_ENCODING_MAPPING[m];
  });
}
