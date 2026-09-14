export type CompareSelectionItem = {
  slug: string;
  name: string;
  category: string;
};

export const COMPARE_SELECTION_KEY = 'atomcare-product-compare-v1';
export const COMPARE_SELECTION_EVENT = 'atomcare-product-compare-changed';
export const MAX_COMPARE_ITEMS = 3;

export function readCompareSelection(): CompareSelectionItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(COMPARE_SELECTION_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is CompareSelectionItem => Boolean(
        item
        && typeof item.slug === 'string'
        && typeof item.name === 'string'
        && typeof item.category === 'string',
      ))
      .slice(0, MAX_COMPARE_ITEMS);
  } catch {
    return [];
  }
}

export function writeCompareSelection(items: CompareSelectionItem[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(COMPARE_SELECTION_KEY, JSON.stringify(items.slice(0, MAX_COMPARE_ITEMS)));
  window.dispatchEvent(new Event(COMPARE_SELECTION_EVENT));
}

export function clearCompareSelection() {
  writeCompareSelection([]);
}
