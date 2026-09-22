import { NextResponse } from 'next/server';
import { getCurrentAdminSession } from '@/lib/admin-auth';
import { ELIGIBILITY_STATUSES, type EligibilityStatus } from '@/lib/intake-eligibility';
import { INTAKE_STATUSES, isIntakeStoreConfigured, updateIntake, type IntakeStatus } from '@/lib/intake-store';

export const runtime = 'nodejs';

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentAdminSession();
  if (!session) return noStoreJson({ message: '로그인이 필요합니다.' }, 401);
  if (!isIntakeStoreConfigured()) {
    return noStoreJson({ message: '운영 접수 저장소가 아직 연결되지 않았습니다.' }, 503);
  }

  let body: {
    status?: unknown;
    staffNote?: unknown;
    eligibilityStatus?: unknown;
    verifiedCareGrade?: unknown;
    verifiedCopayRate?: unknown;
    eligibilityMessage?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ message: '저장할 내용을 확인해 주세요.' }, 400);
  }

  const status = typeof body.status === 'string' ? body.status : undefined;
  const staffNote = typeof body.staffNote === 'string' ? body.staffNote.trim() : undefined;
  const eligibilityStatus = typeof body.eligibilityStatus === 'string' ? body.eligibilityStatus : undefined;
  const verifiedCareGrade = typeof body.verifiedCareGrade === 'string' ? body.verifiedCareGrade.trim() : undefined;
  const eligibilityMessage = typeof body.eligibilityMessage === 'string' ? body.eligibilityMessage.trim() : undefined;
  const verifiedCopayRate = body.verifiedCopayRate === '' || body.verifiedCopayRate == null
    ? null
    : Number(body.verifiedCopayRate);

  if (status && !INTAKE_STATUSES.includes(status as IntakeStatus)) {
    return noStoreJson({ message: '처리상태 값이 올바르지 않습니다.' }, 400);
  }
  if (eligibilityStatus && !ELIGIBILITY_STATUSES.includes(eligibilityStatus as EligibilityStatus)) {
    return noStoreJson({ message: '자격상태 값이 올바르지 않습니다.' }, 400);
  }
  if (staffNote && staffNote.length > 5000) {
    return noStoreJson({ message: '담당자 메모는 5,000자 이하로 입력해 주세요.' }, 400);
  }
  if (verifiedCareGrade && verifiedCareGrade.length > 40) {
    return noStoreJson({ message: '확인 등급을 다시 확인해 주세요.' }, 400);
  }
  if (eligibilityMessage && eligibilityMessage.length > 2000) {
    return noStoreJson({ message: '자격확인 메모는 2,000자 이하로 입력해 주세요.' }, 400);
  }
  if (verifiedCopayRate != null && (!Number.isFinite(verifiedCopayRate) || verifiedCopayRate < 0 || verifiedCopayRate > 100)) {
    return noStoreJson({ message: '본인부담률을 다시 확인해 주세요.' }, 400);
  }

  const { id } = await params;
  try {
    const updated = await updateIntake(id, {
      ...(status ? { status: status as IntakeStatus } : {}),
      ...(staffNote !== undefined ? { staff_note: staffNote } : {}),
      ...(eligibilityStatus ? { eligibility_status: eligibilityStatus as EligibilityStatus } : {}),
      ...(verifiedCareGrade !== undefined ? { verified_care_grade: verifiedCareGrade || null } : {}),
      ...(body.verifiedCopayRate !== undefined ? { verified_copay_rate: verifiedCopayRate } : {}),
      ...(eligibilityMessage !== undefined ? { eligibility_message: eligibilityMessage } : {}),
    } as unknown as Parameters<typeof updateIntake>[1]);
    if (!updated) return noStoreJson({ message: '접수건을 찾지 못했습니다.' }, 404);
    return noStoreJson({ ok: true, intake: updated });
  } catch {
    return noStoreJson({ message: '접수건을 저장하지 못했습니다.' }, 502);
  }
}
