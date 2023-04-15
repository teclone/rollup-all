/**
 * converts text to camel like casing
 */
export const camelCase = (
  text: string,
  delimiter: string | RegExp = /[-_.\s]/
): string => {
  return text
    .split(delimiter)
    .map((token, index) => {
      return index === 0
        ? token
        : token.charAt(0).toUpperCase() + token.substring(1);
    })
    .join('');
};
