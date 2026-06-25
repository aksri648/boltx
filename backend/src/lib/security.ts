import { isAllowedUrl } from '~/utils/url';

export function validateWebSearchUrl(url: string): boolean {
  return isAllowedUrl(url) && url.startsWith('https://');
}
