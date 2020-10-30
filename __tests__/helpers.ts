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
