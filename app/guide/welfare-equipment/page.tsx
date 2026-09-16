import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '복지용구란? 장기요양 복지용구 한도·구입·대여·이용방법',
  description: '노인장기요양보험 복지용구의 뜻, 연 160만원 한도, 구입과 대여 차이, 본인부담금, 제품 선택과 이용 절차를 쉽게 안내합니다.',
  keywords: ['복지용구', '장기요양 복지용구', '복지용구 한도', '복지용구 연간한도', '복지용구 구입', '복지용구 대여'],
  alternates: { canonical: '/guide/welfare-equipment' },
};

export default function WelfareEquipmentGuidePage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:5000';
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: '복지용구 가이드', item: `${baseUrl}/guide/welfare-equipment` },
    ],
  };

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: '복지용구란? 장기요양 복지용구 한도·구입·대여·이용방법',
    description: '장기요양 복지용구의 기본 개념과 연간 한도, 구입·대여 방식, 본인부담금 확인 방법을 정리한 안내입니다.',
    dateModified: '2026-09-12',
    mainEntityOfPage: `${baseUrl}/guide/welfare-equipment`,
  };

  return (
    <article className="section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      <nav aria-label="breadcrumb" className="muted" style={{ marginBottom: 16 }}>
        <Link href="/">홈</Link> · <span>복지용구 가이드</span>
      </nav>

      <p className="eyebrow">LONG-TERM CARE GUIDE</p>
      <h1>복지용구란?</h1>
      <p>장기요양 복지용구는 수급자의 일상생활과 신체활동을 지원하고 인지기능 유지·향상에 필요한 용구로, 기준에 맞는 제품을 가정에 설치하거나 제공하는 급여입니다.</p>

      <div className="content-card" style={{ marginTop: 28 }}>
        <h2>복지용구 연간 한도는 160만원</h2>
        <p>복지용구 급여의 연 한도액은 수급자 1인당 <strong>연간 160만원</strong>입니다. 이 한도는 공단부담금과 본인부담금을 합친 금액을 기준으로 하며, 한도를 초과하는 금액은 본인이 전액 부담합니다.</p>
        <p className="muted">적용기간은 최초 장기요양인정 유효기간 개시일부터 매 1년을 기준으로 합니다.</p>
      </div>

      <div className="content-card" style={{ marginTop: 20 }}>
        <h2>구입과 대여는 어떻게 다른가요?</h2>
        <p><strong>구입품목</strong>은 정해진 급여가격에 본인부담금을 부담하고 제품을 구입합니다.</p>
        <p><strong>대여품목</strong>은 제품을 일정 기간 빌려 사용하고 정해진 월 대여가격을 기준으로 본인부담금을 부담합니다.</p>
        <p>어떤 품목을 구입 또는 대여할 수 있는지는 수급자의 신체기능 상태와 장기요양 인정·욕구사항 등을 기준으로 공단이 정한 범위 안에서 확인해야 합니다.</p>
      </div>

      <div className="content-card" style={{ marginTop: 20 }}>
        <h2>본인부담금은 얼마인가요?</h2>
        <p>재가급여의 일반 본인부담률은 15%입니다. 감경 대상자는 감경률에 따라 실제 부담률이 달라질 수 있으며, 이 사이트에서는 사용자가 비교하기 쉽도록 <strong>15%·9%·6%</strong> 세 가지 금액만 표시합니다.</p>
        <Link className="button primary" href="/guide/copay">본인부담금 계산·안내 보기</Link>
      </div>

      <div className="content-card" style={{ marginTop: 20 }}>
        <h2>복지용구 이용 순서</h2>
        <ol>
          <li>장기요양 인정내용과 이용 가능한 복지용구 품목을 확인합니다.</li>
          <li>필요한 품목의 정상 유통 제품을 찾습니다.</li>
          <li>제품명·모델명·급여코드·급여가격이 일치하는지 확인합니다.</li>
          <li>규격·무게·재질·사용환경을 비교합니다.</li>
          <li>15%·9%·6% 기준 본인부담금을 확인합니다.</li>
          <li>복지용구사업소를 통해 실제 이용 가능 여부와 공급 조건을 최종 확인합니다.</li>
        </ol>
      </div>

      <div className="content-card" style={{ marginTop: 20 }}>
        <h2>제품을 고를 때 꼭 확인하세요</h2>
        <p>같은 품목이라도 크기, 무게, 접이 방식, 소재, 설치 조건과 사용 가능 햇수가 다를 수 있습니다. 단순히 가격이 낮은 제품보다 사용자의 신체상태와 실제 생활공간에 맞는 제품을 선택하는 것이 중요합니다.</p>
        <p>아톰케어 복지용구 사이트는 이로움의 현재 유통상태를 기준으로 단종·비유통·품절·일시품절 상품을 제외하고, 급여코드와 급여가격을 별도 자료로 교차 확인한 상품부터 공개합니다.</p>
      </div>

      <div className="content-card" style={{ marginTop: 20 }}>
        <h2>2026년 기준 확인 자료</h2>
        <p>복지용구 급여범위·급여기준과 제품별 급여가격은 변경될 수 있으므로 최신 공단 고시를 확인해야 합니다. 현재 사이트 상품 데이터는 2026년 9월 시행 제품목록을 포함한 최신 공개자료를 기준으로 계속 검증합니다.</p>
        <ul>
          <li><a href="https://www.nhis.or.kr/lm/lmxsrv/law/lawFullContent.do?SEQ=96" target="_blank" rel="noreferrer">국민건강보험공단 · 복지용구 급여범위 및 급여기준 등에 관한 고시</a></li>
          <li><a href="https://www.nhis.or.kr/lm/lmxsrv/law/lawListManager.do?LAWGROUP=2" target="_blank" rel="noreferrer">국민건강보험공단 · 장기요양보험 최신 고시 목록</a></li>
        </ul>
      </div>

      <div className="guide-block" style={{ marginTop: 28 }}>
        <div>
          <p className="eyebrow">FIND PRODUCTS</p>
          <h2>이제 실제 복지용구를 비교해보세요</h2>
          <p>정상 유통이 확인된 제품의 급여가격과 본인부담금, 규격을 한 번에 확인할 수 있습니다.</p>
        </div>
        <Link className="button primary" href="/products">복지용구 제품 찾기</Link>
      </div>
    </article>
  );
}
