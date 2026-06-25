const PRIVATE_IP_PATTERNS = [
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
  /^169\.254\.\d{1,3}\.\d{1,3}$/,
  /^0\.0\.0\.0$/,
];

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '[::1]',
  '0.0.0.0',
  // IPv6 loopback variants
  '::1',
  '::',
  // IPv4-mapped IPv6
  '::ffff:127.0.0.1',
  '::ffff:10.0.0.0',
  '::ffff:172.16.0.0',
  '::ffff:192.168.0.0',
  // metadata endpoint
  '169.254.169.254',
]);

export function isValidUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isAllowedUrl(input: string): boolean {
  if (!isValidUrl(input)) return false;
  const url = new URL(input);
  const hostname = url.hostname.toLowerCase();

  // Block known dangerous hostnames
  if (BLOCKED_HOSTNAMES.has(hostname)) return false;

  // Block IPv4 private/reserved ranges
  if (PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname))) return false;

  // Block IPv6 private/loopback addresses (compressed forms)
  const stripped = hostname.replace(/\[|\]/g, '');
  if (/^(::1|::)$/i.test(stripped)) return false;
  if (/^fc[0-9a-f]{2}:/i.test(stripped) || /^fd[0-9a-f]{2}:/i.test(stripped)) return false;
  if (/^fe80:/i.test(stripped)) return false;
  if (/^::ffff:(127|10|172|192|169)\./i.test(stripped)) return false;

  return true;
}
