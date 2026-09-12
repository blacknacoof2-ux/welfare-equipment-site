export type ProductStatus =
  | 'ACTIVE'
  | 'DISCONTINUED'
  | 'NOT_DISTRIBUTED'
  | 'OUT_OF_STOCK'
  | 'TEMP_OUT_OF_STOCK';

export type Product = {
  slug: string;
  name: string;
  model: string;
  manufacturer: string;
  benefitCode: string;
  category: string;
  benefitPrice: number;
  status: ProductStatus;
  sourceUrl: string;
  sourceCheckedAt: string;
  imageUrl?: string;
  description?: string;
};

export const COPAY_RATES = [0.15, 0.09, 0.06] as const;

export function calculateCopay(benefitPrice: number, rate: number) {
  return Math.floor((benefitPrice * rate) / 10) * 10;
}

export function getCopays(benefitPrice: number) {
  return {
    copay15: calculateCopay(benefitPrice, 0.15),
    copay9: calculateCopay(benefitPrice, 0.09),
    copay6: calculateCopay(benefitPrice, 0.06),
  };
}

export function isPublishable(product: Product) {
  return product.status === 'ACTIVE';
}

// 검증 완료된 이로움 상품만 추가합니다.
// 단종 / 비유통 / 품절 / 일시품절 상품은 절대 게시하지 않습니다.
export const products: Product[] = [];

export const publishedProducts = products.filter(isPublishable);
