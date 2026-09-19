'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import FloatingConsultCart from '@/components/FloatingConsultCart';
import FloatingPhoneCall from '@/components/FloatingPhoneCall';
import ProductCompareTray from '@/components/ProductCompareTray';

export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');

  if (isAdmin) {
    return <main>{children}</main>;
  }

  return (
    <>
      <header className="site-header">
        <Link className="brand" href="/">ATOM CARE LAB <span>복지용구</span></Link>
        <nav aria-label="주요 메뉴">
          <Link href="/consult"><strong>AI 맞춤 추천</strong></Link>
          <Link href="/consult/cart"><strong>신청목록</strong></Link>
          <Link href="/compare"><strong>제품 비교</strong></Link>
          <Link href="/#purchase">구입</Link>
          <Link href="/#rental">대여</Link>
          <Link href="/#categories">품목 찾기</Link>
          <Link href="/#calculator">본인부담금</Link>
          <Link href="/products">전체 제품</Link>
          <Link href="/guide/copay">급여안내</Link>
        </nav>
      </header>
      <main>{children}</main>
      <FloatingConsultCart />
      <ProductCompareTray />
      <FloatingPhoneCall />
      <footer className="site-footer">
        <strong>주식회사 아톰케어</strong>
        <div className="site-footer-contact" aria-label="아톰케어 연락처">
          <a href="tel:0319753335">031-975-3335</a>
          <a href="mailto:atomcare@naver.com">atomcare@naver.com</a>
        </div>
        <p>복지용구 제품 정보는 최신 유통상태와 공단 고시를 확인하여 순차적으로 업데이트합니다.</p>
      </footer>
    </>
  );
}
