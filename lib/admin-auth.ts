import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const ADMIN_COOKIE_NAME = 'atomcare_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12;

type SessionPayload = {
  username: string;
  exp: number;
};

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET?.trim() ?? '';
}

function sign(value: string) {
  return createHmac('sha256', getSecret()).update(value).digest('base64url');
}

function safeEqualText(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function isAdminAuthConfigured() {
  return Boolean(
    process.env.ADMIN_USERNAME?.trim()
      && process.env.ADMIN_PASSWORD?.trim()
      && getSecret().length >= 32,
  );
}

export function validateAdminCredentials(username: string, password: string) {
  const expectedUsername = process.env.ADMIN_USERNAME?.trim() ?? '';
  const expectedPassword = process.env.ADMIN_PASSWORD ?? '';
  if (!isAdminAuthConfigured()) return false;
  return safeEqualText(username, expectedUsername) && safeEqualText(password, expectedPassword);
}

export function createAdminSessionToken(username: string) {
  if (!isAdminAuthConfigured()) throw new Error('ADMIN_AUTH_NOT_CONFIGURED');
  const payload: SessionPayload = {
    username,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export function verifyAdminSessionToken(token?: string | null): SessionPayload | null {
  if (!token || !isAdminAuthConfigured()) return null;
  const [encoded, signature, extra] = token.split('.');
  if (!encoded || !signature || extra) return null;
  if (!safeEqualText(signature, sign(encoded))) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!payload.username || !Number.isFinite(payload.exp)) return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    if (payload.username !== process.env.ADMIN_USERNAME?.trim()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentAdminSession() {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

export async function requireAdminSession() {
  const session = await getCurrentAdminSession();
  if (!session) redirect('/admin/login');
  return session;
}

export const adminSessionMaxAge = SESSION_TTL_SECONDS;
