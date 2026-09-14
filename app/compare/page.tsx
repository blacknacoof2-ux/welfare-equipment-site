import type { Metadata } from 'next';
import AddToConsultCart from '@/components/AddToConsultCart';
import ProductCompareToggle from '@/components/ProductCompareToggle';
import { getBenefitModeLabel } from '@/lib/category-ui';
import { getProductDisplayTitle } from '@/lib/product-display';
import { getProductMedia } from '@/lib/product-images';
import {
  getBenefitMode,
  getCopays,
  getPriceSuffix,
  getPrimaryPriceLabel,
  publishedProducts,
  type Product,
} from '@/lib/products';

export const metadata: Metadata = {
  title: '복지용구 제품 비교',
  description: '같은 복지용구 품목에서 최대 3개 제품의 급여가격, 본인부담금, 규격, 중량, 재질을 한눈에 비교하세요.',
  robots: { index: false, follow: true },
};

const formatter = new Intl.NumberFormat('ko-KR');

function display(value: string | number | undefined | null, suffix = '') {
  if (value === undefined || value === null || value === '') return '정보 없음';
  return `${value}${suffix}`;
}

function isDifferent(values: string[]) {
  return new Set(values).size > 1;
}

function price(product: Product) {
  return `${getPrimaryPriceLabel(product)} ${formatter.format(product.benefitPrice)}원${getPriceSuffix(product)}`;
}

function copay(product: Product, rate: 15 | 9 | 6) {
  const values = getCopays(product.benefitPrice);
  const amount = rate === 15 ? values.copay15 : rate === 9 ? values.copay9 : values.copay6;
  return `${formatter.format(amount)}원${getPriceSuffix(product)}`;
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ items?: string }>;
}) {
  const { items } = await searchParams;
  const requestedSlugs = Array.from(new Set((items ?? '').split(',').map((value) => value.trim()).filter(Boolean))).slice(0, 3);
  const products = requestedSlugs
    .map((slug) => publishedProducts.find((product) => product.slug === slug))
    .filter((product): product is Product => Boolean(product));

  if (products.length < 2) {
    return (
      <section className="section">
        <p className="eyebrow">PRODUCT COMPARISON</p>
        <h1>같은 제품군 비교</h1>
        <div className="content-card" style={{ marginTop: 20 }}>
          <h2>비교할 제품을 2~3개 선택하세요.</h2>
          <p className="muted">제품 목록이나 상세페이지의 <strong>비교하기</strong> 버튼을 누르면 같은 품목에서 최대 3개까지 선택할 수 있습니다.</p>
          <a className="button primary" href="/products">제품 선택하러 가기</a>
        </div>
      </section>
    );
  }

  const categories = new Set(products.map((product) => product.category));
  if (categories.size !== 1) {
    return (
      <section className="section">
        <p className="eyebrow">PRODUCT COMPARISON</p>
        <h1>같은 품목끼리만 비교할 수 있습니다.</h1>
        <div className="content-card" style={{ marginTop: 20 }}>
          <p>보행기는 보행기끼리, 목욕의자는 목욕의자끼리 비교하도록 구성되어 있습니다.</p>
          <a className="button primary" href="/products">다시 선택하기</a>
        </div>
      </section>
    );
  }

  const category = products[0].category;
  const rows = [
    { label: '제조·공급사', values: products.map((product) => product.manufacturer) },
    { label: '모델명', values: products.map((product) => product.model) },
    { label: '급여코드', values: products.map((product) => product.benefitCode) },
    { label: '급여방식', values: products.map((product) => getBenefitModeLabel(getBenefitMode(product))) },
    { label: '급여가격', values: products.map(price) },
    { label: '본인부담 15%', values: products.map((product) => copay(product, 15)) },
    { label: '본인부담 9%', values: products.map((product) => copay(product, 9)) },
    { label: '본인부담 6%', values: products.map((product) => copay(product, 6)) },
    { label: '중량', values: products.map((product) => display(product.weightKg, 'kg')) },
    { label: '규격', values: products.map((product) => display(product.dimensions)) },
    { label: '재질', values: products.map((product) => display(product.material)) },
    { label: '사용 가능 햇수', values: products.map((product) => display(product.purchaseCycleYears, '년')) },
    { label: '급여한도', values: products.map((product) => product.maxQuantityPerCycle === undefined ? '정보 없음' : `최대 ${product.maxQuantityPerCycle}개`) },
  ];

  return (
    <section className="section">
      <p className="eyebrow">PRODUCT COMPARISON</p>
      <h1>{category} 제품 비교</h1>
      <p className="muted">최대 3개 제품의 가격·본인부담금·규격 차이를 한눈에 확인할 수 있습니다. 서로 다른 값은 연한 배경으로 표시합니다.</p>

      <div className="content-card" style={{ marginTop: 24, overflowX: 'auto', padding: 0 }}>
        <table className="price-table" style={{ minWidth: products.length === 3 ? 920 : 700, margin: 0 }}>
          <thead>
            <tr>
              <th style={{ minWidth: 150 }}>비교항목</th>
              {products.map((product) => {
                const media = getProductMedia(product);
                const title = getProductDisplayTitle(product);
                return (
                  <th key={product.slug} style={{ minWidth: 240, verticalAlign: 'top' }}>
                    {media?.heroUrl && (
                      <img
                        src={media.heroUrl}
                        alt={`${title} 제품사진`}
                        style={{ display: 'block', width: 150, height: 150, objectFit: 'contain', margin: '0 auto 12px', borderRadius: 12, background: '#fff' }}
                      />
                    )}
                    <a href={`/products/${product.slug}`} style={{ fontSize: 18 }}>{title}</a>
                    <div style={{ marginTop: 10 }}>
                      <ProductCompareToggle item={{ slug: product.slug, name: title, category: product.category }} compact />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const different = isDifferent(row.values);
              return (
                <tr key={row.label}>
                  <th>{row.label}{different ? <span aria-label="차이 있음"> ·</span> : null}</th>
                  {row.values.map((value, index) => (
                    <td key={`${row.label}-${products[index].slug}`} style={different ? { background: '#f8fafc', fontWeight: 650 } : undefined}>
                      {value}
                    </td>
                  ))}
                </tr>
              );
            })}
            <tr>
              <th>제품 특징</th>
              {products.map((product) => <td key={product.slug}>{product.description}</td>)}
            </tr>
            <tr>
              <th>신청</th>
              {products.map((product) => {
                const title = getProductDisplayTitle(product);
                return (
                  <td key={product.slug}>
                    <AddToConsultCart
                      compact
                      item={{
                        slug: product.slug,
                        title,
                        manufacturer: product.manufacturer,
                        benefitCode: product.benefitCode,
                        benefitPrice: product.benefitPrice,
                        category: product.category,
                        benefitMode: getBenefitMode(product),
                        priceSuffix: getPriceSuffix(product),
                        imageUrl: getProductMedia(product)?.heroUrl,
                      }}
                    />
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="content-card" style={{ marginTop: 24 }}>
        <h2>비교 후 선택 방법</h2>
        <p className="muted">금액만으로 결정하기보다 사용자의 신체조건, 실제 사용공간, 보호자 이동·보관 편의까지 함께 확인하세요. 원하는 제품은 비교표에서 바로 신청목록에 담을 수 있습니다.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a className="button secondary" href={`/products?category=${encodeURIComponent(category)}`}>같은 {category} 더 보기</a>
          <a className="button primary" href="/consult/cart">신청목록 확인</a>
        </div>
      </div>
    </section>
  );
}
