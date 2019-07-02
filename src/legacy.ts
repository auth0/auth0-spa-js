import 'ts-polyfill';
import 'unfetch/polyfill/index';
if (!window.crypto && (<any>window).msCrypto) {
  (<any>window).crypto = (<any>window).msCrypto;
}
if (!window.crypto) {
  throw new Error(
    'For security reasons, `window.crypto` is required to run `auth0-spa-js`.'
  );
}
export * from './index';
