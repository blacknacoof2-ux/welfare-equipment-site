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

export const CONSULT_CART_KEY = 'atomcare-consult-cart-v1';
export const CONSULT_NEEDS_KEY = 'atomcare-consult-needs-v1';
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
