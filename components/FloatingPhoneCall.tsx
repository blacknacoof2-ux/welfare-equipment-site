'use client';

import { usePathname } from 'next/navigation';

export default function FloatingPhoneCall() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) return null;

  return (
    <aside className="floating-phone-call" aria-label="구매 및 문의 전화">
      <span>구매 및 문의</span>
      <a href="tel:0319753335" aria-label="아톰케어랩 구매 및 문의 031-975-3335로 전화하기">
        <b>☎</b> 031-975-3335
      </a>
    </aside>
  );
}
