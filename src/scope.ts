/**
 * @ignore
 */
const dedupe = arr => arr.filter((x, i) => arr.indexOf(x) === i);

/**
 * @ignore
 */
export const getUniqueScopes = (...scopes: string[]) => {
  const scopeString = scopes.filter(Boolean).join();
  return dedupe(scopeString.replace(/\s/g, ',').split(',')).join(' ').trim();
};
