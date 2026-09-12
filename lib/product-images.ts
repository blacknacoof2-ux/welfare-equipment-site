import type { Product } from './products';

export type ProductImageSet = {
  urls: string[];
  sourceLabel: string;
  sourceUrl: string;
  usageBasis: 'CONTRACT_AUTHORIZED' | 'SUPPLIER_AUTHORIZED' | 'OWNED';
};

// 사이트 운영자가 복지용구 판매 및 이로움 계약 관계에 따른 제품 이미지 사용 권한을 확인한 이미지 세트입니다.
// 상세페이지 캡처 자체가 아니라 제품 식별용 대표/상세 이미지만 사용합니다.
export const productImageSets: Record<string, ProductImageSet> = {
  'wag02-adult-walker': {
    urls: [
      'https://godomall.speedycdn.net/e9c45f52a146ba8cbf23a3fd8738b016/goods/1000008875/image/detail/1000008875_detail_053.jpg',
      'https://www.hukusi-orosi.jp/img/item/s31/054/02.jpg',
    ],
    sourceLabel: 'WAG02 제품 이미지',
    sourceUrl: 'https://eroumcare.com/shop/item.php?it_id=PRO2026013000006',
    usageBasis: 'CONTRACT_AUTHORIZED',
  },
  'sporty-adult-walker': {
    urls: [
      'https://cdn.imweb.me/upload/S20250508610aa7396002d/7cbbdf2ee8aeb.jpg',
      'https://cdn-optimized.imweb.me/upload/S20250508610aa7396002d/e364540320d23.jpg?w=800',
    ],
    sourceLabel: 'SPORTY 제품 이미지',
    sourceUrl: 'https://eroumcare.com/shop/itemqalist.php',
    usageBasis: 'CONTRACT_AUTHORIZED',
  },
};

export function getAuthorizedProductImages(product: Product): ProductImageSet | null {
  const directUrls = [
    ...(product.imageUrls ?? []),
    ...(product.imageUrl ? [product.imageUrl] : []),
  ].filter(Boolean);

  if (product.imageRightsConfirmed && directUrls.length > 0) {
    return {
      urls: Array.from(new Set(directUrls)),
      sourceLabel: '제품 공급 이미지',
      sourceUrl: product.sourceUrl,
      usageBasis: 'SUPPLIER_AUTHORIZED',
    };
  }

  return productImageSets[product.slug] ?? null;
}
