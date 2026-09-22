import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '장기요양 복지용구란? 2026 한도·본인부담금·구입·대여',
  description: '2026년 장기요양 복지용구의 대상, 연 160만원 한도, 구입·대여 방식, 본인부담금과 성인용보행기·목욕의자·전동침대·수동휠체어 이용방법을 안내합니다.',
  keywords: ['복지용구', '장기요양 복지용구', '복지용구 한도', '복지용구 연간한도', '복지용구 구입', '복지용구 대여', '복지용구 본인부담금'],
  alternates: { canonical: '/guide/welfare-equipment' },
};

const faqs = [
  {
    question: '장기요양 복지용구는 누가 이용할 수 있나요?',
    answer: '노인장기요양보험 수급자 가운데 재가에서 생활하는 1~5등급 및 인지지원등급 수급자가 대상이 될 수 있습니다. 실제 이용 가능 품목은 장기요양 인정내용과 공단 확인 범위를 확인해야 합니다.',
  },
  {
    question: '복지용구 연간 한도는 얼마인가요?',
    answer: '복지용구 급여의 연 한도액은 수급자 1인당 연간 160만원이며 공단부담금과 본인부담금을 합한 금액을 기준으로 적용됩니다.',
  },
  {
    question: '복지용구는 모두 구입할 수 있나요?',
    answer: '아닙니다. 품목에 따라 구입, 대여 또는 구입·대여 가능 품목으로 구분되므로 품목별 급여방식을 확인해야 합니다.',
  },
  {
    question: '복지용구 본인부담금은 어떻게 확인하나요?',
    answer: '제품별 급여가격 또는 월 대여 급여가격에 대상자별 부담률을 적용합니다. 이 사이트는 비교 편의를 위해 15%·9%·6% 금액을 제품별로 표시합니다.',
  },
];

export default function WelfareEquipmentGuidePage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:5000';
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: '장기요양 복지용구 가이드', item: `${baseUrl}/guide/welfare-equipment` },
    ],
  };

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: '장기요양 복지용구란? 2026 한도·본인부담금·구입·대여',
    description: '장기요양 복지용구의 대상, 연간 한도, 구입·대여 방식, 본인부담금 확인 방법을 정리한 안내입니다.',
    dateModified: '2026-09-22',
    mainEntityOfPage: `${baseUrl}/guide/welfare-equipment`,
    author: { '@type': 'Organization', name: '주식회사 아톰케어' },
    publisher: { '@type': 'Organization', name: '주식회사 아톰케어' },
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  return (
    <article className="section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <nav aria-label="breadcrumb" className="muted" style={{ marginBottom: 16 }}>
        <Link href="/">홈</Link> · <span>장기요양 복지용구 가이드</span>
      </nav>

      <p className="eyebrow">2026 LONG-TERM CARE GUIDE</p>
      <h1>장기요양 복지용구란?</h1>
      <p>장기요양 복지용구는 수급자의 일상생활과 신체활동을 지원하기 위해 급여 기준에 따라 구입하거나 대여할 수 있는 용구입니다. 제품을 고르기 전에 이용 대상, 연간 한도, 품목별 급여방식과 본인부담금을 함께 확인하는 것이 중요합니다.</p>
      <p className="muted">최종 검토일: 2026년 9월 22일</p>

      <div className="content-card" style={{ marginTop: 28 }}>
        <h2>누가 복지용구를 이용할 수 있나요?</h2>
        <p>노인장기요양보험 수급자 중 재가에서 생활하는 <strong>1~5등급 및 인지지원등급</strong> 수급자가 대상이 될 수 있습니다. 시설급여를 이용하는 경우에는 복지용구 이용이 제한될 수 있으며, 실제 이용 가능한 품목은 장기요양 인정내용과 공단 확인 범위를 기준으로 확인해야 합니다.</p>
      </div>

      <div className="content-card" style={{ marginTop: 20 }}>
        <h2>복지용구 연간 한도는 160만원</h2>
        <p>복지용구 급여의 연 한도액은 수급자 1인당 <strong>연간 160만원</strong>입니다. 이 한도는 공단부담금과 본인부담금을 합친 금액을 기준으로 하며, 한도를 초과하는 금액은 본인이 전액 부담합니다.</p>
        <p className="muted">적용기간은 장기요양 인정 유효기간 개시일을 기준으로 매 1년 단위로 확인합니다.</p>
      </div>

      <div className="content-card" style={{ marginTop: 20 }}>
        <h2>구입과 대여는 어떻게 다른가요?</h2>
        <p><strong>구입품목</strong>은 정해진 급여가격을 기준으로 본인부담금을 부담하고 제품을 구입합니다.</p>
        <p><strong>대여품목</strong>은 제품을 일정 기간 빌려 사용하고 정해진 월 대여 급여가격을 기준으로 본인부담금을 부담합니다.</p>
        <p>품목에 따라 구입 또는 대여 방식이 정해져 있으므로 제품 가격만 보는 것이 아니라 해당 품목의 급여방식과 사용 가능 햇수, 급여한도를 함께 확인해야 합니다.</p>
      </div>

      <div className="content-card" style={{ marginTop: 20 }}>
        <h2>본인부담금은 얼마인가요?</h2>
        <p>일반 대상자의 대표적인 본인부담률은 15%이며 감경 대상자는 조건에 따라 실제 부담률이 달라질 수 있습니다. 이 사이트에서는 제품 간 비교가 쉽도록 <strong>15%·9%·6%</strong> 세 가지 금액을 제품별로 표시합니다.</p>
        <Link className="button primary" href="/guide/copay">본인부담금 계산·안내 보기</Link>
      </div>

      <div className="content-card" style={{ marginTop: 20 }}>
        <h2>많이 찾는 장기요양 복지용구</h2>
        <p>아래 품목 페이지에서 현재 공개된 급여제품의 가격, 본인부담금, 규격과 급여코드를 직접 비교할 수 있습니다.</p>
        <div className="category-link-cloud">
          <Link href="/categories/adult-walker">성인용보행기 가격·본인부담금 비교</Link>
          <Link href="/categories/shower-chair">목욕의자 가격·본인부담금 비교</Link>
          <Link href="/categories/electric-bed">전동침대 대여가격·월 본인부담금</Link>
          <Link href="/categories/manual-wheelchair">수동휠체어 대여가격·월 본인부담금</Link>
        </div>
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
        <p>아톰케어 복지용구 사이트는 현재 유통상태를 확인하고 급여코드와 급여가격을 별도 자료로 교차 확인한 상품부터 공개합니다.</p>
      </div>

      <div style={{ marginTop: 32 }}>
        <p className="eyebrow">FAQ</p>
        <h2>장기요양 복지용구 자주 묻는 질문</h2>
        <div className="product-list">
          {faqs.map((faq) => (
            <div className="content-card" key={faq.question}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="content-card" style={{ marginTop: 20 }}>
        <h2>2026년 기준 확인 자료</h2>
        <p>복지용구 급여범위·급여기준과 제품별 급여가격은 변경될 수 있으므로 최신 공단 고시와 공공기관 안내를 함께 확인해야 합니다.</p>
        <ul>
          <li><a href="https://www.nhis.or.kr/lm/lmxsrv/law/lawFullContent.do?SEQ=1603" target="_blank" rel="noreferrer">국민건강보험공단 · 복지용구 품목별 제품목록 및 급여비용 등에 관한 고시</a></li>
          <li><a href="https://www.knat.go.kr/knw/home/knat_DB/assist_detail.php?assist_biz_idx=3" target="_blank" rel="noreferrer">국립재활원 중앙보조기기센터 · 노인장기요양보험 복지용구 지급사업</a></li>
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
