import type { Metadata } from 'next';
import ProductCompare from '@/components/ProductCompare';
import { getProductDisplayTitle } from '@/lib/product-display';
import { getProductMedia } from '@/lib/product-images';
import { getBenefitMode, getPriceSuffix, publishedProducts } from '@/lib/products';

export const metadata: Metadata = {
  title: '복지용구 같은 품목 제품 비교',
  description: '같은 복지용구 품목을 최대 3개까지 비교하고 급여가격, 15%·9%·6% 본인부담금, 규격, 중량과 재질을 확인하세요.',
  alternates: { canonical: '/compare' },
};

export default function ComparePage() {
  const candidates = publishedProducts.map((product) => ({
    slug: product.slug,
    title: getProductDisplayTitle(product),
    model: product.model,
    manufacturer: product.manufacturer,
    benefitCode: product.benefitCode,
    benefitPrice: product.benefitPrice,
    category: product.category,
    benefitMode: getBenefitMode(product),
    priceSuffix: getPriceSuffix(product),
    imageUrl: getProductMedia(product)?.heroUrl,
    dimensions: product.dimensions,
    material: product.material,
    weightKg: product.weightKg,
  }));

  return <ProductCompare candidates={candidates} />;
}
