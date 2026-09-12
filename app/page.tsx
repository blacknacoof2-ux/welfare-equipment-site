import CopayCalculator from '@/components/CopayCalculator';
import { ProductImage } from '@/components/ProductMedia';
import { categories } from '@/lib/all-categories';
import { getCopays, getPriceSuffix, publishedProducts } from '@/lib/products';

const formatter = new Intl.NumberFormat('ko-KR');

export default function HomePage() {
  const featuredProducts = publishedProducts.slice(0, 6);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:5000';
  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '아톰케어 복지용구',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/products?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} />

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">장기요양 복지용구 전문 플랫폼</p>
          <h1>복지용구를 찾고, 비교하고,<br />본인부담금까지 한 번에</h1>
          <p>이로움 기준 정상 유통 제품을 확인하고, 단종·비유통·품절·일시품절 제품은 제외합니다. 가격은 15%·9%·6% 본인부담금 중심으로 제공합니다.</p>

          <form action="/products" method="get" style={{ marginTop: 22 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                name="q"
                aria-label="복지용구 검색"
                placeholder="제품명·모델명·급여코드 검색"
                style={{ flex: '1 1 280px', padding: '14px 16px', border: '1px solid #d6d9df', borderRadius: 10, fontSize: 16 }}
              />
              <button className="button primary" type="submit">제품 검색</button>
            </div>
          </form>

          <div className="hero-actions">
            <a className="button secondary" href="#categories">카테고리 보기</a>
            <a className="button secondary" href="#calculator">본인부담금 계산</a>
          </div>
        </div>
        <aside className="trust-card">
          <strong>상품 등록 원칙</strong>
          <ul>
            <li>이로움 정상 유통 상태 확인</li>
            <li>단종 · 비유통 · 품절 · 일시품절 제외</li>
            <li>제품명 · 모델 · 급여코드 교차검증</li>
            <li>15% · 9% · 6% 본인부담금 표시</li>
          </ul>
          <p className="muted">현재 검증 공개 상품 <strong>{publishedProducts.length}개</strong></p>
        </aside>
      </section>

      <section className="section" id="categories">
        <div className="section-heading">
          <p className="eyebrow">CATEGORY</p>
          <h2>필요한 복지용구부터 찾아보세요</h2>
          <p className="muted">2026년 공단 급여대상 중 현재 제품이 존재하는 주요 구입·대여·구입/대여 품목을 기준으로 구성합니다.</p>
        </div>
        <div className="category-grid">
          {categories.map((category) => {
            const count = publishedProducts.filter((product) => product.category === category.name).length;
            return (
              <a className="category-card" href={`/categories/${category.slug}`} key={category.slug}>
                <span>{category.name}</span>
                <p>{category.shortDescription}</p>
                <b>{count > 0 ? `검증상품 ${count}개 · ` : '검증 진행중 · '}제품 보기 →</b>
              </a>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">VERIFIED</p>
          <h2>검증 완료 복지용구</h2>
          <p className="muted">유통상태·급여가격·급여코드를 교차 확인한 상품부터 공개합니다.</p>
        </div>
        <div className="product-list">
          {featuredProducts.map((product) => {
            const copays = getCopays(product.benefitPrice);
            const suffix = getPriceSuffix(product);
            return (
              <a className="content-card product-card" href={`/products/${product.slug}`} key={product.slug}>
                <ProductImage product={product} />
                <div className="product-card-body">
                  <small>{product.category}</small>
                  <h2>{product.name}</h2>
                  <p>{product.manufacturer}</p>
                  <strong>본인부담금 {formatter.format(copays.copay6)}원{suffix}부터</strong>
                  <p className="muted">15% {formatter.format(copays.copay15)}원{suffix} · 9% {formatter.format(copays.copay9)}원{suffix} · 6% {formatter.format(copays.copay6)}원{suffix}</p>
                </div>
              </a>
            );
          })}
        </div>
        <div style={{ marginTop: 20 }}>
          <a className="button primary" href="/products">전체 검증상품 보기</a>
        </div>
      </section>

      <div className="section" id="calculator"><CopayCalculator /></div>

      <section className="section guide-block">
        <div>
          <p className="eyebrow">GUIDE</p>
          <h2>급여가격보다 중요한 건 실제 본인부담금입니다</h2>
          <p>일반 대상자는 15%, 감경 대상자는 9% 또는 6% 기준으로 확인할 수 있습니다. 제품별 급여가격 또는 월 대여가격과 함께 실제 부담 수준을 이해하기 쉽게 정리합니다.</p>
        </div>
        <a className="button primary" href="/guide/copay">본인부담금 안내 보기</a>
      </section>
    </>
  );
}
