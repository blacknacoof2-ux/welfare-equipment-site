import type { Metadata } from 'next';
import CareConsultation from '@/components/CareConsultation';
import { getProductDisplayTitle } from '@/lib/product-display';
import { getProductMedia } from '@/lib/product-images';
import { filterBrowseProducts } from '@/lib/product-visibility';
import { getBenefitMode, getPriceSuffix, publishedProducts } from '@/lib/products';

export const metadata: Metadata = {
  title: '수급자 맞춤 복지용구 상담·추천',
  description: '불편한 상황과 사용환경을 입력해 복지용구를 추천받고 신청목록에 담은 뒤 수급자 정보와 장기요양인정서를 제출하세요.',
  alternates: { canonical: '/consult' },
};

export default function ConsultPage() {
  const candidates = filterBrowseProducts(publishedProducts).map((product) => ({
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
