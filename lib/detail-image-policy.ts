import type { Product } from './products';

type ProductMediaLike = {
  heroUrl?: string;
  galleryUrls?: string[];
  detailUrls?: string[];
};

// 동일 모델·급여코드로 수집된 상세이미지는 다시 노출하되,
// 실제 검수에서 판매업체 연락처·서비스지역·주문안내가 확인된 이미지는 명시적으로 차단합니다.
export const BLOCKED_SELLER_DETAIL_URLS = new Set([
  // 천년BED ST-30: 판매업체 연락처/서비스지역이 포함된 상세 판매 시트.
  'https://gagaon.com/data/editor/2602/01b3bea2a86eeb0ba426a4e70c76e8a7_1772165443_1595.jpg',
]);

// 상품 상세 설명이 아니라 공지/배너/몰 소개 성격이 강한 이미지는 계속 제외합니다.
const NON_PRODUCT_DETAIL_MARKERS = [
  '/banner/',
  '/intro/',
  'notice_',
  '/event/',
];

function normalize(url: string) {
  return url.trim().toLowerCase();
}

function looksLikeImageUrl(url: string) {
  return /\.(?:webp|png|gif|jpe?g)(?:\?.*)?$/i.test(url);
}

export function isApprovedDetailImageUrl(_product: Product, url: string) {
  if (!url) return false;
  if (BLOCKED_SELLER_DETAIL_URLS.has(url)) return false;

  const normalized = normalize(url);
  if (!normalized.startsWith('https://')) return false;
  if (!looksLikeImageUrl(url)) return false;
  if (NON_PRODUCT_DETAIL_MARKERS.some((marker) => normalized.includes(marker))) return false;

  // media.detailUrls 자체가 수집 단계에서 동일 모델명 또는 동일 급여코드로 매칭된 자료입니다.
  // 과거처럼 /data/editor/ 또는 /NNEditor/ 경로 전체를 차단하면 정상 상세페이지까지 사라지므로
  // 경로만으로 일괄 차단하지 않고, 실제 문제 이미지 위주로 차단합니다.
  return true;
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
