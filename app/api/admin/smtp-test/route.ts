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


// Allowlist only: exception.message, stack, response, and auth payloads are
// intentionally never accessed or logged.
export function classifySmtpTestError(error: unknown): string {
  if (!(error instanceof Error)) return 'UNKNOWN';
  if (error.message === 'SMTP_TEST_CONFIG_INVALID') return 'CONFIG_INVALID';
  if (error.message === 'SMTP_TEST_DISABLED') return 'TEST_DISABLED';
  if (error.message === 'SMTP_TEST_RECIPIENT_REJECTED') return 'RECIPIENT_REJECTED';
  const details = error as Error & { code?: unknown; responseCode?: unknown };
  if (details.code === 'EAUTH' || details.responseCode === 535 || details.responseCode === 534) return 'AUTH_REJECTED';
  if (details.code === 'ETIMEDOUT' || details.code === 'ESOCKET') return 'CONNECTION_TIMEOUT_OR_SOCKET';
  if (details.code === 'ECONNECTION' || details.code === 'ECONNREFUSED' || details.code === 'ENOTFOUND' || details.code === 'EHOSTUNREACH') return 'CONNECTION_FAILED';
  if (details.code === 'ETLS' || details.code === 'ESOCKETTLS') return 'TLS_FAILED';
  if (details.code === 'EENVELOPE' || details.responseCode === 550 || details.responseCode === 553) return 'RECIPIENT_REJECTED';
  return 'UNKNOWN';
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
  } catch (error: unknown) {
    // Log a fixed category only. Never expose SMTP error messages, server replies,
    // SMTP credentials, customer data, or IP addresses.
    const diagnostic = classifySmtpTestError(error);
    console.error('[admin-smtp-test] SMTP_TEST_FAILED:' + diagnostic);
    return reply('SMTP 시험에 실패했습니다. 오류 분류: ' + diagnostic, 502);
  }
}
