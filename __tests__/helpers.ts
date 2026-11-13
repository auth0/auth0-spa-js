import { expect } from '@jest/globals';

export const expectToHaveBeenCalledWithAuth0ClientParam = (mock, expected) => {
  const [[url]] = (<jest.Mock>mock).mock.calls;
  const param = new URL(url).searchParams.get('auth0Client');
  const decodedParam = decodeURIComponent(atob(param));
  const actual = JSON.parse(decodedParam);
  expect(actual).toStrictEqual(expected);
};

export const expectToHaveBeenCalledWithHash = (mock, expected) => {
  const [[url]] = (<jest.Mock>mock).mock.calls;
  const hash = new URL(url).hash;
  expect(hash).toEqual(expected);
};

// TypeScript 5 types the `window.location` setter as `string`, so a mock
// `Location` can no longer be assigned to it directly. The descriptor matches
// what a plain assignment creates, so `{ ...window }` still copies it.
export const setWindowLocation = (location: Location): void => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: location
  });
};
