import { PROMPT_COOKIE_KEY } from '~/utils/constants';

export function getCachedPrompt(req: { headers: { cookie?: string } }): string | undefined {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${PROMPT_COOKIE_KEY}=([^;]*)`));
  if (!match) return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return undefined;
  }
}

export function setCachedPrompt(res: any, value: string) {
  const encoded = encodeURIComponent(value);
  res.setHeader('Set-Cookie', `${PROMPT_COOKIE_KEY}=${encoded}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);
}
