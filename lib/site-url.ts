export const PRODUCTION_SITE_URL = 'https://welfare.atomcare.co.kr';
const LOCAL_SITE_URL = 'http://localhost:5000';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const production = process.env.NODE_ENV === 'production';
  const fallback = production ? PRODUCTION_SITE_URL : LOCAL_SITE_URL;

  if (!configured) return fallback;

  try {
    const parsed = new URL(configured);

    if (production) {
      if (parsed.protocol !== 'https:' || LOCAL_HOSTS.has(parsed.hostname)) {
        return PRODUCTION_SITE_URL;
      }
    } else if (!['http:', 'https:'].includes(parsed.protocol)) {
      return LOCAL_SITE_URL;
    }

    return parsed.toString().replace(/\/$/, '');
  } catch {
    return fallback;
  }
}
