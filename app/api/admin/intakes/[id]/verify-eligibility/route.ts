import { NextResponse } from 'next/server';
import { getCurrentAdminSession } from '@/lib/admin-auth';
import type { IntakeEligibilityItem, IntakeWithEligibility } from '@/lib/intake-eligibility';
import { getIntake, isIntakeStoreConfigured, updateIntake } from '@/lib/intake-store';
import { getBenefitMode, publishedProducts, type Product } from '@/lib/products';

export const runtime = 'nodejs';

const ELIGIBILITY_TIMEOUT_MS = 8_000;

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
  eligibleItems?: IntakeEligibilityItem[];
};

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

function benefitModeMatches(product: Product, eligibleItem: IntakeEligibilityItem) {
  const mode = getBenefitMode(product);
  if (mode === 'PURCHASE') return eligibleItem.benefitType === 'purchase';
  if (mode === 'RENTAL') return eligibleItem.benefitType === 'rental';
  return true;
}

function assessProducts(intake: IntakeWithEligibility, eligibleItems: IntakeEligibilityItem[]) {
  const productsByCode = new Map(publishedProducts.map((product) => [product.benefitCode, product] as const));
  const matches = intake.items.map((item) => {
    const product = productsByCode.get(item.benefitCode);
    const eligibleItem = product
      ? eligibleItems
          .filter((candidate) => candidate.itemName === product.category && benefitModeMatches(product, candidate))
          .sort((a, b) => b.availableQuantity - a.availableQuantity)[0] ?? null
      : null;
    return { item, product, eligibleItem };
  });

  const counts = new Map<string, number>();
  for (const match of matches) {
    if (!match.eligibleItem) continue;
    counts.set(match.eligibleItem.itemCode, (counts.get(match.eligibleItem.itemCode) ?? 0) + 1);
  }

  const blocked = matches.flatMap(({ item, product, eligibleItem }) => {
    if (!product) return [`${item.title}: 현재 공개 상품 정보를 찾지 못했습니다.`];
    if (!eligibleItem) return [`${item.category}: 현재 확인된 급여 가능품목에 포함되지 않습니다.`];
    if (eligibleItem.availableQuantity <= 0) {
      return [`${eligibleItem.itemName}: 급여 가능수량을 모두 사용했습니다. (남은수량 0${eligibleItem.unit})`];
    }
    const requested = counts.get(eligibleItem.itemCode) ?? 1;
    if (requested > eligibleItem.availableQuantity) {
      return [`${eligibleItem.itemName}: 남은 ${eligibleItem.availableQuantity}${eligibleItem.unit}보다 신청 수량 ${requested}개가 많습니다.`];
    }
    return [];
  });

  return Array.from(new Set(blocked));
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentAdminSession();
  if (!session) return noStoreJson({ message: '로그인이 필요합니다.' }, 401);
  if (!isIntakeStoreConfigured()) {
    return noStoreJson({ message: '운영 접수 저장소가 아직 연결되지 않았습니다.' }, 503);
  }

  const beneficiaryApiBaseUrl = process.env.BENEFICIARY_API_BASE_URL?.trim().replace(/\/$/, '');
  const integrationSecret = process.env.BENEFICIARY_INTEGRATION_SECRET?.trim();
  if (!beneficiaryApiBaseUrl || !integrationSecret) {
    return noStoreJson({ message: '수급자 시스템 연동 환경설정을 확인해 주세요.' }, 503);
  }

  const { id } = await params;
  const rawIntake = await getIntake(id).catch(() => null);
  if (!rawIntake) return noStoreJson({ message: '접수건을 찾지 못했습니다.' }, 404);
  const intake = rawIntake as IntakeWithEligibility;
  if (!intake.validity_start_date) {
    return noStoreJson({ message: '유효기간 시작일이 없어 자동 자격조회를 진행할 수 없습니다.' }, 400);
  }

  const checkedAt = new Date().toISOString();
  let response: Response;
  let data: RevalidationResult | null;
  try {
    response = await fetch(`${beneficiaryApiBaseUrl}/api/integration/eligibility/revalidate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${integrationSecret}`,
      },
      body: JSON.stringify({
        recognitionNumber: intake.care_number,
        birthDate: intake.birth_date,
        validFrom: intake.validity_start_date,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(ELIGIBILITY_TIMEOUT_MS),
    });
    data = await response.json().catch(() => null) as RevalidationResult | null;
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
    const eligibilityMessage = timedOut
      ? '수급자 시스템 응답이 지연되어 자동 조회를 중단했습니다. 잠시 후 다시 조회해 주세요.'
      : '수급자 시스템에 연결하지 못했습니다. 잠시 후 다시 조회해 주세요.';
    await updateIntake(id, {
      eligibility_status: 'NEEDS_REVIEW',
      eligibility_message: eligibilityMessage,
      eligibility_checked_at: checkedAt,
    } as unknown as Parameters<typeof updateIntake>[1]).catch(() => null);
    return noStoreJson({ message: eligibilityMessage, code: timedOut ? 'ELIGIBILITY_TIMEOUT' : 'ELIGIBILITY_UNAVAILABLE' }, 502);
  }

  if (!response.ok || !data?.ok) {
    const eligibilityMessage = data?.message || '수급자 자격정보를 확인하지 못했습니다.';
    await updateIntake(id, {
      eligibility_status: 'NEEDS_REVIEW',
      eligibility_message: eligibilityMessage,
      eligibility_checked_at: checkedAt,
    } as unknown as Parameters<typeof updateIntake>[1]).catch(() => null);
    return noStoreJson({ message: eligibilityMessage }, response.status >= 400 ? response.status : 502);
  }

  if (data.status !== 'verified' || !data.beneficiary?.name) {
    const eligibilityMessage = data.message || '수급자 정보를 추가 확인해야 합니다.';
    const updated = await updateIntake(id, {
      eligibility_status: 'NEEDS_REVIEW',
      verified_beneficiary_name: data.beneficiary?.name ?? null,
      verified_care_grade: data.beneficiary?.careGrade ?? null,
      verified_copay_rate: data.beneficiary?.copayRate ?? null,
      verified_valid_from: data.beneficiary?.validFrom ?? intake.validity_start_date,
      verified_valid_to: data.beneficiary?.validTo ?? null,
      verified_eligible_items: data.eligibleItems ?? [],
      eligibility_message: eligibilityMessage,
      eligibility_checked_at: checkedAt,
    } as unknown as Parameters<typeof updateIntake>[1]);
    return noStoreJson({ ok: true, eligibilityStatus: 'NEEDS_REVIEW', intake: updated, message: eligibilityMessage });
  }

  const eligibleItems = data.eligibleItems ?? [];
  const blocked = assessProducts(intake, eligibleItems);
  const eligibilityStatus = blocked.length === 0 ? 'ELIGIBLE' : 'INELIGIBLE';
  const eligibilityMessage = blocked.length === 0
    ? '수급자 자격과 현재 신청제품의 급여 가능범위를 확인했습니다.'
    : blocked.join(' ');

  const updated = await updateIntake(id, {
    eligibility_status: eligibilityStatus,
    verified_beneficiary_name: data.beneficiary.name,
    verified_care_grade: data.beneficiary.careGrade ?? null,
    verified_copay_rate: data.beneficiary.copayRate ?? null,
    verified_valid_from: data.beneficiary.validFrom ?? intake.validity_start_date,
    verified_valid_to: data.beneficiary.validTo ?? null,
    verified_eligible_items: eligibleItems,
    eligibility_message: eligibilityMessage,
    eligibility_checked_at: checkedAt,
  } as unknown as Parameters<typeof updateIntake>[1]);

  return noStoreJson({
    ok: true,
    eligibilityStatus,
    blocked,
    message: eligibilityMessage,
    intake: updated,
  });
}
