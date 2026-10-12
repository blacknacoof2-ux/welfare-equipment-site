import type { Metadata } from 'next';
import Link from 'next/link';
import { getCopays, publishedProducts } from '@/lib/products';

export const metadata: Metadata = {
  title: 'WAG02 vs SPORTY 성인용보행기 비교 | 가격·무게·본인부담금',
  description: 'WAG02와 SPORTY 성인용보행기의 급여가격, 15%·9%·6% 본인부담금, 무게, 규격, 재질을 한눈에 비교하세요.',
  alternates: { canonical: '/compare/wag02-vs-sporty' },
};

const formatter = new Intl.NumberFormat('ko-KR');

export default function WalkerComparisonPage() {
  const wag02 = publishedProducts.find((product) => product.model === 'WAG02');
  const sporty = publishedProducts.find((product) => product.model === 'SPORTY');

  if (!wag02 || !sporty) {
    return <section className="section"><div className="empty-state">비교 대상 제품 검증이 완료되지 않았습니다.</div></section>;
  }

  const wagCopays = getCopays(wag02.benefitPrice);
  const sportyCopays = getCopays(sporty.benefitPrice);
  const priceDifference = Math.abs(wag02.benefitPrice - sporty.benefitPrice);
  const lighter = wag02.weightKg !== undefined && sporty.weightKg !== undefined
    ? (wag02.weightKg <= sporty.weightKg ? wag02 : sporty)
    : null;
  const weightDifference = lighter && wag02.weightKg !== undefined && sporty.weightKg !== undefined
    ? Math.abs(wag02.weightKg - sporty.weightKg)
    : null;

  return (
    <section className="section">
      <nav aria-label="breadcrumb" className="muted" style={{ marginBottom: 16 }}>
        <Link href="/">홈</Link> · <Link href="/categories/adult-walker">성인용보행기</Link> · <span>WAG02·SPORTY 비교</span>
      </nav>
      <p className="eyebrow">PRODUCT COMPARISON</p>
      <h1>WAG02 vs SPORTY 성인용보행기 비교</h1>
      <p>두 제품 모두 현재 정상 유통 상태와 급여정보가 교차 확인된 성인용보행기입니다. 가격뿐 아니라 무게와 소재, 사용환경을 함께 비교하세요.</p>

      <div className="content-card" style={{ marginTop: 24, overflowX: 'auto' }}>
        <table className="price-table">
          <thead>
            <tr><th>비교항목</th><th>WAG02</th><th>SPORTY</th></tr>
          </thead>
          <tbody>
            <tr><th>제조·공급사</th><td>{wag02.manufacturer}</td><td>{sporty.manufacturer}</td></tr>
            <tr><th>급여코드</th><td>{wag02.benefitCode}</td><td>{sporty.benefitCode}</td></tr>
            <tr><th>급여가격</th><td>{formatter.format(wag02.benefitPrice)}원</td><td>{formatter.format(sporty.benefitPrice)}원</td></tr>
            <tr><th>본인부담 15%</th><td>{formatter.format(wagCopays.copay15)}원</td><td>{formatter.format(sportyCopays.copay15)}원</td></tr>
            <tr><th>본인부담 9%</th><td>{formatter.format(wagCopays.copay9)}원</td><td>{formatter.format(sportyCopays.copay9)}원</td></tr>
            <tr><th>본인부담 6%</th><td>{formatter.format(wagCopays.copay6)}원</td><td>{formatter.format(sportyCopays.copay6)}원</td></tr>
            <tr><th>중량</th><td>{wag02.weightKg}kg</td><td>{sporty.weightKg}kg</td></tr>
            <tr><th>재질</th><td>{wag02.material}</td><td>{sporty.material}</td></tr>
            <tr><th>규격</th><td>{wag02.dimensions}</td><td>{sporty.dimensions}</td></tr>
            <tr><th>구매 기준</th><td>{wag02.purchaseCycleYears}년 / 최대 {wag02.maxQuantityPerCycle}개</td><td>{sporty.purchaseCycleYears}년 / 최대 {sporty.maxQuantityPerCycle}개</td></tr>
          </tbody>
        </table>
      </div>

      <div className="content-card" style={{ marginTop: 20 }}>
        <h2>급여가격·무게 차이부터 확인하세요</h2>
        <p>현재 공개·검증된 제품 원장의 급여가격 차이는 <strong>{formatter.format(priceDifference)}원</strong>입니다. 본인부담금은 제품별 급여가격과 실제 수급자 부담률에 따라 달라집니다.</p>
        {lighter && weightDifference !== null && (
          <p>확인된 제품 중 <strong>{lighter.model}</strong>의 무게가 <strong>{weightDifference.toFixed(2)}kg</strong> 더 가볍습니다. 실제 휴대성과 사용 안정성은 접이 구조 및 사용자 조건도 함께 확인해야 합니다.</p>
        )}
        <p className="muted">가격과 무게 차이는 현재 등록된 모델 정보로 계산됩니다. 구매 전 급여가격·유통 상태·제품 규격을 다시 확인하세요.</p>
      </div>

      <div className="category-grid" style={{ marginTop: 28 }}>
        <div className="content-card">
          <h2>WAG02가 눈에 띄는 점</h2>
          <p>4.9kg으로 두 제품 중 더 가볍고, 급여가격과 본인부담금도 더 낮습니다. 이동·보관 시 무게를 중요하게 보는 경우 우선 비교할 가치가 있습니다.</p>
          <a href={`/products/${wag02.slug}`}>WAG02 상세보기 →</a>
        </div>
        <div className="content-card">
          <h2>SPORTY가 눈에 띄는 점</h2>
          <p>카본 소재를 사용하고 좌면 높이 정보가 명확한 롤레이터형 제품입니다. 제품 구조와 착석 편의성을 함께 보는 경우 상세 규격을 비교해보세요.</p>
          <a href={`/products/${sporty.slug}`}>SPORTY 상세보기 →</a>
        </div>
      </div>

      <div className="content-card" style={{ marginTop: 28 }}>
        <h2>이 비교를 활용하는 방법</h2>
        <ol>
          <li>사용자에게 필요한 손잡이 높이와 제품 폭을 먼저 확인합니다.</li>
          <li>급여가격뿐 아니라 실제 적용되는 15%·9%·6% 본인부담금 중 해당 금액을 비교합니다.</li>
          <li>차량 적재·접이·좌석 필요 여부는 상세 규격과 실물을 함께 확인합니다.</li>
        </ol>
        <div className="category-link-cloud">
          <Link href="/categories/adult-walker">성인용보행기 전체 비교</Link>
          <Link href="/guide/welfare-equipment">장기요양 복지용구 이용 가이드</Link>
          <Link href="/guide/copay">급여 본인부담금 안내</Link>
        </div>
      </div>

      <div className="content-card" style={{ marginTop: 28 }}>
        <h2>선택 시 주의사항</h2>
        <p>표의 수치만으로 적합성을 단정하기보다는 사용자의 키, 보행능력, 손의 브레이크 조작 능력, 실내외 사용 비중, 차량 적재 여부를 함께 확인해야 합니다. 실제 구매 전에는 최신 유통 상태와 급여 가능 여부를 다시 확인합니다.</p>
      </div>
    </section>
  );
}
