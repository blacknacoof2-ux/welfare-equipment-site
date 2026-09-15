'use client';

import { useEffect, useState } from 'react';
import {
  CONSULT_CART_EVENT,
  readConsultCart,
  removeConsultCartItem,
  type ConsultCartItem,
} from '@/lib/consult-cart';

export default function FloatingConsultCart() {
  const [items, setItems] = useState<ConsultCartItem[]>([]);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const sync = () => setItems(readConsultCart());
    sync();
    window.addEventListener(CONSULT_CART_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CONSULT_CART_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  if (!items.length) return null;

  return (
    <aside className={`floating-consult-cart ${open ? 'open' : 'collapsed'}`} aria-label="신청목록 빠른 보기">
      <button
        type="button"
        className="floating-consult-cart-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span>신청목록</span>
        <strong>{items.length}</strong>
      </button>

      {open && (
        <div className="floating-consult-cart-panel">
          <div className="floating-consult-cart-heading">
            <div>
              <small>복지용구 LAB</small>
              <strong>담은 제품 {items.length}개</strong>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="신청목록 접기">×</button>
          </div>

          <div className="floating-consult-cart-items">
            {items.slice(0, 3).map((item) => (
              <article key={item.benefitCode}>
                {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <div className="floating-consult-cart-placeholder" />}
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.category}</small>
                </div>
                <button type="button" onClick={() => removeConsultCartItem(item.benefitCode)} aria-label={`${item.title} 신청목록에서 삭제`}>×</button>
              </article>
            ))}
            {items.length > 3 && <p className="floating-consult-cart-more">외 {items.length - 3}개 제품</p>}
          </div>

          <a className="button primary floating-consult-cart-cta" href="/consult/cart">신청내용 확인·접수하기</a>
        </div>
      )}
    </aside>
  );
}
