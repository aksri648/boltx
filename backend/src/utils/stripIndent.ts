export const stripIndents = (strings: TemplateStringsArray | string, ...values: any[]): string => {
  if (typeof strings === 'string') return strings;
  let result = '';
  strings.forEach((str, i) => {
    result += str + (values[i] ?? '');
  });
  return result.replace(/^[^\S\n]*\n/gm, '').trim();
};
