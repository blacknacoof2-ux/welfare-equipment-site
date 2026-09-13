'use client';

import { useEffect, useState } from 'react';
import { CONSULT_CART_EVENT, readConsultCart } from '@/lib/consult-cart';

export default function ConsultCartLink() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = () => setCount(readConsultCart().length);
    sync();
    window.addEventListener(CONSULT_CART_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CONSULT_CART_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return <a href="/consult/cart">상담 장바구니{count > 0 ? ` (${count})` : ''}</a>;
}
