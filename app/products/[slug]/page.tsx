import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCopays, publishedProducts } from '@/lib/products';

const formatter = new Intl.NumberFormat('ko-KR');

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = publishedProducts.find((item) => item.slug === slug);
  if (!product) return {};
  return {
    title: `${product.name} ${product.model} 본인부담금·급여가격`,
    description: `${product.name} ${product.model}의 급여가격, 15%·9%·6% 본인부담금, 제조사, 급여코드와 제품 정보를 확인하세요.`,
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
    description: product.description ?? `${product.name} ${product.model} 장기요양 복지용구`,
    ...(product.imageUrl ? { image: [product.imageUrl] } : {}),
  };

  return (
    <section className="section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="eyebrow">{product.category}</p>
      <h1>{product.name} <span className="muted">{product.model}</span></h1>
      <p>{product.description}</p>

      <div className="content-card">
        <h2>본인부담금</h2>
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
        <h2>제품 기본정보</h2>
        <table className="price-table">
          <tbody>
            <tr><th>제조사</th><td>{product.manufacturer}</td></tr>
            <tr><th>모델명</th><td>{product.model}</td></tr>
            <tr><th>급여코드</th><td>{product.benefitCode}</td></tr>
            <tr><th>유통상태</th><td>정상 유통 확인</td></tr>
            <tr><th>최종 확인일</th><td>{product.sourceCheckedAt}</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
