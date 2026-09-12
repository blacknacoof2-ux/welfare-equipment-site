import type { Metadata } from 'next';
import { ProductImage } from '@/components/ProductMedia';
import { getCopays, getPriceSuffix, publishedProducts } from '@/lib/products';

export const metadata: Metadata = {
  title: '복지용구 제품 찾기',
  description: '정상 유통이 확인된 장기요양 복지용구를 제품명·모델명·제조사·급여코드로 검색하고 15%·9%·6% 본인부담금을 확인하세요.',
  alternates: { canonical: '/products' },
};

const formatter = new Intl.NumberFormat('ko-KR');

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const query = q?.trim().toLocaleLowerCase('ko-KR') ?? '';

  const filtered = publishedProducts.filter((product) => {
    const categoryMatches = !category || product.category === category;
    if (!categoryMatches) return false;
    if (!query) return true;

    return [product.name, product.model, product.manufacturer, product.benefitCode, product.category]
      .some((value) => value.toLocaleLowerCase('ko-KR').includes(query));
  });

  return (
    <section className="section">
      <p className="eyebrow">PRODUCTS</p>
      <h1>{category ? `${category} 복지용구` : '복지용구 제품 찾기'}</h1>
      <p className="muted">이로움 기준 정상 유통 상태가 확인된 제품만 노출합니다. 단종·비유통·품절·일시품절 제품은 제외합니다.</p>

      <form action="/products" method="get" className="content-card" style={{ marginTop: 20, marginBottom: 28 }}>
        {category && <input type="hidden" name="category" value={category} />}
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

      {q && <p><strong>“{q}” 검색결과 {filtered.length}개</strong></p>}

      {filtered.length === 0 ? (
        <div className="empty-state">
          {q ? '검색 조건과 일치하는 검증 완료 상품이 없습니다.' : `현재 검증 완료된 ${category ? `${category} ` : ''}상품을 등록 중입니다.`}
          {' '}가격·모델·급여코드·유통상태 확인이 끝난 상품부터 순차 공개합니다.
        </div>
      ) : (
        <div className="product-list">
          {filtered.map((product) => {
            const copays = getCopays(product.benefitPrice);
            const suffix = getPriceSuffix(product);
            return (
              <a className="content-card product-card" href={`/products/${product.slug}`} key={product.slug}>
                <ProductImage product={product} />
                <div className="product-card-body">
                  <small>{product.category}</small>
                  <h2>{product.name}</h2>
                  <p>{product.manufacturer} · {product.model}</p>
                  <p className="muted">급여코드 {product.benefitCode}</p>
                  <strong>본인부담금 {formatter.format(copays.copay6)}원{suffix}부터</strong>
                  <p className="muted">15% {formatter.format(copays.copay15)}원{suffix} · 9% {formatter.format(copays.copay9)}원{suffix} · 6% {formatter.format(copays.copay6)}원{suffix}</p>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}
