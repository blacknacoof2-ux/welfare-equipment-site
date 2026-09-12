import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCopays, publishedProducts } from '@/lib/products';

const formatter = new Intl.NumberFormat('ko-KR');

export function generateStaticParams() {
  return publishedProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = publishedProducts.find((item) => item.slug === slug);
  if (!product) return {};
  return {
    title: `${product.name} ${product.model} 본인부담금·급여가격`,
    description: `${product.name} ${product.model}의 급여가격, 15%·9%·6% 본인부담금, 제조사, 급여코드, 규격과 유통상태를 확인하세요.`,
    alternates: { canonical: `/products/${product.slug}` },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = publishedProducts.find((item) => item.slug === slug);
  if (!product) notFound();

  const copays = getCopays(product.benefitPrice);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    model: product.model,
    brand: { '@type': 'Brand', name: product.manufacturer },
    category: product.category,
    description: product.description,
    sku: product.benefitCode,
    ...(product.imageUrl && product.imageRightsConfirmed ? { image: [product.imageUrl] } : {}),
  };

  return (
    <section className="section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="eyebrow">{product.category}</p>
      <h1>{product.name} <span className="muted">{product.model}</span></h1>
      <p>{product.description}</p>

      {!product.imageRightsConfirmed && (
        <div className="empty-state" style={{ marginTop: 20 }}>
          제품 이미지는 제조사·공급사의 사용 허가 자료 확인 후 등록합니다. 제품 식별이 끝난 타사 상세페이지 이미지를 무단 복제하지 않습니다.
        </div>
      )}

      <div className="content-card" style={{ marginTop: 20 }}>
        <h2>본인부담금</h2>
        <p className="muted">사이트에서는 0%를 제외하고 15%·9%·6% 기준만 표시합니다.</p>
        <table className="price-table">
          <tbody>
            <tr><th>급여가격</th><td>{formatter.format(product.benefitPrice)}원</td></tr>
            <tr><th>일반 15%</th><td><strong>{formatter.format(copays.copay15)}원</strong></td></tr>
            <tr><th>감경 9%</th><td><strong>{formatter.format(copays.copay9)}원</strong></td></tr>
            <tr><th>감경 6%</th><td><strong>{formatter.format(copays.copay6)}원</strong></td></tr>
          </tbody>
        </table>
      </div>

      <div className="content-card" style={{ marginTop: 20 }}>
        <h2>제품 상세정보</h2>
        <table className="price-table">
          <tbody>
            <tr><th>제조·공급사</th><td>{product.manufacturer}</td></tr>
            <tr><th>모델명</th><td>{product.model}</td></tr>
            <tr><th>급여코드</th><td>{product.benefitCode}</td></tr>
            {product.material && <tr><th>재질</th><td>{product.material}</td></tr>}
            {product.dimensions && <tr><th>규격</th><td>{product.dimensions}</td></tr>}
            {product.weightKg && <tr><th>중량</th><td>{product.weightKg}kg</td></tr>}
            {product.purchaseCycleYears && <tr><th>구매 기준</th><td>{product.purchaseCycleYears}년 / 최대 {product.maxQuantityPerCycle ?? '-'}개</td></tr>}
            <tr><th>유통상태</th><td><strong>정상 유통 확인</strong></td></tr>
            <tr><th>최종 확인일</th><td>{product.sourceCheckedAt}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="content-card" style={{ marginTop: 20 }}>
        <h2>검증 기록</h2>
        <p className="muted">이로움 유통 상태와 급여코드·급여가격을 서로 다른 출처로 교차 확인한 기록입니다.</p>
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
