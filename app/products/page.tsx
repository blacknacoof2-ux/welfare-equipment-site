import type { Metadata } from 'next';
import { getCopays, publishedProducts } from '@/lib/products';

export const metadata: Metadata = {
  title: '복지용구 제품 찾기',
  description: '정상 유통이 확인된 장기요양 복지용구를 카테고리별로 찾고 15%·9%·6% 본인부담금을 확인하세요.',
  alternates: { canonical: '/products' },
};

const formatter = new Intl.NumberFormat('ko-KR');

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const filtered = category ? publishedProducts.filter((product) => product.category === category) : publishedProducts;

  return (
    <section className="section">
      <p className="eyebrow">PRODUCTS</p>
      <h1>{category ? `${category} 복지용구` : '복지용구 제품 찾기'}</h1>
      <p className="muted">이로움 기준 정상 유통 상태가 확인된 제품만 노출합니다. 단종·비유통·품절·일시품절 제품은 제외합니다.</p>
      {filtered.length === 0 ? (
        <div className="empty-state">현재 검증 완료된 {category ? `${category} ` : ''}상품을 등록 중입니다. 가격·모델·급여코드·유통상태 확인이 끝난 상품부터 순차 공개합니다.</div>
      ) : (
        <div className="product-list">
          {filtered.map((product) => {
            const copays = getCopays(product.benefitPrice);
            return (
              <a className="content-card" href={`/products/${product.slug}`} key={product.slug}>
                <small>{product.category}</small>
                <h2>{product.name}</h2>
                <p>{product.manufacturer} · {product.model}</p>
                <strong>본인부담금 {formatter.format(copays.copay6)}원부터</strong>
                <p className="muted">15% {formatter.format(copays.copay15)}원 · 9% {formatter.format(copays.copay9)}원 · 6% {formatter.format(copays.copay6)}원</p>
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}
