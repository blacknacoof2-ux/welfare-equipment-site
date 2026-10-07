import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  ADMIN_COOKIE_NAME,
  adminSessionMaxAge,
  createAdminSessionToken,
  isAdminAuthConfigured,
  validateAdminCredentials,
} from '@/lib/admin-auth';
import {
  checkPersistentRateLimit,
  clearPersistentRateLimit,
  getClientIp,
} from '@/lib/rate-limit';

export const runtime = 'nodejs';

const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;

function noStoreJson(body: unknown, status = 200, headers: HeadersInit = {}) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      ...headers,
    },
  });
}

export async function POST(request: Request) {
  const rateLimitKey = `admin-login:${getClientIp(request)}`;
  const rateLimit = await checkPersistentRateLimit(rateLimitKey, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!rateLimit.allowed) {
    return noStoreJson(
      { message: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
      429,
      { 'Retry-After': String(rateLimit.retryAfterSeconds) },
    );
  }

  if (!isAdminAuthConfigured()) {
    return noStoreJson(
      { message: '관리자 로그인이 아직 설정되지 않았습니다. ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_SESSION_SECRET를 설정해 주세요.' },
      503,
    );
  }

  let body: { username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ message: '로그인 정보를 확인해 주세요.' }, 400);
  }

  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!validateAdminCredentials(username, password)) {
    return noStoreJson({ message: '관리자 아이디 또는 비밀번호가 올바르지 않습니다.' }, 401);
  }

  await clearPersistentRateLimit(rateLimitKey);

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, createAdminSessionToken(username), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: adminSessionMaxAge,
  });

  return noStoreJson({ ok: true });
}
