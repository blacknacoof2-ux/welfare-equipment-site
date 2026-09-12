import type { Metadata } from 'next';
import CopayCalculator from '@/components/CopayCalculator';

export const metadata: Metadata = {
  title: '복지용구 본인부담금 15%·9%·6% 안내',
  description: '장기요양 복지용구의 일반 15%, 감경 9%·6% 본인부담금 계산 방법과 제품 가격 확인 방법을 안내합니다.',
  alternates: { canonical: '/guide/copay' },
};

export default function CopayGuidePage() {
  return (
    <section className="section">
      <p className="eyebrow">LONG-TERM CARE GUIDE</p>
      <h1>복지용구 본인부담금 안내</h1>
      <p className="muted">복지용구는 장기요양 기타재가급여로 제공되며, 이 사이트에서는 일반 15%와 감경 9%·6% 기준을 중심으로 가격을 표시합니다.</p>

      <div className="content-card" style={{ marginTop: 28 }}>
        <h2>본인부담률</h2>
        <table className="price-table">
          <thead><tr><th>구분</th><th>표시 기준</th></tr></thead>
          <tbody>
            <tr><td>일반 대상자</td><td><strong>15%</strong></td></tr>
            <tr><td>감경 대상자</td><td><strong>9%</strong></td></tr>
            <tr><td>감경 대상자</td><td><strong>6%</strong></td></tr>
          </tbody>
        </table>
        <p className="muted">본인부담금은 제품 급여가격에 해당 비율을 적용하며, 10원 미만 끝수는 계산하지 않는 방식으로 사이트에 표시합니다. 실제 적용 여부는 개인별 장기요양 인정내용을 확인해야 합니다.</p>
      </div>

      <div style={{ marginTop: 28 }}><CopayCalculator /></div>
    </section>
  );
}
