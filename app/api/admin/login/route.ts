import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  ADMIN_COOKIE_NAME,
  adminSessionMaxAge,
  createAdminSessionToken,
  isAdminAuthConfigured,
  validateAdminCredentials,
} from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isAdminAuthConfigured()) {
    return NextResponse.json(
      { message: '관리자 로그인이 아직 설정되지 않았습니다. ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_SESSION_SECRET를 설정해 주세요.' },
      { status: 503 },
    );
  }

  let body: { username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: '로그인 정보를 확인해 주세요.' }, { status: 400 });
  }

  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!validateAdminCredentials(username, password)) {
    return NextResponse.json({ message: '관리자 아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, createAdminSessionToken(username), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: adminSessionMaxAge,
  });

  return NextResponse.json({ ok: true });
}
