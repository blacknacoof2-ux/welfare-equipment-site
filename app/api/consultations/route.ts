import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getCopays, getPriceSuffix, publishedProducts } from '@/lib/products';

export const runtime = 'nodejs';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const maxFileBytes = 10 * 1024 * 1024;
const formatter = new Intl.NumberFormat('ko-KR');

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function buildSmsDraft(
  name: string,
  priceReview: Array<{ title: string; priceSuffix: string; copay15: number; copay9: number; copay6: number }>,
  rate: 15 | 9 | 6,
) {
  const amountKey = rate === 15 ? 'copay15' : rate === 9 ? 'copay9' : 'copay6';
  const productLines = priceReview
    .map((item) => `${item.title} ${formatter.format(item[amountKey])}원${item.priceSuffix}`)
    .join(', ');
  return `[아톰케어] ${name}님 장기요양 복지용구 상담 결과입니다. 확인된 본인부담률 ${rate}% 기준 참고금액: ${productLines}. 최종 공급 가능 여부와 금액은 담당자 확인 내용이 우선합니다.`;
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
  const address = text(formData, 'address');
  const addressDetail = text(formData, 'addressDetail');
  const relation = text(formData, 'relation');
  const needs = text(formData, 'needs');
  const items = text(formData, 'items');
  const certificate = formData.get('certificate');

  if (!name || !phone || !address || !items || !(certificate instanceof File)) {
    return NextResponse.json({ message: '이름, 휴대폰 번호, 주소, 상담 제품, 장기요양인정서를 모두 확인해 주세요.' }, { status: 400 });
  }

  const phoneDigits = phone.replace(/\D/g, '');
  if (!/^01[016789]\d{7,8}$/.test(phoneDigits)) {
    return NextResponse.json({ message: '휴대폰 번호를 확인해 주세요.' }, { status: 400 });
  }
  if (address.length < 5 || address.length > 300 || addressDetail.length > 200) {
    return NextResponse.json({ message: '주소를 다시 확인해 주세요.' }, { status: 400 });
  }
  if (name.length > 80 || relation.length > 50 || needs.length > 2000) {
    return NextResponse.json({ message: '입력한 상담 정보를 확인해 주세요.' }, { status: 400 });
  }
  if (!allowedTypes.has(certificate.type)) {
    return NextResponse.json({ message: '인정서는 JPG, PNG, WEBP 또는 PDF 파일만 제출할 수 있습니다.' }, { status: 415 });
  }
  if (certificate.size <= 0 || certificate.size > maxFileBytes) {
    return NextResponse.json({ message: '인정서 파일은 10MB 이하로 제출해 주세요.' }, { status: 413 });
  }

  let requestedCodes: string[];
  try {
    const parsed = JSON.parse(items) as Array<{ benefitCode?: unknown }>;
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 30) throw new Error('invalid');
    requestedCodes = Array.from(new Set(parsed.map((item) => String(item?.benefitCode ?? '').trim()).filter(Boolean)));
    if (!requestedCodes.length || requestedCodes.length > 30) throw new Error('invalid');
  } catch {
    return NextResponse.json({ message: '상담 장바구니 정보를 확인해 주세요.' }, { status: 400 });
  }

  const productsByCode = new Map(publishedProducts.map((product) => [product.benefitCode, product] as const));
  const selectedProducts = requestedCodes.map((code) => productsByCode.get(code));
  if (selectedProducts.some((product) => !product)) {
    return NextResponse.json({ message: '현재 공개 중인 상담 제품 정보를 다시 확인해 주세요.' }, { status: 400 });
  }

  const priceReview = selectedProducts.map((product) => {
    if (!product) throw new Error('unreachable');
    const copays = getCopays(product.benefitPrice);
    return {
      slug: product.slug,
      title: product.name === product.model ? product.name : `${product.name} ${product.model}`,
      manufacturer: product.manufacturer,
      benefitCode: product.benefitCode,
      category: product.category,
      benefitPrice: product.benefitPrice,
      priceSuffix: getPriceSuffix(product),
      ...copays,
    };
  });

  const requestId = `AC-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const submittedAt = new Date().toISOString();
  const smsDraft15 = buildSmsDraft(name, priceReview, 15);
  const smsDraft9 = buildSmsDraft(name, priceReview, 9);
  const smsDraft6 = buildSmsDraft(name, priceReview, 6);
  const staffSummary = [
    `[아톰케어 장기요양 복지용구 접수] ${requestId}`,
    `신청자: ${name} / ${phone}`,
    `주소: ${address}${addressDetail ? ` ${addressDetail}` : ''}`,
    `관계: ${relation || '미입력'}`,
    `요청: ${needs || '미입력'}`,
    `제품: ${priceReview.map((item) => `${item.title}(${item.benefitCode})`).join(', ')}`,
    '처리: 장기요양인정서와 급여 가능 여부 확인 → 적용 본인부담률 결정 → 해당 금액 문자 발송',
  ].join('\n');

  const reviewPayload = {
    requestId,
    submittedAt,
    reviewStatus: 'REVIEW_PENDING',
    nextAction: 'VERIFY_CERTIFICATE_AND_ELIGIBILITY_THEN_SEND_SMS',
    customer: {
      name,
      phone,
      address,
      addressDetail,
      relation,
      needs,
    },
    priceReview,
    smsOptions: {
      rate15: smsDraft15,
      rate9: smsDraft9,
      rate6: smsDraft6,
    },
  };

  const outbound = new FormData();
  outbound.set('requestId', requestId);
  outbound.set('submittedAt', submittedAt);
  outbound.set('reviewStatus', 'REVIEW_PENDING');
  outbound.set('nextAction', 'VERIFY_CERTIFICATE_AND_ELIGIBILITY_THEN_SEND_SMS');
  outbound.set('name', name);
  outbound.set('phone', phone);
  outbound.set('address', address);
  outbound.set('addressDetail', addressDetail);
  outbound.set('relation', relation);
  outbound.set('needs', needs);
  outbound.set('items', items);
  outbound.set('priceReview', JSON.stringify(priceReview));
  outbound.set('reviewPayload', JSON.stringify(reviewPayload));
  outbound.set('staffSummary', staffSummary);
  outbound.set('smsDraft15', smsDraft15);
  outbound.set('smsDraft9', smsDraft9);
  outbound.set('smsDraft6', smsDraft6);
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

    return NextResponse.json({
      ok: true,
      requestId,
      status: 'REVIEW_PENDING',
      nextAction: 'ATOMCARE_REVIEW_AND_SMS',
    });
  } catch {
    return NextResponse.json({ message: '보안 상담 접수처에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 502 });
  }
}