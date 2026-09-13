'use client';

import { useEffect, useState } from 'react';
import {
  addConsultCartItem,
  CONSULT_CART_EVENT,
  readConsultCart,
  type ConsultCartItem,
} from '@/lib/consult-cart';

export default function AddToConsultCart({ item, compact = false }: { item: ConsultCartItem; compact?: boolean }) {
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const sync = () => setAdded(readConsultCart().some((entry) => entry.benefitCode === item.benefitCode));
    sync();
    window.addEventListener(CONSULT_CART_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CONSULT_CART_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [item.benefitCode]);

  return (
    <button
      type="button"
      className={`button ${added ? 'secondary' : 'primary'} consult-cart-add ${compact ? 'compact' : ''}`}
      onClick={() => {
        addConsultCartItem(item);
        setAdded(true);
      }}
      aria-label={`${item.title} 상담 장바구니에 담기`}
    >
      {added ? '상담 장바구니에 담김 ✓' : '상담 장바구니에 담기'}
    </button>
  );
}
