import * as Cookies from 'es-cookie';

interface ClientStorageOptions {
  daysUntilExpire: number;
}

export const getAllKeys = () => Object.keys(Cookies.getAll() || {});

export const get = <T extends Object>(key: string) => {
  const value = Cookies.get(key);
  if (typeof value === 'undefined') {
    return;
  }
  return <T>JSON.parse(value);
};
export const save = (
  key: string,
  value: any,
  options: ClientStorageOptions
) => {
  let cookieAttributes: Cookies.CookieAttributes = {};
  if ('https:' === window.location.protocol) {
    cookieAttributes = {
      secure: true,
      sameSite: 'none'
    };
  }
  cookieAttributes.expires = options.daysUntilExpire;
  Cookies.set(key, JSON.stringify(value), cookieAttributes);
};
export const remove = (key: string) => {
  Cookies.remove(key);
};
