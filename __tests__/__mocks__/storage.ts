export const internalStorage = {};

export const get = <T extends Object>(key: string) => {
  const value = internalStorage[key];
  if (typeof value === 'undefined') {
    return;
  }
  return <T>JSON.parse(value);
};
export const save = (key: string, value: any, options: any) => {
  internalStorage[key] = JSON.stringify(value);
};
export const remove = (key: string) => {
  internalStorage[key] = undefined;
};
