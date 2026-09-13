'use client';

import { useEffect, useState } from 'react';
import {
  addCompareItem,
  COMPARE_EVENT,
  readCompareItems,
  type CompareItem,
} from '@/lib/compare';

export default function AddToCompare({ item, compact = false }: { item: CompareItem; compact?: boolean }) {
  const [added, setAdded] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const sync = () => setAdded(readCompareItems().some((entry) => entry.benefitCode === item.benefitCode));
    sync();
    window.addEventListener(COMPARE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(COMPARE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [item.benefitCode]);

  return (
    <div className="compare-add-wrap">
      <button
        type="button"
        className={`button ${added ? 'secondary' : 'outline'} compare-add ${compact ? 'compact' : ''}`}
        onClick={() => {
          const result = addCompareItem(item);
          setMessage(result.message);
          if (result.ok) setAdded(true);
        }}
        aria-label={`${item.title} 같은 카테고리 제품 비교함에 담기`}
      >
        {added ? '비교함에 담김 ✓' : '같은 품목 비교'}
      </button>
      {message && !added && <small className="compare-add-message">{message}</small>}
    </div>
  );
}
