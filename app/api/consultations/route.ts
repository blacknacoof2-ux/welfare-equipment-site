import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createIntake, isIntakeStoreConfigured, type IntakeProduct } from '@/lib/intake-store';
import { getPriceSuffix, publishedProducts } from '@/lib/products';

export const runtime = 'nodejs';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const maxFileBytes = 10 * 1024 * 1024;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function isValidDate(value: string, allowFuture = true) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  const year = Number(value.slice(0, 4));
  if (year < 1900) return false;
  return allowFuture || date.getTime() <= Date.now();
}

export async function POST(request: Request) {
  const webhookUrl = process.env.CONSULTATION_WEBHOOK_URL?.trim() ?? '';
  const storeConfigured = isIntakeStoreConfigured();
  if (!storeConfigured && !webhookUrl) {
    return NextResponse.json(
      { message: '안전한 신청 접수 저장소가 아직 연결되지 않았습니다. 운영 담당자에게 Supabase 또는 CONSULTATION_WEBHOOK_URL 설정이 필요합니다.' },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: '제출 형식을 확인해 주세요.' }, { status: 400 });
  }

  const applicantName = text(formData, 'applicantName') || text(formData, 'name');
  const beneficiaryName = text(formData, 'beneficiaryName');
  const birthDate = text(formData, 'birthDate');
  const careNumber = text(formData, 'careNumber').replace(/\s+/g, '');
  const validityStartDate = text(formData, 'validityStartDate');
  const phone = text(formData, 'phone');
  const address = text(formData, 'address');
  const addressDetail = text(formData, 'addressDetail');
  const relation = text(formData, 'relation');
  const needs = text(formData, 'needs');
  const items = text(formData, 'items');
  const certificateValue = formData.get('certificate');
  const certificate = certificateValue instanceof File && certificateValue.size > 0 ? certificateValue : null;

  if (!applicantName || !beneficiaryName || !birthDate || !careNumber || !validityStartDate || !phone || !address || !items) {
    return NextResponse.json({ message: '수급자 정보, 인정번호, 유효기간 시작일, 연락처, 주소, 신청제품을 확인해 주세요.' }, { status: 400 });
  }
  if (!isValidDate(birthDate, false)) {
    return NextResponse.json({ message: '수급자 생년월일을 확인해 주세요.' }, { status: 400 });
  }
  if (!isValidDate(validityStartDate, true)) {
    return NextResponse.json({ message: '장기요양 유효기간 시작일을 확인해 주세요.' }, { status: 400 });
  }
  if (careNumber.length < 6 || careNumber.length > 40 || !/^[0-9A-Za-z가-힣-]+$/.test(careNumber)) {
    return NextResponse.json({ message: '장기요양인정번호를 다시 확인해 주세요.' }, { status: 400 });
  }

  const phoneDigits = phone.replace(/\D/g, '');
  if (!/^01[016789]\d{7,8}$/.test(phoneDigits)) {
    return NextResponse.json({ message: '휴대폰 번호를 확인해 주세요.' }, { status: 400 });
  }
  if (address.length < 5 || address.length > 300 || addressDetail.length > 200) {
    return NextResponse.json({ message: '주소를 다시 확인해 주세요.' }, { status: 400 });
  }
  if (applicantName.length > 80 || beneficiaryName.length > 80 || relation.length > 50 || needs.length > 2000) {
    return NextResponse.json({ message: '입력한 신청 정보를 확인해 주세요.' }, { status: 400 });
  }
  if (certificate && !allowedTypes.has(certificate.type)) {
    return NextResponse.json({ message: '인정서는 JPG, PNG, WEBP 또는 PDF 파일만 제출할 수 있습니다.' }, { status: 415 });
  }
  if (certificate && certificate.size > maxFileBytes) {
    return NextResponse.json({ message: '인정서 파일은 10MB 이하로 제출해 주세요.' }, { status: 413 });
  }

  let requestedCodes: string[];
  try {
    const parsed = JSON.parse(items) as Array<{ benefitCode?: unknown }>;
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 30) throw new Error('invalid');
    requestedCodes = Array.from(new Set(parsed.map((item) => String(item?.benefitCode ?? '').trim()).filter(Boolean)));
    if (!requestedCodes.length || requestedCodes.length > 30) throw new Error('invalid');
  } catch {
    return NextResponse.json({ message: '신청목록 정보를 확인해 주세요.' }, { status: 400 });
  }

  const productsByCode = new Map(publishedProducts.map((product) => [product.benefitCode, product] as const));
  const selectedProducts = requestedCodes.map((code) => productsByCode.get(code));
  if (selectedProducts.some((product) => !product)) {
    return NextResponse.json({ message: '현재 공개 중인 신청 제품 정보를 다시 확인해 주세요.' }, { status: 400 });
  }

  const intakeItems: IntakeProduct[] = selectedProducts.map((product) => {
    if (!product) throw new Error('unreachable');
    return {
      slug: product.slug,
      title: product.name === product.model ? product.name : `${product.name} ${product.model}`,
      manufacturer: product.manufacturer,
      benefitCode: product.benefitCode,
      category: product.category,
      benefitPrice: product.benefitPrice,
      priceSuffix: getPriceSuffix(product),
    };
  });

  const requestId = `AC-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const submittedAt = new Date().toISOString();

  if (storeConfigured) {
    try {
      await createIntake({
        request_id: requestId,
        submitted_at: submittedAt,
        applicant_name: applicantName,
        beneficiary_name: beneficiaryName,
        birth_date: birthDate,
        care_number: careNumber,
        validity_start_date: validityStartDate,
        phone,
        address,
        address_detail: addressDetail,
        relation,
        needs,
        items: intakeItems,
      }, certificate);
    } catch {
      return NextResponse.json({ message: '보안 접수 저장소에 신청을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 502 });
    }
  }

  if (webhookUrl) {
    const outbound = new FormData();
    outbound.set('requestId', requestId);
    outbound.set('submittedAt', submittedAt);
    outbound.set('status', 'NEW');
    outbound.set('applicantName', applicantName);
    outbound.set('beneficiaryName', beneficiaryName);
    outbound.set('birthDate', birthDate);
    outbound.set('careNumber', careNumber);
    outbound.set('validityStartDate', validityStartDate);
    outbound.set('phone', phone);
    outbound.set('address', address);
    outbound.set('addressDetail', addressDetail);
    outbound.set('relation', relation);
    outbound.set('needs', needs);
    outbound.set('items', JSON.stringify(intakeItems));
    if (certificate) outbound.set('certificate', certificate, certificate.name);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: outbound,
        headers: { 'x-atomcare-request-id': requestId },
        cache: 'no-store',
      });
      if (!response.ok && !storeConfigured) {
        return NextResponse.json({ message: '신청 접수처가 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 502 });
      }
    } catch {
      if (!storeConfigured) {
        return NextResponse.json({ message: '신청 접수처에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 502 });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    requestId,
    status: 'NEW',
    certificateSubmitted: Boolean(certificate),
    nextAction: 'ATOMCARE_INTERNAL_REVIEW',
  });
}
