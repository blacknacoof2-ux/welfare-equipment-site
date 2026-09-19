import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createIntake, isIntakeStoreConfigured, updateIntake, type IntakeProduct } from '@/lib/intake-store';
import { getPriceSuffix, publishedProducts, type Product } from '@/lib/products';
import { checkPersistentRateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const allowedCareGrades = new Set(['1', '2', '3', '4', '5', 'COGNITIVE', 'UNKNOWN']);
const maxFileBytes = 10 * 1024 * 1024;
const CONSULTATION_LIMIT = 6;
const CONSULTATION_WINDOW_MS = 10 * 60 * 1000;
const OUTBOUND_TIMEOUT_MS = 8000;

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

function noStoreJson(body: unknown, status = 200, headers: HeadersInit = {}) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      ...headers,
    },
  });
}

async function certificateMatchesDeclaredType(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const startsWith = (...signature: number[]) => signature.every((value, index) => bytes[index] === value);

  if (file.type === 'image/jpeg') return startsWith(0xff, 0xd8, 0xff);
  if (file.type === 'image/png') return startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  if (file.type === 'application/pdf') return startsWith(0x25, 0x50, 0x44, 0x46, 0x2d);
  if (file.type === 'image/webp') {
    return (
      startsWith(0x52, 0x49, 0x46, 0x46) &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }
  return false;
}

export async function POST(request: NextRequest) {
  const rateLimit = await checkPersistentRateLimit(
    `consultation:${getClientIp(request)}`,
    CONSULTATION_LIMIT,
    CONSULTATION_WINDOW_MS,
  );
  if (!rateLimit.allowed) {
    return noStoreJson(
      { message: '접수 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
      429,
      { 'Retry-After': String(rateLimit.retryAfterSeconds) },
    );
  }

  const webhookUrl = process.env.CONSULTATION_WEBHOOK_URL?.trim() ?? '';
  const storeConfigured = isIntakeStoreConfigured();
  if (!storeConfigured && !webhookUrl) {
    return noStoreJson(
      { message: '안전한 신청 접수 저장소가 아직 연결되지 않았습니다. 운영 담당자에게 Supabase 또는 CONSULTATION_WEBHOOK_URL 설정이 필요합니다.' },
      503,
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return noStoreJson({ message: '제출 형식을 확인해 주세요.' }, 400);
  }

  const applicantName = text(formData, 'applicantName') || text(formData, 'name');
  const beneficiaryName = text(formData, 'beneficiaryName');
  const birthDate = text(formData, 'birthDate');
  const careNumber = text(formData, 'careNumber').replace(/\D/g, '');
  const validityStartDate = text(formData, 'validityStartDate');
  const careGrade = text(formData, 'careGrade');
  const phone = text(formData, 'phone');
  const address = text(formData, 'address');
  const addressDetail = text(formData, 'addressDetail');
  const relation = text(formData, 'relation');
  const needs = text(formData, 'needs');
  const items = text(formData, 'items');
  const certificateValue = formData.get('certificate');
  const certificate = certificateValue instanceof File && certificateValue.size > 0 ? certificateValue : null;

  if (!applicantName || !beneficiaryName || !birthDate || !careNumber || !validityStartDate || !careGrade || !phone || !address || !items) {
    return noStoreJson({ message: '수급자 정보, 신청자 정보, 연락처, 주소와 신청제품을 확인해 주세요.' }, 400);
  }
  if (!isValidDate(birthDate, false)) {
    return noStoreJson({ message: '수급자 생년월일을 확인해 주세요.' }, 400);
  }
  if (!isValidDate(validityStartDate, true)) {
    return noStoreJson({ message: '장기요양 유효기간 시작일을 확인해 주세요.' }, 400);
  }
  if (!/^\d{10}$/.test(careNumber)) {
    return noStoreJson({ message: '장기요양인정번호 10자리를 다시 확인해 주세요.' }, 400);
  }
  if (!allowedCareGrades.has(careGrade)) {
    return noStoreJson({ message: '장기요양 등급을 다시 선택해 주세요.' }, 400);
  }

  const phoneDigits = phone.replace(/\D/g, '');
  if (!/^01[016789]\d{7,8}$/.test(phoneDigits)) {
    return noStoreJson({ message: '휴대폰 번호를 확인해 주세요.' }, 400);
  }
  if (address.length < 5 || address.length > 300 || addressDetail.length > 200) {
    return noStoreJson({ message: '주소를 다시 확인해 주세요.' }, 400);
  }
  if (applicantName.length > 80 || beneficiaryName.length > 80 || relation.length > 50 || needs.length > 2000) {
    return noStoreJson({ message: '입력한 신청 정보를 확인해 주세요.' }, 400);
  }
  if (certificate && !allowedTypes.has(certificate.type)) {
    return noStoreJson({ message: '인정서는 JPG, PNG, WEBP 또는 PDF 파일만 제출할 수 있습니다.' }, 415);
  }
  if (certificate && certificate.size > maxFileBytes) {
    return noStoreJson({ message: '인정서 파일은 10MB 이하로 제출해 주세요.' }, 413);
  }
  if (certificate) {
    let validSignature = false;
    try {
      validSignature = await certificateMatchesDeclaredType(certificate);
    } catch {
      return noStoreJson({ message: '인정서 파일을 확인하지 못했습니다. 다시 선택해 주세요.' }, 400);
    }
    if (!validSignature) {
      return noStoreJson({ message: '파일 확장자와 실제 파일 형식이 일치하지 않습니다.' }, 415);
    }
  }

  let requestedCodes: string[];
  try {
    const parsed = JSON.parse(items) as Array<{ benefitCode?: unknown }>;
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 30) throw new Error('invalid');
    requestedCodes = Array.from(new Set(parsed.map((item) => String(item?.benefitCode ?? '').trim()).filter(Boolean)));
    if (!requestedCodes.length || requestedCodes.length > 30) throw new Error('invalid');
  } catch {
    return noStoreJson({ message: '신청목록 정보를 확인해 주세요.' }, 400);
  }

  const productsByCode = new Map(publishedProducts.map((product) => [product.benefitCode, product] as const));
  const selectedProducts = requestedCodes.map((code) => productsByCode.get(code));
  if (selectedProducts.some((product) => !product)) {
    return noStoreJson({ message: '현재 공개 중인 신청 제품 정보를 다시 확인해 주세요.' }, 400);
  }
  const trustedProducts = selectedProducts.filter((product): product is Product => Boolean(product));
  const intakeItems: IntakeProduct[] = trustedProducts.map((product) => ({
    slug: product.slug,
    title: product.name === product.model ? product.name : `${product.name} ${product.model}`,
    manufacturer: product.manufacturer,
    benefitCode: product.benefitCode,
    category: product.category,
    benefitPrice: product.benefitPrice,
    priceSuffix: getPriceSuffix(product),
  }));

  const requestId = `AC-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const submittedAt = new Date().toISOString();

  if (storeConfigured) {
    try {
      const stored = await createIntake({
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

      await updateIntake(stored.id, {
        self_reported_care_grade: careGrade,
        eligibility_status: 'PENDING',
        verified_beneficiary_name: null,
        verified_care_grade: null,
        verified_copay_rate: null,
        verified_valid_from: null,
        verified_valid_to: null,
        verified_eligible_items: [],
        eligibility_message: '',
        eligibility_checked_at: null,
      } as unknown as Parameters<typeof updateIntake>[1]);
    } catch {
      return noStoreJson({ message: '보안 접수 저장소에 신청을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, 502);
    }
  }

  if (webhookUrl) {
    const outbound = new FormData();
    outbound.set('requestId', requestId);
    outbound.set('submittedAt', submittedAt);
    outbound.set('status', 'NEW');
    outbound.set('eligibilityStatus', 'PENDING');
    outbound.set('applicantName', applicantName);
    outbound.set('beneficiaryName', beneficiaryName);
    outbound.set('birthDate', birthDate);
    outbound.set('careNumber', careNumber);
    outbound.set('validityStartDate', validityStartDate);
    outbound.set('selfReportedCareGrade', careGrade);
    outbound.set('phone', phone);
    outbound.set('address', address);
    outbound.set('addressDetail', addressDetail);
    outbound.set('relation', relation);
    outbound.set('needs', needs);
    outbound.set('items', JSON.stringify(intakeItems));
    outbound.set('beneficiaryVerified', 'false');
    if (certificate) outbound.set('certificate', certificate, certificate.name);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: outbound,
        headers: { 'x-atomcare-request-id': requestId },
        cache: 'no-store',
        signal: AbortSignal.timeout(OUTBOUND_TIMEOUT_MS),
      });
      if (!response.ok && !storeConfigured) {
        return noStoreJson({ message: '신청 접수처가 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, 502);
      }
    } catch {
      if (!storeConfigured) {
        return noStoreJson({ message: '신청 접수처에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, 502);
      }
    }
  }

  return noStoreJson({
    ok: true,
    requestId,
    status: 'NEW',
    eligibilityStatus: 'PENDING',
    beneficiaryVerified: false,
    certificateSubmitted: Boolean(certificate),
    nextAction: 'ATOMCARE_ELIGIBILITY_REVIEW',
  });
}
