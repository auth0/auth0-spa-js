interface ClientStorageOptions {
  daysUntilExpire: number;
}
export declare const getAllKeys: () => string[];
export declare const get: <T extends Object>(key: string) => T;
export declare const save: (
  key: string,
  value: any,
  options: ClientStorageOptions
) => void;
export declare const remove: (key: string) => void;
export {};
