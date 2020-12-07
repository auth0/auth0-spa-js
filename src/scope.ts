/**
 * @ignore
 */
const dedupe = (arr: string[]) => Array.from(new Set(arr));

/**
 * @ignore
 */
export const getUniqueScopes = (...scopes: string[]) => {
  return dedupe(scopes.join(' ').trim().split(/\s+/)).join(' ');
};

/**
 * @ignore
 */
export const getMissingScope = (
  originalScope: string = '',
  comparingScope: string = ''
) => {
  const originalScopes = originalScope.split(/\s+/);
  const comparingScopes = comparingScope.split(/\s+/);

  return originalScopes
    .filter(scope => !comparingScopes.includes(scope))
    .join(' ');
};
