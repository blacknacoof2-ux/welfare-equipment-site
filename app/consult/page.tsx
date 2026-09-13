import type { Metadata } from 'next';
import CareConsultation from '@/components/CareConsultation';
import { getProductDisplayTitle } from '@/lib/product-display';
import { getProductMedia } from '@/lib/product-images';
import { getBenefitMode, getPriceSuffix, publishedProducts } from '@/lib/products';

export const metadata: Metadata = {
  title: '수급자 맞춤 복지용구 상담·추천',
  description: '불편한 상황과 사용환경을 입력하면 정상 유통 복지용구를 추천하고 상담 장바구니에 담아 장기요양인정서 확인 상담으로 이어집니다.',
  alternates: { canonical: '/consult' },
};

export default function ConsultPage() {
  const candidates = publishedProducts.map((product) => ({
    slug: product.slug,
    title: getProductDisplayTitle(product),
    manufacturer: product.manufacturer,
    benefitCode: product.benefitCode,
    benefitPrice: product.benefitPrice,
    category: product.category,
    benefitMode: getBenefitMode(product),
    priceSuffix: getPriceSuffix(product),
    imageUrl: getProductMedia(product)?.heroUrl,
    description: product.description,
    dimensions: product.dimensions,
    weightKg: product.weightKg,
  }));

  return <CareConsultation candidates={candidates} />;
}
