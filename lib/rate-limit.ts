type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitStore = Map<string, RateLimitBucket>;

const globalRateLimit = globalThis as typeof globalThis & {
  __atomcareRateLimitStore?: RateLimitStore;
};

const store = globalRateLimit.__atomcareRateLimitStore ?? new Map<string, RateLimitBucket>();
globalRateLimit.__atomcareRateLimitStore = store;

export function getClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: Math.max(limit - 1, 0),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  current.count += 1;
  store.set(key, current);

  return {
    allowed: current.count <= limit,
    remaining: Math.max(limit - current.count, 0),
    retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1000), 1),
  };
}

export function clearRateLimit(key: string) {
  store.delete(key);
}
