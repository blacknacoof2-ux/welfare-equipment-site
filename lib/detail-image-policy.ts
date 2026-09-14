import type { Product } from './products';

type ProductMediaLike = {
  heroUrl?: string;
  galleryUrls?: string[];
  detailUrls?: string[];
};

// 판매업체 연락처·서비스지역·주문안내가 섞일 가능성이 높은 장문 판매시트는 기본 차단하고,
// 동일 모델임을 별도 확인한 상세자료만 예외적으로 노출합니다.
export const MANUALLY_REVIEWED_DETAIL_URLS_BY_SLUG: Record<string, string[]> = {
  'wag02-adult-walker': [
    'https://godomall.speedycdn.net/e9c45f52a146ba8cbf23a3fd8738b016/goods/1000008875/image/detail/1000008875_detail_053.jpg',
  ],
  'nice-walker-4s': [
    'https://m.escaremall.com/web/upload/NNEditor/20200128/%EC%83%81%EC%84%B83_shop1_005905.jpg',
  ],
  'asc-502-bath-chair': [
    'https://m.k-medi.co.kr/web/upload/NNEditor/20220809/mobile/01e2a0e4fa860eb6c47a1b2a9ce4ea20_1660021630.jpg',
    'https://shopby-images.cdn-nhncommerce.com/PARTNER/20260306/PARTNER_10016343/2026030614411927476813d63a4fa1987ab1be76564dc4/uQ3XZ_102745_7.jpg',
    'https://shopby-images.cdn-nhncommerce.com/PARTNER/20260306/PARTNER_10016343/2026030614411927476813d63a4fa1987ab1be76564dc4/ZQcxi_102745_8.jpg',
    'https://shopby-images.cdn-nhncommerce.com/PARTNER/20260306/PARTNER_10016343/2026030614411927476813d63a4fa1987ab1be76564dc4/lxwMn_102745_9.jpg',
  ],
  'iu-bath-chair': [
    'https://m.swmedi.co.kr/web/product/big/202503/5bc611c8fb398093becd27a5bd7fa69c.jpg',
  ],
};

const LONG_FORM_SELLER_SHEET_MARKERS = [
  '/data/editor/',
  '/editor/goods/',
  '/web/upload/nneditor/',
  '/nneditor/',
  '/banner/',
  '/intro/',
  'notice_',
];

function normalize(url: string) {
  return url.trim().toLowerCase();
}

function isManuallyReviewedDetailImage(product: Product, url: string) {
  const allowed = MANUALLY_REVIEWED_DETAIL_URLS_BY_SLUG[product.slug] ?? [];
  return allowed.includes(url);
}

function isExactCarestoreDetailImage(product: Product, url: string) {
  const normalized = normalize(url);
  const benefitCode = product.benefitCode.toLowerCase();
  return normalized.startsWith('https://www.carestore.co.kr/sscp/dt/')
    && normalized.includes(`/${benefitCode}/`)
    && /\.(?:webp|png|jpe?g)(?:\?.*)?$/.test(normalized);
}

export function isApprovedDetailImageUrl(product: Product, url: string) {
  if (!url) return false;
  if (isManuallyReviewedDetailImage(product, url)) return true;
  if (isExactCarestoreDetailImage(product, url)) return true;

  const normalized = normalize(url);
  if (LONG_FORM_SELLER_SHEET_MARKERS.some((marker) => normalized.includes(marker))) return false;

  // 자동으로 수집된 외부 판매몰 이미지는 내용 검수 전에는 노출하지 않습니다.
  // 새 이미지를 공개하려면 위 수동 검수 목록에 추가하거나, 급여코드 기반 표준 저장소 규칙을 추가합니다.
  return false;
}

export function getApprovedDetailImageUrls(product: Product, media?: ProductMediaLike | null) {
  if (!media) return [];
  const heroUrl = media.heroUrl;
  const galleryUrls = new Set(media.galleryUrls ?? []);
  return Array.from(new Set(media.detailUrls ?? []))
    .filter(Boolean)
    .filter((url) => url !== heroUrl && !galleryUrls.has(url))
    .filter((url) => isApprovedDetailImageUrl(product, url));
}
