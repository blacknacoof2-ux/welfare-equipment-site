import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { categories, getCategoryBySlug } from '@/lib/categories';
import { getCopays, publishedProducts } from '@/lib/products';

const formatter = new Intl.NumberFormat('ko-KR');

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: category.seoTitle,
    description: category.seoDescription,
    keywords: category.keywords,
    alternates: { canonical: `/categories/${category.slug}` },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const products = publishedProducts.filter((product) => product.category === category.name);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const categoryUrl = `${baseUrl}/categories/${category.slug}`;

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: '복지용구 제품', item: `${baseUrl}/products` },
      { '@type': 'ListItem', position: 3, name: category.name, item: categoryUrl },
    ],
  };

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${category.name} 복지용구`,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${baseUrl}/products/${product.slug}`,
      name: product.name,
    })),
  };

  return (
    <section className="section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {products.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      )}

      <nav aria-label="breadcrumb" className="muted" style={{ marginBottom: 16 }}>
        <a href="/">홈</a> · <a href="/products">복지용구</a> · <span>{category.name}</span>
      </nav>

      <p className="eyebrow">복지용구 카테고리</p>
      <h1>{category.name}</h1>
      <p>{category.intro}</p>

      <div className="content-card" style={{ marginTop: 20 }}>
        <h2>{category.name} 본인부담금 확인 방법</h2>
        <p className="muted">제품의 급여가격을 기준으로 일반 15%, 감경 9%, 감경 6% 금액을 계산합니다. 이 사이트는 0% 금액은 표시하지 않습니다.</p>
      </div>

      <div style={{ marginTop: 32 }}>
        <p className="eyebrow">VERIFIED PRODUCTS</p>
        <h2>현재 정상 유통 확인 제품</h2>
        <p className="muted">이로움에서 단종·비유통·품절·일시품절 표시가 없는 제품 중 급여코드와 가격을 교차검증한 상품만 공개합니다.</p>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">현재 이로움 기준 정상 유통 및 가격 검증이 완료된 {category.name} 제품을 등록 중입니다.</div>
      ) : (
        <div className="product-list">
          {products.map((product) => {
            const copays = getCopays(product.benefitPrice);
            return (
              <a className="content-card" href={`/products/${product.slug}`} key={product.slug}>
                <small>{product.manufacturer}</small>
                <h2>{product.name}</h2>
                <p>{product.material}</p>
                <p className="muted">{product.dimensions}{product.weightKg ? ` · ${product.weightKg}kg` : ''}</p>
                <strong>본인부담금 {formatter.format(copays.copay6)}원부터</strong>
                <p className="muted">15% {formatter.format(copays.copay15)}원 · 9% {formatter.format(copays.copay9)}원 · 6% {formatter.format(copays.copay6)}원</p>
              </a>
            );
          })}
        </div>
      )}

      {category.slug === 'adult-walker' && products.length >= 2 && (
        <div className="guide-block" style={{ marginTop: 32 }}>
          <div>
            <p className="eyebrow">COMPARE</p>
            <h2>WAG02와 SPORTY, 어떤 차이가 있을까요?</h2>
            <p>급여가격·본인부담금·무게·재질·규격을 한 화면에서 비교할 수 있습니다.</p>
          </div>
          <a className="button primary" href="/compare/wag02-vs-sporty">두 제품 비교하기</a>
        </div>
      )}

      <div className="content-card" style={{ marginTop: 32 }}>
        <h2>{category.name} 선택 전 확인할 것</h2>
        <p>가격만 비교하지 말고 사용자의 신체 상태, 실제 사용 장소, 보관 공간, 제품 규격과 무게를 함께 확인하세요. 급여코드와 현재 유통 상태가 맞는지도 구매 전 다시 확인하는 것이 좋습니다.</p>
      </div>

      <div className="content-card" style={{ marginTop: 20 }}>
        <h2>다른 복지용구도 함께 확인하세요</h2>
        <p>
          {categories.filter((item) => item.slug !== category.slug).map((item, index, list) => (
            <span key={item.slug}>
              <a href={`/categories/${item.slug}`}>{item.name}</a>{index < list.length - 1 ? ' · ' : ''}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
