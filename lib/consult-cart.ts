export type ConsultCartItem = {
  slug: string;
  title: string;
  manufacturer: string;
  benefitCode: string;
  benefitPrice: number;
  category: string;
  benefitMode: 'PURCHASE' | 'RENTAL' | 'PURCHASE_OR_RENTAL';
  priceSuffix: string;
  imageUrl?: string;
};

export type RecipientDraft = {
  recipientName: string;
  recognitionNumber: string;
  birthDate: string;
  careGrade: string;
  validityStartDate: string;
};

export type CareConditionDraft = {
  walkingStatus: string;
  legStrength: string;
  sitStand: string;
  fallRisk: string;
  bathroomRisk: string;
  bathingHelp: string;
  toiletDifficulty: string;
  threshold: string;
  bedMobility: string;
  caregiver: string;
  place: 'home' | 'outdoor' | 'both';
  priority: 'fit' | 'light' | 'cost';
  notes: string;
};

export type ConsultationDraft = {
  recipient: RecipientDraft;
  conditions: CareConditionDraft;
  needs: string;
  recommendedSetTitle?: string;
  recommendedCategories?: string[];
  savedAt: string;
};

export const CONSULT_CART_KEY = 'atomcare-consult-cart-v1';
export const CONSULT_NEEDS_KEY = 'atomcare-consult-needs-v1';
export const CONSULT_DRAFT_KEY = 'atomcare-consult-draft-v1';
export const CONSULT_CART_EVENT = 'atomcare-consult-cart-changed';

export function readConsultCart(): ConsultCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CONSULT_CART_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeConsultCart(items: ConsultCartItem[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CONSULT_CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CONSULT_CART_EVENT));
}

export function addConsultCartItem(item: ConsultCartItem) {
  const items = readConsultCart();
  if (!items.some((existing) => existing.benefitCode === item.benefitCode)) {
    writeConsultCart([...items, item]);
  }
}

export function removeConsultCartItem(benefitCode: string) {
  writeConsultCart(readConsultCart().filter((item) => item.benefitCode !== benefitCode));
}

export function writeConsultationDraft(draft: ConsultationDraft) {
  if (typeof window === 'undefined') return;
  // 수급자 인정번호·생년월일은 장기 보관하지 않고 현재 탭의 sessionStorage에만 둔다.
  window.sessionStorage.setItem(CONSULT_DRAFT_KEY, JSON.stringify(draft));
}

export function readConsultationDraft(): ConsultationDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(CONSULT_DRAFT_KEY) ?? 'null');
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as ConsultationDraft;
  } catch {
    return null;
  }
}

export function clearConsultationDraft() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(CONSULT_DRAFT_KEY);
}
