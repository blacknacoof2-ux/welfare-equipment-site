import type { Metadata } from 'next';
import ProductCard from '@/components/ProductCard';
import { getBenefitMode, publishedProducts, type BenefitMode } from '@/lib/products';

export const metadata: Metadata = {
  title: '복지용구 제품 찾기',
  description: '정상 유통이 확인된 장기요양 복지용구를 구입·대여로 구분해 찾고, 제품별 15%·9%·6% 본인부담금을 확인하세요.',
  alternates: { canonical: '/products' },
};

const validModes = new Set<BenefitMode>(['PURCHASE', 'RENTAL', 'PURCHASE_OR_RENTAL']);

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; mode?: string }>;
}) {
  const { category, q, mode } = await searchParams;
  const query = q?.trim().toLocaleLowerCase('ko-KR') ?? '';
  const selectedMode = mode && validModes.has(mode as BenefitMode) ? mode as BenefitMode : undefined;

  const filtered = publishedProducts.filter((product) => {
    const categoryMatches = !category || product.category === category;
    const modeMatches = !selectedMode || getBenefitMode(product) === selectedMode;
    if (!categoryMatches || !modeMatches) return false;
    if (!query) return true;

    return [product.name, product.model, product.manufacturer, product.benefitCode, product.category]
      .some((value) => value.toLocaleLowerCase('ko-KR').includes(query));
  });

  const title = selectedMode === 'RENTAL'
    ? '대여 복지용구'
    : selectedMode === 'PURCHASE_OR_RENTAL'
      ? '구입·대여 가능 복지용구'
      : selectedMode === 'PURCHASE'
        ? '구입 복지용구'
        : category
          ? `${category} 복지용구`
          : '복지용구 제품 찾기';

  return (
    <section className="section">
      <p className="eyebrow">PRODUCTS</p>
      <h1>{title}</h1>
      <p className="muted">정상 유통이 확인된 상품만 노출하며, 구입·대여 여부와 제품 이미지를 한 화면에서 확인할 수 있습니다.</p>

      <div className="mode-filter-tabs" aria-label="구입 대여 구분">
        <a className={!selectedMode ? 'active' : ''} href="/products">전체</a>
        <a className={selectedMode === 'PURCHASE' ? 'active purchase' : ''} href="/products?mode=PURCHASE">🛒 구입</a>
        <a className={selectedMode === 'RENTAL' ? 'active rental' : ''} href="/products?mode=RENTAL">🔁 대여</a>
        <a className={selectedMode === 'PURCHASE_OR_RENTAL' ? 'active mixed' : ''} href="/products?mode=PURCHASE_OR_RENTAL">↔️ 구입·대여</a>
      </div>

      <form action="/products" method="get" className="content-card" style={{ marginTop: 20, marginBottom: 28 }}>
        {category && <input type="hidden" name="category" value={category} />}
        {selectedMode && <input type="hidden" name="mode" value={selectedMode} />}
        <label htmlFor="product-search"><strong>제품 검색</strong></label>
        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          <input
            id="product-search"
            name="q"
            defaultValue={q ?? ''}
            placeholder="제품명, 모델명, 제조사, 급여코드"
            style={{ flex: '1 1 280px', padding: '13px 14px', border: '1px solid #d6d9df', borderRadius: 10, fontSize: 16 }}
          />
          <button className="button primary" type="submit">검색</button>
        </div>
      </form>

      <p><strong>현재 {filtered.length}개 제품</strong></p>

      {filtered.length === 0 ? (
        <div className="empty-state">검색 조건과 일치하는 검증 완료 상품이 없습니다.</div>
      ) : (
        <div className="product-list">
          {filtered.map((product) => <ProductCard product={product} showCode key={product.slug} />)}
        </div>
      )}
    </section>
  );
}
