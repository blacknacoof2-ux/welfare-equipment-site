import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const maxFileBytes = 10 * 1024 * 1024;
const maxJsonTextBytes = 32 * 1024;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function parseObject(value: string) {
  if (!value || Buffer.byteLength(value, 'utf8') > maxJsonTextBytes) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const webhookUrl = process.env.CONSULTATION_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      { message: '인정서 보안 전송 대상이 아직 연결되지 않았습니다. 운영 담당자에게 CONSULTATION_WEBHOOK_URL 설정이 필요합니다.' },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: '제출 형식을 확인해 주세요.' }, { status: 400 });
  }

  const name = text(formData, 'name');
  const phone = text(formData, 'phone');
  const relation = text(formData, 'relation');
  const needs = text(formData, 'needs');
  const items = text(formData, 'items');
  const recipientData = text(formData, 'recipientData');
  const conditionData = text(formData, 'conditionData');
  const recommendationData = text(formData, 'recommendationData');
  const certificate = formData.get('certificate');

  if (!name || !phone || !items || !recipientData || !(certificate instanceof File)) {
    return NextResponse.json({ message: '신청자 정보, 수급자 정보, 상담 제품, 장기요양인정서를 모두 확인해 주세요.' }, { status: 400 });
  }
  if (name.length > 80 || phone.length > 40 || relation.length > 40 || needs.length > 4000) {
    return NextResponse.json({ message: '입력 내용이 허용 길이를 초과했습니다.' }, { status: 400 });
  }
  if (!allowedTypes.has(certificate.type)) {
    return NextResponse.json({ message: '인정서는 JPG, PNG, WEBP 또는 PDF 파일만 제출할 수 있습니다.' }, { status: 415 });
  }
  if (certificate.size <= 0 || certificate.size > maxFileBytes) {
    return NextResponse.json({ message: '인정서 파일은 10MB 이하로 제출해 주세요.' }, { status: 413 });
  }

  try {
    const parsed = JSON.parse(items);
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 30) throw new Error('invalid');
  } catch {
    return NextResponse.json({ message: '상담 장바구니 정보를 확인해 주세요.' }, { status: 400 });
  }

  const recipient = parseObject(recipientData);
  const conditions = parseObject(conditionData);
  const recommendation = recommendationData ? parseObject(recommendationData) : {};
  if (!recipient || !conditions || !recommendation) {
    return NextResponse.json({ message: '수급자 상태 또는 추천 정보를 확인해 주세요.' }, { status: 400 });
  }

  const recipientName = typeof recipient.recipientName === 'string' ? recipient.recipientName.trim() : '';
  const recognitionNumber = typeof recipient.recognitionNumber === 'string' ? recipient.recognitionNumber.trim() : '';
  const birthDate = typeof recipient.birthDate === 'string' ? recipient.birthDate.trim() : '';
  const careGrade = typeof recipient.careGrade === 'string' ? recipient.careGrade.trim() : '';
  const validityStartDate = typeof recipient.validityStartDate === 'string' ? recipient.validityStartDate.trim() : '';

  if (!recipientName || !/^\d{10}$/.test(recognitionNumber) || !birthDate || !careGrade || !validityStartDate) {
    return NextResponse.json({ message: '수급자명, 인정번호 10자리, 생년월일, 인정등급, 유효기간 시작일을 확인해 주세요.' }, { status: 400 });
  }

  const requestId = `AC-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const outbound = new FormData();
  outbound.set('requestId', requestId);
  outbound.set('submittedAt', new Date().toISOString());
  outbound.set('name', name);
  outbound.set('phone', phone);
  outbound.set('relation', relation);
  outbound.set('needs', needs);
  outbound.set('items', items);
  outbound.set('recipientData', recipientData);
  outbound.set('conditionData', conditionData);
  outbound.set('recommendationData', recommendationData || '{}');
  outbound.set('certificate', certificate, certificate.name);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: outbound,
      headers: { 'x-atomcare-request-id': requestId },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ message: '상담 접수처가 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 502 });
    }

    return NextResponse.json({ ok: true, requestId, status: 'REVIEW_PENDING' });
  } catch {
    return NextResponse.json({ message: '보안 상담 접수처에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 502 });
  }
}
