const singlePromiseMap: Record<string, Promise<any>> = {};

export const singlePromise = <T>(
  cb: () => Promise<T>,
  key: string
): Promise<T> => {
  let promise: null | Promise<T> = singlePromiseMap[key];
  if (!promise) {
    const basePromise = cb();
    promise = basePromise.then(
      (result) => {
        delete singlePromiseMap[key];
        return result;
      },
      (error) => {
        delete singlePromiseMap[key];
        throw error;
      }
    );
    singlePromiseMap[key] = promise;
  }
  return promise;
};

export const retryPromise = async (
  cb: () => Promise<boolean>,
  maxNumberOfRetries = 3
) => {
  for (let i = 0; i < maxNumberOfRetries; i++) {
    if (await cb()) {
      return true;
    }
  }

  return false;
};
