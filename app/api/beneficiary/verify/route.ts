import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const VERIFY_LIMIT = 8;
const VERIFY_WINDOW_MS = 10 * 60 * 1000;

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(
    `beneficiary-verify:${getClientIp(request)}`,
    VERIFY_LIMIT,
    VERIFY_WINDOW_MS,
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        code: 'RATE_LIMITED',
        message: '자격 확인 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
      },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const baseUrl = process.env.BENEFICIARY_API_BASE_URL?.trim().replace(/\/$/, '');
  const integrationSecret = process.env.BENEFICIARY_INTEGRATION_SECRET?.trim();

  if (!baseUrl || !integrationSecret) {
    return NextResponse.json(
      {
        ok: false,
        code: 'NOT_CONFIGURED',
        message: '수급자 자격확인 서비스 연결이 아직 설정되지 않았습니다.',
      },
      { status: 503 },
    );
  }

  let body: {
    recognitionNumber?: unknown;
    birthDate?: unknown;
    validFrom?: unknown;
    pin?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: 'INVALID_REQUEST', message: '입력 정보를 확인해 주세요.' },
      { status: 400 },
    );
  }

  const recognitionNumber = String(body.recognitionNumber ?? '').replace(/\D/g, '');
  const birthDate = String(body.birthDate ?? '').trim();
  const validFrom = String(body.validFrom ?? '').trim();
  const pin = String(body.pin ?? '').trim();

  if (
    recognitionNumber.length !== 10 ||
    !validDate(birthDate) ||
    !validDate(validFrom) ||
    !/^\d{6}$/.test(pin)
  ) {
    return NextResponse.json(
      {
        ok: false,
        code: 'INVALID_REQUEST',
        message: '인정번호, 생년월일, 유효기간 시작일, 조회 비밀번호를 확인해 주세요.',
      },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(`${baseUrl}/api/integration/eligibility/verify`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${integrationSecret}`,
      },
      body: JSON.stringify({
        recognitionNumber,
        birthDate,
        validFrom,
        pin,
      }),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        {
          ok: false,
          code: 'UPSTREAM_ERROR',
          message: '수급자 자격확인 결과를 불러오지 못했습니다.',
        },
        { status: 502 },
      );
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: 'UPSTREAM_UNAVAILABLE',
        message: '수급자 자격확인 서비스에 연결하지 못했습니다.',
      },
      { status: 502 },
    );
  }
}
