import type { IntakeRecord } from '@/lib/intake-store';

export const ELIGIBILITY_STATUSES = ['PENDING', 'VERIFIED', 'ELIGIBLE', 'INELIGIBLE', 'NEEDS_REVIEW'] as const;
export type EligibilityStatus = (typeof ELIGIBILITY_STATUSES)[number];

export type IntakeEligibilityItem = {
  itemCode: string;
  itemName: string;
  benefitType: 'purchase' | 'rental';
  unit: string;
  limitQuantity: number;
  limitYears: number | null;
  contractedQuantity: number;
  availableQuantity: number;
};

export type IntakeWithEligibility = IntakeRecord & {
  self_reported_care_grade: string;
  eligibility_status: EligibilityStatus;
  verified_beneficiary_name: string | null;
  verified_care_grade: string | null;
  verified_copay_rate: number | null;
  verified_valid_from: string | null;
  verified_valid_to: string | null;
  verified_eligible_items: IntakeEligibilityItem[];
  eligibility_message: string;
  eligibility_checked_at: string | null;
};

export const eligibilityStatusLabel: Record<EligibilityStatus, string> = {
  PENDING: '확인대기',
  VERIFIED: '자격확인',
  ELIGIBLE: '신청가능',
  INELIGIBLE: '급여불가',
  NEEDS_REVIEW: '추가확인',
};

export function careGradeLabel(value: string | null | undefined) {
  if (!value) return '-';
  if (value === 'COGNITIVE') return '인지지원등급';
  if (value === 'UNKNOWN') return '잘 모름';
  if (/^[1-5]$/.test(value)) return `${value}등급`;
  return value;
}
