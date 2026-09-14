'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  clearCompareSelection,
  COMPARE_SELECTION_EVENT,
  MAX_COMPARE_ITEMS,
  readCompareSelection,
  type CompareSelectionItem,
} from '@/lib/compare-selection';

export default function ProductCompareTray() {
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

  const href = useMemo(
    () => `/compare?items=${encodeURIComponent(selection.map((item) => item.slug).join(','))}`,
    [selection],
  );

  if (selection.length === 0) return null;

  return (
    <aside
      aria-label="제품 비교 선택 목록"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 18,
        transform: 'translateX(-50%)',
        zIndex: 60,
        width: 'min(760px, calc(100vw - 24px))',
        border: '1px solid #cbd5e1',
        borderRadius: 18,
        background: 'rgba(255,255,255,0.97)',
        boxShadow: '0 18px 50px rgba(15,23,42,0.18)',
        padding: 14,
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <strong>{selection[0]?.category} 비교 {selection.length}/{MAX_COMPARE_ITEMS}</strong>
          <div className="muted" style={{ marginTop: 4, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 470 }}>
            {selection.map((item) => item.name).join(' · ')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" className="button secondary" onClick={clearCompareSelection}>초기화</button>
          {selection.length >= 2 ? (
            <a className="button primary" href={href}>비교표 보기</a>
          ) : (
            <span className="muted" style={{ fontSize: 13 }}>1개 더 선택하세요</span>
          )}
        </div>
      </div>
    </aside>
  );
}
