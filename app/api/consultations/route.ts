import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  BENEFICIARY_PROOF_COOKIE,
  verifyBeneficiaryProof,
} from '@/lib/beneficiary-proof';
import { createIntake, isIntakeStoreConfigured, type IntakeProduct } from '@/lib/intake-store';
import { getBenefitMode, getPriceSuffix, publishedProducts, type Product } from '@/lib/products';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const maxFileBytes = 10 * 1024 * 1024;
const CONSULTATION_LIMIT = 6;
const CONSULTATION_WINDOW_MS = 10 * 60 * 1000;

type EligibleItem = {
  itemCode: string;
  itemName: string;
  benefitType: 'purchase' | 'rental';
  unit: string;
  limitQuantity: number;
  limitYears: number | null;
  contractedQuantity: number;
  availableQuantity: number;
};

type RevalidationResult = {
  ok?: boolean;
  status?: string;
  code?: string;
  message?: string;
  beneficiary?: {
    name?: string;
    recognitionNumber?: string;
    careGrade?: string | null;
    validFrom?: string;
    validTo?: string | null;
    copayRate?: number | null;
    copayType?: string | null;
  };
  eligibleItems?: EligibleItem[];
};

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

function benefitModeMatches(product: Product, eligibleItem: EligibleItem) {
  const mode = getBenefitMode(product);
  if (mode === 'PURCHASE') return eligibleItem.benefitType === 'purchase';
  if (mode === 'RENTAL') return eligibleItem.benefitType === 'rental';
  return true;
}

function matchEligibleItem(product: Product, eligibleItems: EligibleItem[]) {
  return eligibleItems
    .filter((item) => item.itemName === product.category && benefitModeMatches(product, item))
    .sort((a, b) => b.availableQuantity - a.availableQuantity)[0] ?? null;
}

function validateSelectedProducts(products: Product[], eligibleItems: EligibleItem[]) {
  const matches = products.map((product) => ({
    product,
    eligibleItem: matchEligibleItem(product, eligibleItems),
  }));

  const counts = new Map<string, number>();
  for (const { eligibleItem } of matches) {
    if (!eligibleItem) continue;
    counts.set(eligibleItem.itemCode, (counts.get(eligibleItem.itemCode) ?? 0) + 1);
  }

  const blocked = matches.flatMap(({ product, eligibleItem }) => {
    if (!eligibleItem) {
      return [`${product.category}: 현재 확인된 급여 가능품목이 아닙니다.`];
    }

    const requested = counts.get(eligibleItem.itemCode) ?? 1;
    if (requested > eligibleItem.availableQuantity) {
      return [
        `${eligibleItem.itemName}: 남은 ${eligibleItem.availableQuantity}${eligibleItem.unit}보다 신청 제품 수 ${requested}개가 많습니다.`,
      ];
    }

    return [];
  });

  return Array.from(new Set(blocked));
}

async function revalidateBeneficiary(input: {
  baseUrl: string;
  integrationSecret: string;
  recognitionNumber: string;
  birthDate: string;
  validFrom: string;
}) {
  const response = await fetch(`${input.baseUrl}/api/integration/eligibility/revalidate`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${input.integrationSecret}`,
    },
    body: JSON.stringify({
      recognitionNumber: input.recognitionNumber,
      birthDate: input.birthDate,
      validFrom: input.validFrom,
    }),
    cache: 'no-store',
  });

  const data = await response.json().catch(() => null) as RevalidationResult | null;
  return { response, data };
}

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(
    `consultation:${getClientIp(request)}`,
    CONSULTATION_LIMIT,
    CONSULTATION_WINDOW_MS,
  );
  if (!rateLimit.allowed) {
    return noStoreJson(
      { message: '접수 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
      429,
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

  const beneficiaryApiBaseUrl = process.env.BENEFICIARY_API_BASE_URL?.trim().replace(/\/$/, '');
  const integrationSecret = process.env.BENEFICIARY_INTEGRATION_SECRET?.trim();
  if (!beneficiaryApiBaseUrl || !integrationSecret) {
    return noStoreJson(
      { message: '수급자 자격확인 서비스 연결이 아직 설정되지 않았습니다.' },
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
  const birthDate = text(formData, 'birthDate');
  const careNumber = text(formData, 'careNumber').replace(/\D/g, '');
  const validityStartDate = text(formData, 'validityStartDate');
  const phone = text(formData, 'phone');
  const address = text(formData, 'address');
  const addressDetail = text(formData, 'addressDetail');
  const relation = text(formData, 'relation');
  const needs = text(formData, 'needs');
  const items = text(formData, 'items');
  const certificateValue = formData.get('certificate');
  const certificate = certificateValue instanceof File && certificateValue.size > 0 ? certificateValue : null;

  if (!applicantName || !birthDate || !careNumber || !validityStartDate || !phone || !address || !items) {
    return noStoreJson({ message: '수급자 정보, 인정번호, 유효기간 시작일, 연락처, 주소, 신청제품을 확인해 주세요.' }, 400);
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

  const phoneDigits = phone.replace(/\D/g, '');
  if (!/^01[016789]\d{7,8}$/.test(phoneDigits)) {
    return noStoreJson({ message: '휴대폰 번호를 확인해 주세요.' }, 400);
  }
  if (address.length < 5 || address.length > 300 || addressDetail.length > 200) {
    return noStoreJson({ message: '주소를 다시 확인해 주세요.' }, 400);
  }
  if (applicantName.length > 80 || relation.length > 50 || needs.length > 2000) {
    return noStoreJson({ message: '입력한 신청 정보를 확인해 주세요.' }, 400);
  }
  if (certificate && !allowedTypes.has(certificate.type)) {
    return noStoreJson({ message: '인정서는 JPG, PNG, WEBP 또는 PDF 파일만 제출할 수 있습니다.' }, 415);
  }
  if (certificate && certificate.size > maxFileBytes) {
    return noStoreJson({ message: '인정서 파일은 10MB 이하로 제출해 주세요.' }, 413);
  }

  const proof = request.cookies.get(BENEFICIARY_PROOF_COOKIE)?.value;
  let proofValid = false;
  try {
    proofValid = verifyBeneficiaryProof(proof, {
      recognitionNumber: careNumber,
      birthDate,
      validFrom: validityStartDate,
    });
  } catch {
    return noStoreJson({ message: '수급자 자격확인 서비스 보안 설정을 확인해 주세요.' }, 503);
  }

  if (!proofValid) {
    return noStoreJson(
      { message: '수급자 자격 확인 시간이 만료되었거나 입력정보가 변경되었습니다. 급여자격을 다시 확인해 주세요.' },
      409,
    );
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

  let revalidation: RevalidationResult | null = null;
  try {
    const result = await revalidateBeneficiary({
      baseUrl: beneficiaryApiBaseUrl,
      integrationSecret,
      recognitionNumber: careNumber,
      birthDate,
      validFrom: validityStartDate,
    });

    revalidation = result.data;
    if (!result.response.ok || !revalidation?.ok) {
      return noStoreJson(
        { message: revalidation?.message || '수급자 급여자격을 다시 확인하지 못했습니다.' },
        result.response.status >= 400 ? result.response.status : 502,
      );
    }
  } catch {
    return noStoreJson({ message: '수급자 급여자격 확인 서비스에 연결하지 못했습니다.' }, 502);
  }

  if (revalidation.status !== 'verified' || !revalidation.beneficiary?.name) {
    return noStoreJson(
      { message: revalidation.message || '현재 최종 신청 가능한 수급자 상태가 아닙니다.' },
      409,
    );
  }

  const blockedProducts = validateSelectedProducts(
    trustedProducts,
    revalidation.eligibleItems ?? [],
  );
  if (blockedProducts.length > 0) {
    return noStoreJson(
      {
        message: '최신 급여 가능품목 또는 남은 수량과 신청목록이 일치하지 않습니다.',
        blocked: blockedProducts,
      },
      409,
    );
  }

  const beneficiaryName = revalidation.beneficiary.name;
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
      return noStoreJson({ message: '보안 접수 저장소에 신청을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, 502);
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
    outbound.set('beneficiaryVerified', 'true');
    outbound.set('careGrade', revalidation.beneficiary.careGrade ?? '');
    outbound.set('copayRate', revalidation.beneficiary.copayRate == null ? '' : String(revalidation.beneficiary.copayRate));
    if (certificate) outbound.set('certificate', certificate, certificate.name);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: outbound,
        headers: { 'x-atomcare-request-id': requestId },
        cache: 'no-store',
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

  const response = noStoreJson({
    ok: true,
    requestId,
    status: 'NEW',
    beneficiaryVerified: true,
    careGrade: revalidation.beneficiary.careGrade ?? null,
    copayRate: revalidation.beneficiary.copayRate ?? null,
    certificateSubmitted: Boolean(certificate),
    nextAction: 'ATOMCARE_INTERNAL_REVIEW',
  });

  response.cookies.set(BENEFICIARY_PROOF_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/consultations',
    maxAge: 0,
  });

  return response;
}
