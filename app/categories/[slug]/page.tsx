import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdultWalkerRecommender, { type WalkerCandidate } from '@/components/AdultWalkerRecommender';
import ProductCard from '@/components/ProductCard';
import { categories, getCategoryBySlug } from '@/lib/all-categories';
import { getCategoryEmoji } from '@/lib/category-ui';
import { getProductDisplayTitle } from '@/lib/product-display';
import { getProductMedia } from '@/lib/product-images';
import { filterBrowseProducts } from '@/lib/product-visibility';
import { getBenefitMode, getCopays, publishedProducts } from '@/lib/products';

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return {};
  const hasProducts = filterBrowseProducts(publishedProducts).some((product) => product.category === category.name);
  return {
    title: category.seoTitle,
    description: category.slug === 'adult-walker'
      ? `${category.seoDescription} 키·문폭·사용환경·차량 적재 조건을 입력해 나에게 맞는 성인용보행기를 추천순으로 확인하세요.`
      : category.seoDescription,
    keywords: category.keywords,
    alternates: { canonical: `/categories/${category.slug}` },
    robots: hasProducts ? undefined : { index: false, follow: true },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const products = filterBrowseProducts(publishedProducts)
    .filter((product) => product.category === category.name);
  const purchaseCount = products.filter((product) => getBenefitMode(product) === 'PURCHASE').length;
  const rentalCount = products.filter((product) => getBenefitMode(product) === 'RENTAL').length;
  const mixedCount = products.filter((product) => getBenefitMode(product) === 'PURCHASE_OR_RENTAL').length;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:5000';
  const categoryUrl = `${baseUrl}/categories/${category.slug}`;
  const emoji = getCategoryEmoji(category.name);
  const walkerCandidates: WalkerCandidate[] = category.slug === 'adult-walker'
    ? products.map((product) => ({
      slug: product.slug,
      title: getProductDisplayTitle(product),
      manufacturer: product.manufacturer,
      benefitCode: product.benefitCode,
      benefitPrice: product.benefitPrice,
      dimensions: product.dimensions,
      weightKg: product.weightKg,
      description: product.description,
      imageUrl: getProductMedia(product)?.heroUrl,
    }))
    : [];

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
        <Link href="/">홈</Link> · <Link href="/products">복지용구</Link> · <span>{category.name}</span>
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

      {category.slug === 'adult-walker' && products.length > 0 && (
        <div className="content-card" style={{ marginTop: 20 }}>
          <h2>성인용보행기 종류와 선택 기준</h2>
          <p>보행기는 사용자에게 필요한 지지 방식, 실내외 사용 환경, 바퀴 구조와 접이·휴대 조건에 따라 비교해야 합니다. &lsquo;워커 보행기&rsquo;나 &lsquo;노인 보행기&rsquo;처럼 검색하더라도 실제 적합성은 모델의 확인된 규격을 기준으로 판단하세요.</p>
          <ul>
            <li><strong>실내 이용:</strong> 가장 좁은 문폭·복도 폭과 회전 공간을 먼저 확인합니다.</li>
            <li><strong>실외 이용:</strong> 바퀴 구조·브레이크 조작 방법·노면 사용조건을 제품별로 확인합니다.</li>
            <li><strong>이동·보관:</strong> 전체 무게, 접이 구조와 차량 적재 가능 여부를 확인합니다.</li>
            <li><strong>급여가격:</strong> 공개된 제품별 가격과 본인부담금의 차이를 비교합니다.</li>
          </ul>
          <p className="muted">모든 제품을 같은 종류로 단정하지 않고, 실제 확인된 개별 제품 정보와 사용설명서를 기준으로 선택해야 합니다.</p>
          <h3>대표 제품 급여가격·본인부담금 비교</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="price-table">
              <thead><tr><th>제품</th><th>급여가격</th><th>15% 부담</th><th>9% 부담</th><th>6% 부담</th><th>중량</th></tr></thead>
              <tbody>
                {products.filter((product) => product.model === 'WAG02' || product.model === 'SPORTY').map((product) => {
                  const copays = getCopays(product.benefitPrice);
                  return (
                    <tr key={product.slug}>
                      <th><Link href={`/products/${product.slug}`}>{getProductDisplayTitle(product)}</Link></th>
                      <td>{product.benefitPrice.toLocaleString('ko-KR')}원</td>
                      <td>{copays.copay15.toLocaleString('ko-KR')}원</td>
                      <td>{copays.copay9.toLocaleString('ko-KR')}원</td>
                      <td>{copays.copay6.toLocaleString('ko-KR')}원</td>
                      <td>{product.weightKg !== undefined ? `${product.weightKg}kg` : '확인 필요'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="muted">비교표는 현재 게시 중인 제품 원장의 급여가격을 그대로 사용합니다. 해당 수급자의 실제 부담률과 구매 가능 여부는 별도 확인이 필요합니다.</p>
          <div className="category-link-cloud">
            <Link href="/compare/wag02-vs-sporty">WAG02·SPORTY 상세 비교</Link>
            <Link href="/guide/welfare-equipment">복지용구 이용 가이드</Link>
            <Link href="/guide/copay">본인부담금 계산 기준</Link>
          </div>
        </div>
      )}

      {category.slug === 'adult-walker' && walkerCandidates.length > 0 && (
        <AdultWalkerRecommender candidates={walkerCandidates} />
      )}

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
          <Link className="button primary" href="/compare/wag02-vs-sporty">두 제품 비교하기</Link>
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
            <Link href={`/categories/${item.slug}`} key={item.slug}>{getCategoryEmoji(item.name)} {item.name}</Link>
          ))}
        </div>
      </div>
    </section>
  );
}
