export type CompareItem = {
  slug: string;
  title: string;
  model: string;
  manufacturer: string;
  benefitCode: string;
  benefitPrice: number;
  category: string;
  benefitMode: 'PURCHASE' | 'RENTAL' | 'PURCHASE_OR_RENTAL';
  priceSuffix: string;
  imageUrl?: string;
  dimensions?: string;
  material?: string;
  weightKg?: number;
};

export const COMPARE_KEY = 'atomcare-product-compare-v1';
export const COMPARE_EVENT = 'atomcare-product-compare-changed';
export const MAX_COMPARE_ITEMS = 3;

export function readCompareItems(): CompareItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(COMPARE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.slice(0, MAX_COMPARE_ITEMS) : [];
  } catch {
    return [];
  }
}

export function writeCompareItems(items: CompareItem[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(COMPARE_KEY, JSON.stringify(items.slice(0, MAX_COMPARE_ITEMS)));
  window.dispatchEvent(new Event(COMPARE_EVENT));
}

export function addCompareItem(item: CompareItem): { ok: boolean; message: string } {
  const current = readCompareItems();
  if (current.some((entry) => entry.benefitCode === item.benefitCode)) {
    return { ok: true, message: '이미 비교함에 담긴 제품입니다.' };
  }
  if (current.length > 0 && current[0].category !== item.category) {
    return { ok: false, message: `비교함에는 같은 카테고리 제품만 담을 수 있습니다. 현재 ${current[0].category} 제품을 비교 중입니다.` };
  }
  if (current.length >= MAX_COMPARE_ITEMS) {
    return { ok: false, message: `최대 ${MAX_COMPARE_ITEMS}개까지 비교할 수 있습니다.` };
  }
  writeCompareItems([...current, item]);
  return { ok: true, message: '비교함에 담았습니다.' };
}

export function removeCompareItem(benefitCode: string) {
  writeCompareItems(readCompareItems().filter((item) => item.benefitCode !== benefitCode));
}

export function clearCompareItems() {
  writeCompareItems([]);
}
