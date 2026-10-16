import { getCurrentAdminSession } from '@/lib/admin-auth';
import { sendAdminSmtpTestMail } from '@/lib/admin-smtp-test';
import { checkPersistentRateLimit } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function reply(message: string, status: number) {
  return NextResponse.json({ message }, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

export async function POST(request: Request) {
  const session = await getCurrentAdminSession();
  if (!session) return reply('관리자 로그인이 필요합니다.', 401);

  if (process.env.ADMIN_SMTP_TEST_ENABLED !== 'true') {
    return reply('SMTP 시험 기능이 비활성화돼 있습니다.', 403);
  }

  // Require an explicit same-origin browser action, not a cross-origin form.
  const origin = request.headers.get('origin');
  if (origin !== 'https://welfare.atomcare.co.kr' &&
      !(process.env.NODE_ENV !== 'production' && origin === 'http://localhost:5000')) {
    return reply('허용되지 않은 요청 출처입니다.', 403);
  }
  if (request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') {
    return reply('잘못된 요청 형식입니다.', 415);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return reply('요청 본문이 올바르지 않습니다.', 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      (body as Record<string, unknown>).confirmation !== 'SEND_ONE_ADMIN_SMTP_TEST') {
    return reply('시험 발송 확인 문자열이 일치하지 않습니다.', 400);
  }

  // Persistent cross-instance attempt limit; fail closed if no distributed store.
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return reply('시험 발송 제한 저장소가 연결되지 않았습니다.', 503);
  }
  const kstDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const limit = await checkPersistentRateLimit(`admin-smtp-test:${kstDay}`, 1, 24 * 60 * 60 * 1000);
  if (limit.source !== 'distributed') return reply('발송 횟수 제한을 검증하지 못했습니다.', 503);
  if (!limit.allowed) return reply('오늘 시험 발송 시도가 이미 있었습니다.', 429);

  try {
    await sendAdminSmtpTestMail();
    return NextResponse.json({ ok: true, status: 'smtp_accepted' }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    // Never reveal SMTP server responses or credentials to browser/logs.
    console.error('[admin-smtp-test] SMTP_TEST_FAILED');
    return reply('SMTP 시험에 실패했습니다. 관리자 로그를 확인해 주세요.', 502);
  }
}
