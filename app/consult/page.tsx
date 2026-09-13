import type { Metadata } from 'next';
import CareConsultation from '@/components/CareConsultation';
import { getProductDisplayTitle } from '@/lib/product-display';
import { getProductMedia } from '@/lib/product-images';
import { getBenefitMode, getPriceSuffix, publishedProducts } from '@/lib/products';

export const metadata: Metadata = {
  title: '수급자 맞춤 복지용구 AI 셋업 추천',
  description: '수급자 기본정보와 보행·낙상·욕실·화장실·침실 상태를 입력하면 정상 유통 복지용구를 생활공간별 세트로 추천하고 같은 품목 제품도 비교할 수 있습니다.',
  alternates: { canonical: '/consult' },
};

export default function ConsultPage() {
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
    description: product.description,
    dimensions: product.dimensions,
    material: product.material,
    weightKg: product.weightKg,
  }));

  return <CareConsultation candidates={candidates} />;
}
