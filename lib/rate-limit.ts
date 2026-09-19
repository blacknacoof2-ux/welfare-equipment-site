type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  source: 'distributed' | 'memory';
};

type RateLimitStore = Map<string, RateLimitBucket>;

const globalRateLimit = globalThis as typeof globalThis & {
  __atomcareRateLimitStore?: RateLimitStore;
};

const store = globalRateLimit.__atomcareRateLimitStore ?? new Map<string, RateLimitBucket>();
globalRateLimit.__atomcareRateLimitStore = store;

function memoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: Math.max(limit - 1, 0),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
      source: 'memory',
    };
  }

  current.count += 1;
  store.set(key, current);

  return {
    allowed: current.count <= limit,
    remaining: Math.max(limit - current.count, 0),
    retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1000), 1),
    source: 'memory',
  };
}

function distributedConfig() {
  return {
    url: process.env.SUPABASE_URL?.trim().replace(/\/$/, '') ?? '',
    key: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? '',
  };
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  return memoryRateLimit(key, limit, windowMs);
}

export async function checkPersistentRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const { url, key: serviceKey } = distributedConfig();
  if (!url || !serviceKey) return memoryRateLimit(key, limit, windowMs);

  try {
    const response = await fetch(`${url}/rest/v1/rpc/consume_rate_limit`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_key: key,
        p_limit: limit,
        p_window_seconds: Math.max(Math.ceil(windowMs / 1000), 1),
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return memoryRateLimit(key, limit, windowMs);

    const rows = await response.json().catch(() => null) as
      | Array<{
          allowed?: boolean;
          remaining?: number;
          retry_after_seconds?: number;
        }>
      | null;
    const row = rows?.[0];
    if (
      !row ||
      typeof row.allowed !== 'boolean' ||
      !Number.isFinite(row.remaining) ||
      !Number.isFinite(row.retry_after_seconds)
    ) {
      return memoryRateLimit(key, limit, windowMs);
    }

    return {
      allowed: row.allowed,
      remaining: Math.max(Number(row.remaining), 0),
      retryAfterSeconds: Math.max(Number(row.retry_after_seconds), 1),
      source: 'distributed',
    };
  } catch {
    return memoryRateLimit(key, limit, windowMs);
  }
}

export function clearRateLimit(key: string) {
  store.delete(key);
}

export async function clearPersistentRateLimit(key: string) {
  clearRateLimit(key);
  const { url, key: serviceKey } = distributedConfig();
  if (!url || !serviceKey) return;

  try {
    await fetch(`${url}/rest/v1/rate_limit_buckets?bucket_key=eq.${encodeURIComponent(key)}`, {
      method: 'DELETE',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Successful authentication must not fail only because rate-limit cleanup failed.
  }
}
