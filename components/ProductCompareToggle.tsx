'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  COMPARE_SELECTION_EVENT,
  MAX_COMPARE_ITEMS,
  readCompareSelection,
  writeCompareSelection,
  type CompareSelectionItem,
} from '@/lib/compare-selection';

export default function ProductCompareToggle({ item, compact = false }: { item: CompareSelectionItem; compact?: boolean }) {
  const [selection, setSelection] = useState<CompareSelectionItem[]>([]);

  useEffect(() => {
    const sync = () => setSelection(readCompareSelection());
    sync();
    window.addEventListener(COMPARE_SELECTION_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(COMPARE_SELECTION_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const selected = useMemo(() => selection.some((entry) => entry.slug === item.slug), [selection, item.slug]);
  const sameCategory = selection.length === 0 || selection.every((entry) => entry.category === item.category);
  const full = !selected && sameCategory && selection.length >= MAX_COMPARE_ITEMS;

  function toggle() {
    if (selected) {
      writeCompareSelection(selection.filter((entry) => entry.slug !== item.slug));
      return;
    }

    if (!sameCategory) {
      writeCompareSelection([item]);
      return;
    }

    if (selection.length >= MAX_COMPARE_ITEMS) return;
    writeCompareSelection([...selection, item]);
  }

  return (
    <button
      type="button"
      className={`button ${selected ? 'primary' : 'secondary'}`}
      onClick={toggle}
      disabled={full}
      aria-pressed={selected}
      aria-label={`${item.name} 비교 ${selected ? '해제' : '선택'}`}
      title={!sameCategory && !selected ? '다른 품목을 선택하면 기존 비교목록이 초기화됩니다.' : undefined}
      style={compact ? { width: '100%', padding: '9px 12px', fontSize: 14 } : undefined}
    >
      {selected ? `비교 선택됨 ✓ (${selection.length}/${MAX_COMPARE_ITEMS})` : full ? '최대 3개까지 비교' : '비교하기'}
    </button>
  );
}
