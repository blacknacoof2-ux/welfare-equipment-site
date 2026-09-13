import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { categories, getCategoryBySlug } from '@/lib/all-categories';
import { getCategoryEmoji } from '@/lib/category-ui';
import { getProductDisplayTitle } from '@/lib/product-display';
import { getBenefitMode, publishedProducts } from '@/lib/products';

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return {};
  const hasProducts = publishedProducts.some((product) => product.category === category.name);
  return {
    title: category.seoTitle,
    description: category.seoDescription,
    keywords: category.keywords,
    alternates: { canonical: `/categories/${category.slug}` },
    robots: hasProducts ? undefined : { index: false, follow: true },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const products = publishedProducts.filter((product) => product.category === category.name);
  const purchaseCount = products.filter((product) => getBenefitMode(product) === 'PURCHASE').length;
  const rentalCount = products.filter((product) => getBenefitMode(product) === 'RENTAL').length;
  const mixedCount = products.filter((product) => getBenefitMode(product) === 'PURCHASE_OR_RENTAL').length;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:5000';
  const categoryUrl = `${baseUrl}/categories/${category.slug}`;
  const emoji = getCategoryEmoji(category.name);

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
      name: getProductDisplayTitle(product),
    })),
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: category.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  return (
    <section className="section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      {products.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />}

      <nav aria-label="breadcrumb" className="muted" style={{ marginBottom: 16 }}>
        <a href="/">홈</a> · <a href="/products">복지용구</a> · <span>{category.name}</span>
      </nav>

      <div className="category-page-title">
        <span className="category-page-emoji" aria-hidden="true">{emoji}</span>
        <div>
          <p className="eyebrow">복지용구 카테고리</p>
          <h1>{category.name}</h1>
        </div>
      </div>
      <p>{category.intro}</p>

      {products.length > 0 && (
        <div className="category-live-summary" aria-label={`${category.name} 현재 공개 제품 수`}>
          <strong>정상 유통 확인 {products.length}개</strong>
          {purchaseCount > 0 && <span>🛒 구입 {purchaseCount}</span>}
          {rentalCount > 0 && <span>🔁 대여 {rentalCount}</span>}
          {mixedCount > 0 && <span>↔️ 구입·대여 {mixedCount}</span>}
        </div>
      )}

      <div className="content-card" style={{ marginTop: 20 }}>
        <h2>{emoji} {category.name} 본인부담금 확인 방법</h2>
        <p className="muted">제품의 급여가격 또는 월 대여 급여가격을 기준으로 일반 15%, 감경 9%, 감경 6% 금액을 계산합니다. 이 사이트는 0% 금액은 표시하지 않습니다.</p>
      </div>

      <div style={{ marginTop: 32 }}>
        <p className="eyebrow">VERIFIED PRODUCTS</p>
        <h2>현재 정상 유통 확인 제품 {products.length > 0 ? `${products.length}개` : ''}</h2>
        <p className="muted">구입·대여 배지와 제품 이미지를 함께 보여주어 제품 성격을 한눈에 확인할 수 있습니다.</p>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">현재 정상 유통 및 가격 검증이 완료된 {category.name} 제품을 등록 중입니다.</div>
      ) : (
        <div className="product-list">
          {products.map((product) => <ProductCard product={product} showCode key={product.slug} />)}
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
        <h2>{emoji} {category.name} 선택할 때 확인할 4가지</h2>
        <ol>{category.selectionTips.map((tip) => <li key={tip}>{tip}</li>)}</ol>
      </div>

      <div style={{ marginTop: 32 }}>
        <p className="eyebrow">FAQ</p>
        <h2>{category.name} 자주 묻는 질문</h2>
        <div className="product-list">
          {category.faqs.map((faq) => (
            <div className="content-card" key={faq.question}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="content-card" style={{ marginTop: 32 }}>
        <h2>다른 복지용구도 함께 확인하세요</h2>
        <div className="category-link-cloud">
          {categories.filter((item) => item.slug !== category.slug).map((item) => (
            <a href={`/categories/${item.slug}`} key={item.slug}>{getCategoryEmoji(item.name)} {item.name}</a>
          ))}
        </div>
      </div>
    </section>
  );
}
