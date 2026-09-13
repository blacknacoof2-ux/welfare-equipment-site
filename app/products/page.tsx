import type { Metadata } from 'next';
import ProductCard from '@/components/ProductCard';
import { categories } from '@/lib/all-categories';
import { getBenefitMode, publishedProducts, type BenefitMode } from '@/lib/products';

export const metadata: Metadata = {
  title: '복지용구 제품 찾기',
  description: '정상 유통이 확인된 장기요양 복지용구를 품목·구입·대여로 구분해 찾고, 제품별 15%·9%·6% 본인부담금을 확인하세요.',
  alternates: { canonical: '/products' },
};

const validModes = new Set<BenefitMode>(['PURCHASE', 'RENTAL', 'PURCHASE_OR_RENTAL']);
const PAGE_SIZE = 36;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; mode?: string; page?: string }>;
}) {
  const { category, q, mode, page } = await searchParams;
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

  const requestedPage = Number.parseInt(page ?? '1', 10);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), totalPages)
    : 1;
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const activeCategories = categories.filter((item) =>
    publishedProducts.some((product) => product.category === item.name),
  );

  const makeHref = ({ nextMode = selectedMode, nextPage = 1 }: { nextMode?: BenefitMode | null; nextPage?: number } = {}) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (q?.trim()) params.set('q', q.trim());
    if (nextMode) params.set('mode', nextMode);
    if (nextPage > 1) params.set('page', String(nextPage));
    const queryString = params.toString();
    return queryString ? `/products?${queryString}` : '/products';
  };

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
      <p className="muted">정상 유통이 확인된 상품만 노출하며, 품목·구입·대여 여부와 15%·9%·6% 본인부담금을 한 화면에서 확인할 수 있습니다.</p>

      <div className="mode-filter-tabs" aria-label="구입 대여 구분">
        <a className={!selectedMode ? 'active' : ''} href={makeHref({ nextMode: null })}>전체</a>
        <a className={selectedMode === 'PURCHASE' ? 'active purchase' : ''} href={makeHref({ nextMode: 'PURCHASE' })}>🛒 구입</a>
        <a className={selectedMode === 'RENTAL' ? 'active rental' : ''} href={makeHref({ nextMode: 'RENTAL' })}>🔁 대여</a>
        <a className={selectedMode === 'PURCHASE_OR_RENTAL' ? 'active mixed' : ''} href={makeHref({ nextMode: 'PURCHASE_OR_RENTAL' })}>↔️ 구입·대여</a>
      </div>

      <form action="/products" method="get" className="content-card product-search-panel">
        {selectedMode && <input type="hidden" name="mode" value={selectedMode} />}
        <div className="product-search-fields">
          <label>
            <strong>품목</strong>
            <select name="category" defaultValue={category ?? ''}>
              <option value="">전체 품목</option>
              {activeCategories.map((item) => {
                const count = publishedProducts.filter((product) => product.category === item.name).length;
                return <option value={item.name} key={item.slug}>{item.name} ({count})</option>;
              })}
            </select>
          </label>
          <label className="product-search-query" htmlFor="product-search">
            <strong>제품 검색</strong>
            <input
              id="product-search"
              name="q"
              defaultValue={q ?? ''}
              placeholder="제품명, 모델명, 제조사, 급여코드"
            />
          </label>
          <button className="button primary" type="submit">검색</button>
        </div>
      </form>

      <div className="catalog-result-summary">
        <p><strong>검색 결과 {filtered.length}개</strong> <span className="muted">· 전체 공개 {publishedProducts.length}개</span></p>
        {(category || query || selectedMode) && <a href="/products">필터 초기화</a>}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">검색 조건과 일치하는 검증 완료 상품이 없습니다.</div>
      ) : (
        <>
          <div className="product-list">
            {paginated.map((product) => <ProductCard product={product} showCode key={product.slug} />)}
          </div>

          {totalPages > 1 && (
            <nav className="catalog-pagination" aria-label="제품 목록 페이지">
              {currentPage > 1 && <a href={makeHref({ nextPage: currentPage - 1 })}>← 이전</a>}
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <a
                  aria-current={pageNumber === currentPage ? 'page' : undefined}
                  className={pageNumber === currentPage ? 'active' : ''}
                  href={makeHref({ nextPage: pageNumber })}
                  key={pageNumber}
                >
                  {pageNumber}
                </a>
              ))}
              {currentPage < totalPages && <a href={makeHref({ nextPage: currentPage + 1 })}>다음 →</a>}
            </nav>
          )}
        </>
      )}
    </section>
  );
}
