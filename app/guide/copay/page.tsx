import type { Metadata } from 'next';
import CopayCalculator from '@/components/CopayCalculator';

export const metadata: Metadata = {
  title: '복지용구 본인부담금 15%·9%·6% 계산·안내',
  description: '장기요양 복지용구의 일반 15%, 감경 9%·6% 본인부담금 계산 방법과 10원 미만 끝수 처리, 제품 가격 확인 방법을 안내합니다.',
  keywords: ['복지용구 본인부담금', '복지용구 15%', '복지용구 9%', '복지용구 6%', '장기요양 본인부담금 계산'],
  alternates: { canonical: '/guide/copay' },
};

export default function CopayGuidePage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: '복지용구 가이드', item: `${baseUrl}/guide/welfare-equipment` },
      { '@type': 'ListItem', position: 3, name: '본인부담금', item: `${baseUrl}/guide/copay` },
    ],
  };

  return (
    <section className="section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <nav aria-label="breadcrumb" className="muted" style={{ marginBottom: 16 }}>
        <a href="/">홈</a> · <a href="/guide/welfare-equipment">복지용구 가이드</a> · <span>본인부담금</span>
      </nav>

      <p className="eyebrow">LONG-TERM CARE GUIDE</p>
      <h1>복지용구 본인부담금 15%·9%·6%</h1>
      <p className="muted">복지용구는 장기요양 재가급여에 해당하며, 이 사이트에서는 사용자가 제품 가격을 비교하기 쉽도록 일반 15%와 감경 적용 시 9%·6% 기준만 표시합니다.</p>

      <div className="content-card" style={{ marginTop: 28 }}>
        <h2>본인부담률</h2>
        <table className="price-table">
          <thead><tr><th>구분</th><th>사이트 표시 기준</th></tr></thead>
          <tbody>
            <tr><td>일반 대상자</td><td><strong>15%</strong></td></tr>
            <tr><td>감경 적용</td><td><strong>9%</strong></td></tr>
            <tr><td>감경 적용</td><td><strong>6%</strong></td></tr>
          </tbody>
        </table>
        <p className="muted">개인별 실제 적용률은 장기요양 인정내용과 공단 적용사항을 확인해야 합니다. 사용자 요청에 따라 이 사이트에서는 0% 금액은 상품 가격표에 표시하지 않습니다.</p>
      </div>

      <div className="content-card" style={{ marginTop: 20 }}>
        <h2>계산 예시</h2>
        <p>급여가격이 200,000원인 제품이라면 일반 15%는 30,000원, 9%는 18,000원, 6%는 12,000원입니다.</p>
        <p>본인부담금 등 장기요양 청구 금액에 10원 미만의 끝수가 있으면 해당 끝수는 계산하지 않는 공단 처리기준을 반영해 사이트 계산기도 10원 단위로 표시합니다.</p>
      </div>

      <div style={{ marginTop: 28 }}><CopayCalculator /></div>

      <div className="content-card" style={{ marginTop: 28 }}>
        <h2>제품별 실제 금액 확인</h2>
        <p>같은 품목이라도 제품별 급여가격이 다르므로, 모델명과 급여코드를 확인한 다음 해당 제품의 15%·9%·6% 금액을 비교하는 것이 정확합니다.</p>
        <a className="button primary" href="/products">검증 완료 제품 검색</a>
      </div>

      <div className="content-card" style={{ marginTop: 20 }}>
        <h2>공식 기준 출처</h2>
        <ul>
          <li><a href="https://www.nhis.or.kr/static/html/wbda/c/wbdac05.html" target="_blank" rel="noreferrer">국민건강보험공단 · 장기요양 본인부담 안내</a></li>
          <li><a href="https://www.nhis.or.kr/lm/lmxsrv/law/lawListManager.do?LAWGROUP=2" target="_blank" rel="noreferrer">국민건강보험공단 · 장기요양보험 최신 법령·고시</a></li>
        </ul>
      </div>
    </section>
  );
}
