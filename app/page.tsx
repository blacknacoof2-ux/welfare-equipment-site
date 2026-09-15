import CopayCalculator from '@/components/CopayCalculator';
import ProductCard from '@/components/ProductCard';
import { categories } from '@/lib/all-categories';
import { getCategoryEmoji } from '@/lib/category-ui';
import { filterBrowseProducts } from '@/lib/product-visibility';
import { getBenefitMode, publishedProducts } from '@/lib/products';

export default function HomePage() {
  const browseProducts = filterBrowseProducts(publishedProducts);
  const purchaseProducts = browseProducts.filter((product) => getBenefitMode(product) === 'PURCHASE');
  const rentalProducts = browseProducts.filter((product) => getBenefitMode(product) === 'RENTAL');
  const mixedProducts = browseProducts.filter((product) => getBenefitMode(product) === 'PURCHASE_OR_RENTAL');
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:5000';

  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '아톰케어랩 복지용구',
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
          <h1>복지용구를 찾고,<br />비교하고,<br />본인부담금까지 한 번에</h1>
          <p>구입 복지용구와 대여 복지용구를 한눈에 구분하고, 제품별 15%·9%·6% 본인부담금과 규격을 확인하세요.</p>

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
            <a className="button purchase-button" href="#purchase">🛒 구입 복지용구</a>
            <a className="button rental-button" href="#rental">🔁 대여 복지용구</a>
            <a className="button secondary" href="#calculator">본인부담금 계산</a>
          </div>
        </div>
        <aside className="trust-card">
          <strong>현재 공개 복지용구</strong>
          <div className="home-mode-summary">
            <a href="#purchase"><span>🛒 구입</span><b>{purchaseProducts.length}개</b></a>
            <a href="#rental"><span>🔁 대여</span><b>{rentalProducts.length}개</b></a>}
            {mixedProducts.length > 0 && <a href="#mixed"><span>↔️ 구입·대여</span><b>{mixedProducts.length}개</b></a>}
          </div>
          <p className="muted">단종·비유통·품절·일시품절은 공개 대상에서 제외합니다.</p>
        </aside>
      </section>

      <section className="section" id="categories">
        <div className="section-heading">
          <p className="eyebrow">CATEGORY</p>
          <h2>품목별로 바로 찾아보세요</h2>
          <p className="muted">글자만 나열하지 않고 품목마다 직관적인 아이콘을 함께 표시합니다.</p>
        </div>
        <div className="category-grid">
          {categories.map((category) => {
            const count = browseProducts.filter((product) => product.category === category.name).length;
            return (
              <a className="category-card" href={`/categories/${category.slug}`} key={category.slug}>
                <span className="category-emoji" aria-hidden="true">{getCategoryEmoji(category.name)}</span>
                <strong className="category-name">{category.name}</strong>
                <p>{category.shortDescription}</p>
                <b>{count > 0 ? `검증상품 ${count}개 · ` : '검증 진행중 · '}제품 보기 →</b>
              </a>
            );
          })}
        </div>
      </section>

      <section className="section mode-section purchase-section" id="purchase">
        <div className="mode-section-heading">
          <div>
            <p className="eyebrow">PURCHASE</p>
            <h2><span aria-hidden="true">🛒</span> 구입 복지용구</h2>
            <p className="muted">급여 기준에 따라 구입하여 사용하는 복지용구입니다. 제품 카드에서 실제 본인부담금을 바로 확인할 수 있습니다.</p>
          </div>
          <a className="button secondary" href="/products?mode=PURCHASE">구입 제품 전체보기</a>
        </div>
        <div className="product-list">
          {purchaseProducts.slice(0, 9).map((product) => <ProductCard product={product} key={product.slug} />)}
        </div>
      </section>

      <section className="section mode-section rental-section" id="rental">
        <div className="mode-section-heading">
          <div>
            <p className="eyebrow">RENTAL</p>
            <h2><span aria-hidden="true">🔁</span> 대여 복지용구</h2>
            <p className="muted">월 대여 급여가격을 기준으로 15%·9%·6% 월 본인부담금을 표시합니다.</p>
          </div>
          <a className="button secondary" href="/products?mode=RENTAL">대여 제품 전체보기</a>
        </div>
        {rentalProducts.length > 0 ? (
          <div className="product-list">
            {rentalProducts.slice(0, 9).map((product) => <ProductCard product={product} key={product.slug} />)}
          </div>
        ) : (
          <div className="empty-state">현재 검증 완료된 대여 복지용구를 등록 중입니다.</div>
        )}
      </section>

      {mixedProducts.length > 0 && (
        <section className="section mode-section mixed-section" id="mixed">
          <div className="mode-section-heading">
            <div>
              <p className="eyebrow">PURCHASE · RENTAL</p>
              <h2><span aria-hidden="true">↔️</span> 구입·대여 가능 복지용구</h2>
            </div>
            <a className="button secondary" href="/products?mode=PURCHASE_OR_RENTAL">전체보기</a>
          </div>
          <div className="product-list">
            {mixedProducts.slice(0, 9).map((product) => <ProductCard product={product} key={product.slug} />)}
          </div>
        </section>
      )}

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