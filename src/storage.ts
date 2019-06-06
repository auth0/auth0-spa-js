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
  Cookies.set(key, JSON.stringify(value), {
    expires: options.daysUntilExpire
  });
};
export const remove = (key: string) => {
  Cookies.remove(key);
};
