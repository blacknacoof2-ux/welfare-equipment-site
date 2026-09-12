import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import ProductDetailContent from '@/components/ProductDetailContent';
import { ProductGallery } from '@/components/ProductMedia';
import { categories } from '@/lib/all-categories';
import { getBenefitModeEmoji, getBenefitModeLabel, getCategoryEmoji } from '@/lib/category-ui';
import { getAuthorizedProductImages } from '@/lib/product-images';
import {
  getBenefitMode,
  getCopays,
  getPriceSuffix,
  getPrimaryPriceLabel,
  publishedProducts,
} from '@/lib/products';

const formatter = new Intl.NumberFormat('ko-KR');

export function generateStaticParams() {
  return publishedProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = publishedProducts.find((item) => item.slug === slug);
  if (!product) return {};
  const modeText = getBenefitMode(product) === 'RENTAL' ? '월 대여 본인부담금' : '본인부담금';
  const imageSet = getAuthorizedProductImages(product);
  return {
    title: `${product.name} ${product.model} ${modeText}·급여가격`,
    description: `${product.name} ${product.model}의 급여가격, 15%·9%·6% 본인부담금, 제조사, 급여코드, 규격과 제품 이미지를 확인하세요.`,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: imageSet?.urls[0] ? { images: [{ url: imageSet.urls[0], alt: `${product.name} ${product.model}` }] } : undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = publishedProducts.find((item) => item.slug === slug);
  if (!product) notFound();

  const benefitMode = getBenefitMode(product);
  const copays = getCopays(product.benefitPrice);
  const priceSuffix = getPriceSuffix(product);
  const primaryPriceLabel = getPrimaryPriceLabel(product);
  const rentalCopays = product.rentalMonthlyPrice ? getCopays(product.rentalMonthlyPrice) : null;
  const category = categories.find((item) => item.name === product.category);
  const relatedProducts = publishedProducts.filter(
    (item) => item.category === product.category && item.slug !== product.slug,
  ).slice(0, 4);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:5000';
  const categoryUrl = category ? `${baseUrl}/categories/${category.slug}` : `${baseUrl}/products`;
  const productUrl = `${baseUrl}/products/${product.slug}`;
  const imageSet = getAuthorizedProductImages(product);
  const structuredImages = imageSet?.urls ?? [];
  const categoryEmoji = getCategoryEmoji(product.category);

  const additionalProperty = [
    { '@type': 'PropertyValue', name: '급여코드', value: product.benefitCode },
    { '@type': 'PropertyValue', name: '급여방식', value: getBenefitModeLabel(benefitMode) },
    { '@type': 'PropertyValue', name: primaryPriceLabel, value: `${product.benefitPrice} KRW${priceSuffix}` },
    { '@type': 'PropertyValue', name: `15% 본인부담금${priceSuffix}`, value: `${copays.copay15} KRW${priceSuffix}` },
    { '@type': 'PropertyValue', name: `9% 본인부담금${priceSuffix}`, value: `${copays.copay9} KRW${priceSuffix}` },
    { '@type': 'PropertyValue', name: `6% 본인부담금${priceSuffix}`, value: `${copays.copay6} KRW${priceSuffix}` },
  ];

  if (product.rentalMonthlyPrice && rentalCopays) {
    additionalProperty.push(
      { '@type': 'PropertyValue', name: '월 대여 급여가격', value: `${product.rentalMonthlyPrice} KRW/월` },
      { '@type': 'PropertyValue', name: '월 대여 15% 본인부담금', value: `${rentalCopays.copay15} KRW/월` },
      { '@type': 'PropertyValue', name: '월 대여 9% 본인부담금', value: `${rentalCopays.copay9} KRW/월` },
      { '@type': 'PropertyValue', name: '월 대여 6% 본인부담금', value: `${rentalCopays.copay6} KRW/월` },
    );
  }

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    model: product.model,
    brand: { '@type': 'Brand', name: product.manufacturer },
    category: product.category,
    description: product.description,
    sku: product.benefitCode,
    url: productUrl,
    additionalProperty,
    ...(structuredImages.length > 0 ? { image: structuredImages } : {}),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: product.category, item: categoryUrl },
      { '@type': 'ListItem', position: 3, name: product.name, item: productUrl },
    ],
  };

  return (
    <section className="section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <nav aria-label="breadcrumb" className="muted" style={{ marginBottom: 16 }}>
        <a href="/">홈</a> · {category ? <a href={`/categories/${category.slug}`}>{product.category}</a> : <a href="/products">복지용구</a>} · <span>{product.name}</span>
      </nav>

      <div className="product-detail-hero">
        <ProductGallery product={product} />
        <div className="product-detail-copy">
          <div className="detail-badges">
            <span className="category-chip"><span aria-hidden="true">{categoryEmoji}</span>{product.category}</span>
            <span className={`benefit-mode-badge mode-${benefitMode.toLowerCase()}`}>
              <span aria-hidden="true">{getBenefitModeEmoji(benefitMode)}</span>{getBenefitModeLabel(benefitMode)}
            </span>
          </div>
          <h1>{product.name} <span className="muted">{product.model}</span></h1>
          <p>{product.description}</p>
          <div className="product-price-highlight">
            <span>{benefitMode === 'RENTAL' ? '월 본인부담금 6%부터' : '본인부담금 6%부터'}</span>
            <strong>{formatter.format(copays.copay6)}원{priceSuffix}</strong>
            <small>9% {formatter.format(copays.copay9)}원{priceSuffix} · 15% {formatter.format(copays.copay15)}원{priceSuffix}</small>
          </div>
          <div className="product-quick-info">
            <span>급여방식 <strong>{getBenefitModeLabel(benefitMode)}</strong></span>
            <span>급여코드 <strong>{product.benefitCode}</strong></span>
            <span>제조·공급사 <strong>{product.manufacturer}</strong></span>
            <span>유통상태 <strong>정상 유통 확인</strong></span>
          </div>
        </div>
      </div>

      <ProductDetailContent product={product} />

      <div className="content-card" style={{ marginTop: 28 }}>
        <h2>{getBenefitModeEmoji(benefitMode)} {benefitMode === 'RENTAL' ? '월 대여 본인부담금' : '본인부담금'}</h2>
        <p className="muted">사이트에서는 0%를 제외하고 15%·9%·6% 기준만 표시합니다.</p>
        <table className="price-table">
          <tbody>
            <tr><th>{primaryPriceLabel}</th><td>{formatter.format(product.benefitPrice)}원{priceSuffix}</td></tr>
            <tr><th>일반 15%</th><td><strong>{formatter.format(copays.copay15)}원{priceSuffix}</strong></td></tr>
            <tr><th>감경 9%</th><td><strong>{formatter.format(copays.copay9)}원{priceSuffix}</strong></td></tr>
            <tr><th>감경 6%</th><td><strong>{formatter.format(copays.copay6)}원{priceSuffix}</strong></td></tr>
          </tbody>
        </table>
      </div>

      {product.rentalMonthlyPrice && rentalCopays && (
        <div className="content-card" style={{ marginTop: 20 }}>
          <h2>🔁 월 대여 시 본인부담금</h2>
          <table className="price-table">
            <tbody>
              <tr><th>월 대여 급여가격</th><td>{formatter.format(product.rentalMonthlyPrice)}원/월</td></tr>
              <tr><th>일반 15%</th><td><strong>{formatter.format(rentalCopays.copay15)}원/월</strong></td></tr>
              <tr><th>감경 9%</th><td><strong>{formatter.format(rentalCopays.copay9)}원/월</strong></td></tr>
              <tr><th>감경 6%</th><td><strong>{formatter.format(rentalCopays.copay6)}원/월</strong></td></tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="content-card" style={{ marginTop: 20 }}>
        <h2>{categoryEmoji} 제품 상세정보</h2>
        <table className="price-table">
          <tbody>
            <tr><th>급여방식</th><td>{getBenefitModeLabel(benefitMode)}</td></tr>
            <tr><th>제조·공급사</th><td>{product.manufacturer}</td></tr>
            <tr><th>모델명</th><td>{product.model}</td></tr>
            <tr><th>급여코드</th><td>{product.benefitCode}</td></tr>
            {product.material && <tr><th>재질</th><td>{product.material}</td></tr>}
            {product.dimensions && <tr><th>규격</th><td>{product.dimensions}</td></tr>}
            {product.weightKg !== undefined && <tr><th>중량</th><td>{product.weightKg}kg</td></tr>}
            {product.purchaseCycleYears && <tr><th>사용 가능 햇수</th><td>{product.purchaseCycleYears}년</td></tr>}
            {product.maxQuantityPerCycle !== undefined && <tr><th>급여한도</th><td>최대 {product.maxQuantityPerCycle}개</td></tr>}
            <tr><th>유통상태</th><td><strong>정상 유통 확인</strong></td></tr>
            <tr><th>최종 확인일</th><td>{product.sourceCheckedAt}</td></tr>
          </tbody>
        </table>
      </div>

      {relatedProducts.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h2>{categoryEmoji} 같은 {product.category} 제품 비교</h2>
          <div className="product-list">
            {relatedProducts.map((item) => <ProductCard product={item} key={item.slug} />)}
          </div>
        </div>
      )}

      <div className="content-card" style={{ marginTop: 28 }}>
        <h2>검증 기록</h2>
        <p className="muted">유통 상태와 급여코드·급여가격을 교차 확인한 기록입니다.</p>
        <ul>
          {product.verificationSources.map((source) => (
            <li key={source.url} style={{ marginBottom: 10 }}>
              <a href={source.url} target="_blank" rel="noreferrer">{source.label}</a>
              <span className="muted"> · {source.checkedAt}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
