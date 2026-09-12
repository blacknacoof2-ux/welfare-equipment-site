import CopayCalculator from '@/components/CopayCalculator';

const categories = [
  ['성인용보행기', '보행 안정과 이동을 돕는 대표 복지용구'],
  ['목욕의자', '욕실 낙상 위험을 줄이는 목욕 보조용품'],
  ['안전손잡이', '침실·욕실·현관 이동을 돕는 안전용품'],
  ['이동변기', '거동이 불편한 수급자의 배변 보조용품'],
  ['미끄럼방지용품', '미끄럼방지매트·액·양말 등'],
  ['욕창예방방석', '장시간 착석 시 압력 분산을 돕는 용품'],
  ['욕창예방매트리스', '침상 생활자의 압력 분산을 위한 용품'],
  ['지팡이', '일상 보행을 보조하는 이동 지원용품'],
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">장기요양 복지용구 전문 플랫폼</p>
          <h1>복지용구를 찾고, 비교하고,<br />본인부담금까지 한 번에</h1>
          <p>이로움 기준 정상 유통 제품을 확인하고, 단종·비유통·품절 제품은 제외합니다. 가격은 15%·9%·6% 본인부담금 중심으로 제공합니다.</p>
          <div className="hero-actions">
            <a className="button primary" href="#categories">복지용구 찾기</a>
            <a className="button secondary" href="#calculator">본인부담금 계산</a>
          </div>
        </div>
        <aside className="trust-card">
          <strong>상품 등록 원칙</strong>
          <ul>
            <li>이로움 정상 유통 상태 확인</li>
            <li>단종 · 비유통 · 품절 제외</li>
            <li>제품명 · 모델 · 급여코드 교차검증</li>
            <li>15% · 9% · 6% 본인부담금 표시</li>
          </ul>
        </aside>
      </section>

      <section className="section" id="categories">
        <div className="section-heading">
          <p className="eyebrow">CATEGORY</p>
          <h2>필요한 복지용구부터 찾아보세요</h2>
        </div>
        <div className="category-grid">
          {categories.map(([name, description]) => (
            <a className="category-card" href={`/products?category=${encodeURIComponent(name)}`} key={name}>
              <span>{name}</span>
              <p>{description}</p>
              <b>제품 보기 →</b>
            </a>
          ))}
        </div>
      </section>

      <div className="section" id="calculator"><CopayCalculator /></div>

      <section className="section guide-block">
        <div>
          <p className="eyebrow">GUIDE</p>
          <h2>급여가격보다 중요한 건 실제 본인부담금입니다</h2>
          <p>일반 대상자는 15%, 감경 대상자는 9% 또는 6% 기준으로 확인할 수 있습니다. 제품별 급여가격과 함께 실제 부담 수준을 이해하기 쉽게 정리합니다.</p>
        </div>
        <a className="button primary" href="/guide/copay">본인부담금 안내 보기</a>
      </section>
    </>
  );
}
