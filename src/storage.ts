import * as Cookies from 'es-cookie';

interface ClientStorageOptions {
  daysUntilExpire: number;
}

export type ClientStorage = {
  get<T extends Object>(key: string): T;
  save(key: string, value: any, options?: ClientStorageOptions): void;
  remove(key: string): void;
  getAllKeys(): string[];
};

export const CookieStorage = {
  get<T extends Object>(key: string) {
    const value = Cookies.get(key);
    if (typeof value === 'undefined') {
      return;
    }
    return <T>JSON.parse(value);
  },

  save(key: string, value: any, options?: ClientStorageOptions): void {
    let cookieAttributes: Cookies.CookieAttributes = {};
    if ('https:' === window.location.protocol) {
      cookieAttributes = {
        secure: true,
        sameSite: 'none'
      };
    }
    cookieAttributes.expires = options.daysUntilExpire;
    Cookies.set(key, JSON.stringify(value), cookieAttributes);
  },

  remove(key: string) {
    Cookies.remove(key);
  },

  getAllKeys() {
    return Object.keys(Cookies.getAll() || {});
  }
} as ClientStorage;

export const SessionStorage = {
  get<T extends Object>(key: string) {
    const value = sessionStorage.getItem(key);
    if (typeof value === 'undefined') {
      return;
    }
    return <T>JSON.parse(value);
  },

  save(key: string, value: any): void {
    sessionStorage.setItem(key, JSON.stringify(value));
  },

  remove(key: string) {
    sessionStorage.removeItem(key);
  },

  getAllKeys() {
    return Object.keys(sessionStorage);
  }
} as ClientStorage;
