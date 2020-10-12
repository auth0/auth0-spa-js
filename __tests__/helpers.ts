export const expectToHaveBeenCalledWithAuth0ClientParam = (mock, expected) => {
  const url = (<jest.Mock>mock).mock.calls[mock.mock.calls.length - 1][0];
  const param = new URL(url).searchParams.get('auth0Client');
  const decodedParam = decodeURIComponent(atob(param));
  const actual = JSON.parse(decodedParam);
  expect(actual).toStrictEqual(expected);
};
