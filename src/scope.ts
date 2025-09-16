/**
 * @ignore
 */
const dedupe = (arr: string[]) => Array.from(new Set(arr));

/**
 * @ignore
 */
/**
 * Returns a string of unique scopes by removing duplicates and unnecessary whitespace.
 *
 * @param {...(string | undefined)[]} scopes - A list of scope strings or undefined values.
 * @returns {string} A string containing unique scopes separated by a single space.
 */
export const getUniqueScopes = (...scopes: (string | undefined)[]) => {
  return dedupe(scopes.filter(Boolean).join(' ').trim().split(/\s+/)).join(' ');
};
