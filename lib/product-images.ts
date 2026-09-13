import type { Product } from './products';
import { getSupplementalDetailImages } from './product-detail-images';

export type ProductMediaSet = {
  heroUrl: string;
  galleryUrls: string[];
  detailUrls: string[];
  sourceLabel: string;
  sourceUrl: string;
  usageBasis: 'CONTRACT_AUTHORIZED' | 'SUPPLIER_AUTHORIZED' | 'OWNED' | 'PUBLIC_REFERENCE';
  detailSourceLabel?: string;
  detailSourceUrl?: string;
};

export type ProductImageSet = {
  urls: string[];
  sourceLabel: string;
  sourceUrl: string;
  usageBasis: ProductMediaSet['usageBasis'];
};

const contractMedia = (
  sourceLabel: string,
  sourceUrl: string,
  heroUrl: string,
  galleryUrls: string[] = [],
  detailUrls: string[] = [],
): ProductMediaSet => ({
  heroUrl,
  galleryUrls,
  detailUrls,
  sourceLabel,
  sourceUrl,
  usageBasis: 'CONTRACT_AUTHORIZED',
});

const publicReferenceMedia = (
  sourceLabel: string,
  sourceUrl: string,
  heroUrl: string,
  galleryUrls: string[] = [],
  detailUrls: string[] = [],
): ProductMediaSet => ({
  heroUrl,
  galleryUrls,
  detailUrls,
  sourceLabel,
  sourceUrl,
  usageBasis: 'PUBLIC_REFERENCE',
});

const unique = (urls: string[]) => Array.from(new Set(urls.filter(Boolean)));

// 공개 상품 이미지는 HERO(대표 제품컷) / GALLERY(다른 각도·색상) / DETAIL(규격·기능·설명)로 명시적으로 분류합니다.
// 텍스트가 포함된 상세 설명 이미지를 배열 순서만으로 대표 이미지로 사용하는 것을 금지합니다.
export const productMediaSets: Record<string, ProductMediaSet> = {
  'wag02-adult-walker': contractMedia(
    'WAG02 제품 이미지',
    'https://eroumcare.com/shop/item.php?it_id=PRO2026013000006',
    'https://www.hukusi-orosi.jp/img/item/s31/054/02.jpg',
    [],
    ['https://godomall.speedycdn.net/e9c45f52a146ba8cbf23a3fd8738b016/goods/1000008875/image/detail/1000008875_detail_053.jpg'],
  ),
  'sporty-adult-walker': contractMedia(
    'SPORTY 제품 이미지',
    'https://eroumcare.com/shop/search.php',
    'https://cdn.imweb.me/upload/S20250508610aa7396002d/7cbbdf2ee8aeb.jpg',
    ['https://cdn-optimized.imweb.me/upload/S20250508610aa7396002d/e364540320d23.jpg?w=800'],
  ),
  'nice-walker-4s': contractMedia(
    '나이스워커4S 제품 이미지',
    'https://eroumcare.com/shop/search.php',
    'https://cdn.imweb.me/thumbnail/20241114/01e547190062e.png',
  ),
  'slt-10-silver-walker': contractMedia(
    'SLT-10 제품 이미지',
    'https://eroumcare.com/shop/search.php',
    'https://cdn-optimized.imweb.me/upload/S202203306f891414d0399/c3f6397fbad68.jpg?w=1920',
    [],
    ['https://bestlifeplus.com/web/product/big/202407/7a3d9516f76ebe0374234c7947c88529.png'],
  ),
  'pn-l4152101d-bath-chair': contractMedia(
    'PN-L4152101D 제품 이미지',
    'https://eroumcare.com/shop/search.php',
    'https://cdn.imweb.me/thumbnail/20260410/adf16493919b3.jpg',
    ['https://cdn.imweb.me/thumbnail/20240403/5bef8c287034c.jpg'],
  ),
  'bofeel10-bath-chair': contractMedia(
    'BOFEEL10 제품 이미지',
    'https://eroumcare.com/shop/search.php',
    'https://shopby-images.cdn-nhncommerce.com/PARTNER/20260306/PARTNER_10016343/202603061441333e7659f85b4646308462a7970197a57f/7s4bk242dCMhHpR9a-bG6A.jpg',
    [],
    ['https://www.yoyangmart.com/files/images/BOFEEL-10-sang.jpg'],
  ),
  'asc-502-bath-chair': contractMedia(
    'ASC-502 제품 이미지',
    'https://www.wells.or.kr/520/?idx=451',
    'https://cdn.imweb.me/upload/S202203306f891414d0399/a1a56903fa30a.png',
  ),
  'iu-bath-chair': contractMedia(
    'IU 목욕의자 제품 이미지',
    'https://careshield.kr/47/?idx=285',
    'https://cdn.imweb.me/thumbnail/20200910/6f2cfa105bada.jpg',
  ),
  'ash-103-safety-handle': contractMedia(
    'ASH-103 제품 이미지',
    'https://eroumcare.com/shop/search.php',
    'https://shopby-images.cdn-nhncommerce.com/Mall-No-SFqz/PARTNER/20260226/PARTNER_10016343/202602261806267ec9570ea4874a1fa90aa3ece930c984/8O5MtJ5R5DlqddguUQxzEQ.jpg',
  ),
  'msp-0002-safety-handle': contractMedia(
    'MSP-0002 제품 이미지',
    'https://www.wells.or.kr/705057299/?idx=2456',
    'https://cdn.imweb.me/thumbnail/20221118/93cc76a951b1a.jpg',
  ),
  'dgp-0006-safety-handle': contractMedia(
    'DGP-0006 제품 이미지',
    'https://maumieum.co.kr/product/%EC%95%88%EC%A0%84%EC%86%90%EC%9E%A1%EC%9D%B4-dgp-0006-%EB%B3%B5%EC%A7%80%EC%9A%A9%EA%B5%AC-%EC%8B%A4%EB%B2%84%EC%9A%A9%ED%92%88/892',
    'https://ai.esmplus.com/ninanomall/welfare/safety/sf-dgp0006-01.jpg',
  ),
  'dgp-0002-safety-handle': contractMedia(
    'DGP-0002 제품 이미지',
    'https://silverwells.kr/50/?idx=3427',
    'https://cdn.imweb.me/upload/S202203306f891414d0399/0f68456b57e92.png',
  ),
  'cd-10-safety-handle': contractMedia(
    'CD-10 제품 이미지',
    'https://caremall.kr/product/detail.html?cate_no=150&display_group=1&product_no=845',
    'https://nulchan.co.kr/web/product/extra/big/202501/bf9f0c022dfd4e4d345fa13546064c9d.jpg',
  ),
  'apt-101-portable-toilet': contractMedia(
    'APT-101 제품 이미지',
    'https://www.greymall.co.kr/goods/goods_view.php?goodsNo=1000000300',
    'https://godomall.speedycdn.net/e9c45f52a146ba8cbf23a3fd8738b016/goods/1000000300/image/detail/1000000300_detail_076.JPG',
    [
      'https://godomall.speedycdn.net/e9c45f52a146ba8cbf23a3fd8738b016/goods/1000000300/image/detail/1000000300_detail_19.JPG',
      'https://godomall.speedycdn.net/e9c45f52a146ba8cbf23a3fd8738b016/goods/1000000300/image/detail/1000000300_detail_241.JPG',
    ],
  ),
  'da-006-anti-slip-mat': contractMedia(
    'DA-006 제품 이미지',
    'https://eroumcare.com/shop/search.php',
    'https://shopby-images.cdn-nhncommerce.com/PARTNER/20260306/PARTNER_10016343/202603060940309a58848f3e0c43d19a3ce0f156dbc54b/1STn-Pk0trdvVBPa28Jp2g.jpg',
    ['https://shopby-images.cdn-nhncommerce.com/PARTNER/20260306/PARTNER_10016343/202603060940309a58848f3e0c43d19a3ce0f156dbc54b/ZZYDJ_102815_7.jpg'],
  ),
  'ss-carbon-cane': contractMedia(
    'SS 지팡이 제품 이미지',
    'https://eroumcare.com/shop/search.php',
    'https://wjdwhdrkr.cafe24.com/web/upload/NNEditor/20230804/e52c10e6ba24724e9764ab53dc374c6d.jpg',
  ),
  'glory-11-pressure-cushion': contractMedia(
    'GLORY-11 제품 이미지',
    'https://eroumcare.com/shop/search.php',
    'https://shopby-images.cdn-nhncommerce.com/PARTNER/20260227/PARTNER_10016343/20260227132213bf532ba83d3e49038a4e7dbb435b97b6/zYwQ5vwaJD_5pEivrlaOHg.jpg',
    [],
    [
      'https://shopby-images.cdn-nhncommerce.com/PARTNER/20260227/PARTNER_10016343/20260227132213bf532ba83d3e49038a4e7dbb435b97b6/dR8a2_102722_7.jpg',
      'https://shopby-images.cdn-nhncommerce.com/PARTNER/20260227/PARTNER_10016343/20260227132213bf532ba83d3e49038a4e7dbb435b97b6/L9ZJO_102722_8.jpg',
      'https://shopby-images.cdn-nhncommerce.com/PARTNER/20260227/PARTNER_10016343/20260227132213bf532ba83d3e49038a4e7dbb435b97b6/Vk2GD_102722_9.jpg',
    ],
  ),
  'yh-0302tpu-pressure-mattress': contractMedia(
    'YH-0302TPU 제품 이미지',
    'https://eroumcare.com/shop/search.php',
    'https://silver365.co.kr/files/images/YH-0302TPU.jpg',
    ['https://cdn.imweb.me/thumbnail/20260204/00cf60a0fdb52.png'],
  ),
  'sw-m260-anti-slip-mat': contractMedia(
    'SW-M260 제품 이미지',
    'https://eroumcare.com/shop/search.php',
    'https://komsn.co.kr/web/product/big/202510/eeccb6c5d0377af9a6920f1bd7bcb28a.jpg',
    [],
    ['https://cdn.imweb.me/upload/S202203306f891414d0399/f490603e04f4e.png'],
  ),
  'bofeel9-bath-chair': contractMedia(
    'BOFEEL9 제품 이미지',
    'https://eroumcare.com/shop/search.php',
    'https://cdn.imweb.me/thumbnail/20240923/3c62f7a8ff74a.jpg',
    ['https://maumieum.co.kr/web/product/big/202312/93c2ff19d11901d5d7cd5b484d228913.jpg'],
  ),
  'isa-carbon-cane': contractMedia(
    'ISA 지팡이 제품 이미지',
    'https://eroumcare.com/shop/search.php',
    'https://thumbnail.coupangcdn.com/thumbnails/remote/492x492ex/image/vendor_inventory/1096/747b70d7b5af1d6ffe4399af7824349fefafb893d52ade370f4c3441fbdf.jpg',
  ),
  'bls-900-anti-slip-mat': contractMedia(
    'BLS-900 제품 이미지',
    'https://www.greymall.co.kr/goods/goods_view.php?goodsNo=1000008754',
    'https://cdn.shopimg.greyscale.co.kr/uploads/001/005/BLS-900/Thumbnail_01.jpg',
    [],
    ['https://cdn.shopimg.greyscale.co.kr/uploads/001/005/BLS-900/BLS-900.jpg?v=2'],
  ),
  'samb-portable-toilet': contractMedia(
    'SAMB 제품 이미지',
    'https://eroumcare.com/shop/search.php',
    'https://shopby-images.cdn-nhncommerce.com/PARTNER/20251204/PARTNER_10016343/20251204101312d7e6604f91a044238be47e7b4444b4b1/vdF8Y--Dj7ivKifzZwj--Q.png',
  ),
  'yga03-safety-handle': contractMedia(
    'YGA03 제품 이미지',
    'https://eroumcare.com/shop/search.php',
    'https://www.silvercm.co.kr/files/images/1327052580.jpg',
    [],
    ['https://singymall.kr/web/upload/NNEditor/20201215/detail2_YGA003.jpg'],
  ),
  'cv200-safety-handle': contractMedia(
    'CV200 제품 이미지',
    'https://eroumcare.com/shop/search.php',
    'https://cdn.imweb.me/thumbnail/20221106/c7ef5b3683d37.jpg',
    [],
    ['https://www.yoyangmart.com/files/product/CV200-spec-05.jpg'],
  ),
  'lp-021-incontinence-underwear': contractMedia(
    'LP-021 보나수 제품 이미지',
    'https://eroumcare.com/shop/search.php',
    'https://cdn-optimized.imweb.me/upload/S202308312e649fd16a68a/031e75b2ece98.jpg?w=1920',
    [],
    ['https://ecimg.cafe24img.com/pg508b19095750052/silvermp/web/product/extra/big/20250612/e404e31a9c90a71278ca659c7c1a2e54.png'],
  ),
  'abp-105-bedpan-urinal': contractMedia(
    'ABP-105 제품 이미지',
    'https://eroumcare.com/shop/search.php',
    'https://m.amemall.co.kr/web/product/big/202208/f77144ca8ae68368041c7747bf2d18f5.jpg',
  ),
  'ata-4030-positioning-aid': contractMedia(
    'ATA-4030 제품 이미지',
    'https://eroumcare.com/shop/search.php',
    'https://m.dainhome.co.kr/web/product/big/202404/b146e937202d7e054281dc954e0b0848.jpg',
    ['https://shopby-images.cdn-nhncommerce.com/PARTNER/20260306/PARTNER_10016343/202603061447042abfc39108324be5b60727f51567fb1c/xXH5ahYHT7Jge8R89byBeg.jpg'],
  ),
  'ygm3-indoor-ramp': contractMedia(
    'YGM3 제품 이미지',
    'https://eroumcare.com/shop/search.php',
    'https://www.yoyangmart.com/files/product/YGM3-01.jpg',
  ),
  'miki-jtn-manual-wheelchair': contractMedia(
    'MIKI-JTN 제품 이미지',
    'https://woosunghc.com/product/%EC%88%98%EB%8F%99%ED%9C%A0%EC%B2%B4%EC%96%B4-%EC%9D%BC%EB%B0%98%ED%98%95-miki-jtn/170/display/1/',
    'https://ecimg.cafe24img.com/pg1933b57773798091/woosunghc/web/product/small/20251123/ce46b417a462c89f78916889fb390288.png',
    ['https://ecimg.cafe24img.com/pg1933b57773798091/woosunghc/web/product/extra/small/20251123/2d5f46a778528e2b747e59d5bfddfb89.png'],
  ),
  'ds-801a-manual-wheelchair': contractMedia(
    'DS-801A 제품 이미지',
    'https://eroumcare.com/shop/search.php',
    'https://cdn-optimized.imweb.me/thumbnail/20221108/044d285a0a414.jpg?w=750',
  ),
  'se7030-electric-bed': contractMedia(
    'SE7030 제품 이미지',
    'https://gagaon.com/shop/item.php?it_id=S03090183002',
    'https://gagaon.com/data/editor/2602/01b3bea2a86eeb0ba426a4e70c76e8a7_1772165464_333.jpg',
    [],
    [
      'https://gagaon.com/data/editor/2511/afabad899fdcf314d7e5668eda1855c6_1762239538_0255.jpg',
      'https://gagaon.com/data/editor/2511/afabad899fdcf314d7e5668eda1855c6_1762239539_6711.jpg',
      'https://gagaon.com/data/editor/2511/afabad899fdcf314d7e5668eda1855c6_1762239541_1844.jpg',
    ],
  ),
  'f18030060113-safety-handle': publicReferenceMedia(
    'ASH-120 제품 이미지',
    'https://ddoga.co.kr/store/product/129347998',
    'https://shopby-images.cdn-nhncommerce.com/PARTNER/20251218/PARTNER_10016343/202512180941264b24d8b5b9ab4ff2b05a180276e858c1/afZPgIHGjzf6-lDLfu4OWg.png',
  ),
  'f18030045119-safety-handle': publicReferenceMedia(
    'YGC01 제품 이미지',
    'https://www.wells.or.kr/197/?idx=66',
    'https://cdn.imweb.me/thumbnail/20241121/d0efe16fd9854.png',
  ),
  'f18030045118-safety-handle': publicReferenceMedia(
    'YGC001 제품 이미지',
    'https://www.wells.or.kr/705057299/?idx=1421',
    'https://cdn.imweb.me/thumbnail/20260208/1559d12907726.png',
  ),
};

// Backward-compatible export name for any code that still imports the old registry symbol.
export const productImageSets = productMediaSets;

export function getProductMedia(product: Product): ProductMediaSet | null {
  const explicit = productMediaSets[product.slug];
  const supplemental = getSupplementalDetailImages(product.slug);

  if (explicit) {
    const galleryUrls = unique(explicit.galleryUrls).filter((url) => url !== explicit.heroUrl);
    const detailUrls = unique([
      ...explicit.detailUrls,
      ...(supplemental?.urls ?? []),
    ]).filter((url) => url !== explicit.heroUrl && !galleryUrls.includes(url));

    return {
      ...explicit,
      galleryUrls,
      detailUrls,
      detailSourceLabel: supplemental?.sourceLabel,
      detailSourceUrl: supplemental?.sourceUrl,
    };
  }

  const directUrls = unique([
    ...(product.imageUrls ?? []),
    ...(product.imageUrl ? [product.imageUrl] : []),
  ]);

  if (product.imageRightsConfirmed && directUrls.length > 0) {
    const heroUrl = directUrls[0];
    const galleryUrls = directUrls.slice(1);
    const detailUrls = unique(supplemental?.urls ?? [])
      .filter((url) => url !== heroUrl && !galleryUrls.includes(url));

    return {
      heroUrl,
      galleryUrls,
      detailUrls,
      sourceLabel: '제품 공급 이미지',
      sourceUrl: product.sourceUrl,
      usageBasis: 'SUPPLIER_AUTHORIZED',
      detailSourceLabel: supplemental?.sourceLabel,
      detailSourceUrl: supplemental?.sourceUrl,
    };
  }

  return null;
}

// 기존 호출부 호환용. 새 UI에서는 getProductMedia()의 역할별 필드를 사용해야 합니다.
export function getAuthorizedProductImages(product: Product): ProductImageSet | null {
  const media = getProductMedia(product);
  if (!media) return null;

  return {
    urls: unique([media.heroUrl, ...media.galleryUrls, ...media.detailUrls]),
    sourceLabel: media.sourceLabel,
    sourceUrl: media.sourceUrl,
    usageBasis: media.usageBasis,
  };
}

export function hasAuthorizedProductImages(product: Product) {
  return Boolean(getProductMedia(product)?.heroUrl);
}
