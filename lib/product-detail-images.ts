export type SupplementalDetailImageSet = {
  sourceLabel: string;
  sourceUrl: string;
  urls: string[];
};

// 대표 이미지 외에 제품 구조·기능·설치·규격을 설명하는 모델별 상세 이미지입니다.
// 모델명이 정확히 일치하는 공개 제품 상세 자료만 등록합니다.
export const supplementalDetailImageSets: Record<string, SupplementalDetailImageSet> = {
  'nice-walker-4s': {
    sourceLabel: '나이스워커4S 기능 상세 자료',
    sourceUrl: 'https://m.escaremall.com/product/%EB%B3%B4%ED%96%89%EB%B3%B4%EC%A1%B0%EC%B0%A8-%EB%82%98%EC%9D%B4%EC%8A%A4%EC%9B%8C%EC%BB%A4-4s-%EC%9E%90%EB%8F%99%EC%86%8D%EB%8F%84%EC%A0%9C%EC%96%B4/397/',
    urls: [
      'https://m.escaremall.com/web/upload/NNEditor/20200128/%EC%83%81%EC%84%B83_shop1_005905.jpg',
    ],
  },
  'asc-502-bath-chair': {
    sourceLabel: 'ASC-502 기능·높이조절 상세 자료',
    sourceUrl: 'https://m.k-medi.co.kr/product/%EB%B3%B5%EC%A7%80%EC%9A%A9%EA%B5%AC-%EA%B5%AC%EC%9E%85%ED%92%88%EB%AA%A9-%EB%AA%A9%EC%9A%95%EC%9D%98%EC%9E%90-%EB%B3%B5%EC%A7%80%EC%9A%A9%EA%B5%AC-%ED%99%98%EC%9E%90%EB%AA%A9%EC%9A%95%EC%9D%98%EC%9E%90-%EC%A0%91%EC%9D%B4%EC%8B%9D%EB%AA%A9%EC%9A%95%EC%9D%98%EC%9E%90-asc-502/278/',
    urls: [
      'https://m.k-medi.co.kr/web/upload/NNEditor/20220809/mobile/01e2a0e4fa860eb6c47a1b2a9ce4ea20_1660021630.jpg',
      'https://shopby-images.cdn-nhncommerce.com/PARTNER/20260306/PARTNER_10016343/2026030614411927476813d63a4fa1987ab1be76564dc4/uQ3XZ_102745_7.jpg',
      'https://shopby-images.cdn-nhncommerce.com/PARTNER/20260306/PARTNER_10016343/2026030614411927476813d63a4fa1987ab1be76564dc4/ZQcxi_102745_8.jpg',
      'https://shopby-images.cdn-nhncommerce.com/PARTNER/20260306/PARTNER_10016343/2026030614411927476813d63a4fa1987ab1be76564dc4/lxwMn_102745_9.jpg',
    ],
  },
  'iu-bath-chair': {
    sourceLabel: 'IU 목욕의자 원터치 접이·높이조절 상세 자료',
    sourceUrl: 'https://m.swmedi.co.kr/product/%EC%BC%80%EC%96%B4%EB%A7%A5%EC%8A%A4-%EB%AA%A9%EC%9A%95%EC%9D%98%EC%9E%90-iu-%EC%9B%90%ED%84%B0%EC%B9%98%EC%A0%91%EC%9D%B4%EC%8B%9D%ED%8C%94%EA%B1%B8%EC%9D%B4%EC%8A%A4%EC%9C%99%EB%86%92%EC%9D%B4%EC%A1%B0%EC%A0%88/27728/',
    urls: [
      'https://m.swmedi.co.kr/web/product/big/202503/5bc611c8fb398093becd27a5bd7fa69c.jpg',
    ],
  },
  'ash-103-safety-handle': {
    sourceLabel: 'ASH-103 제품사양·설치형 상세 자료',
    sourceUrl: 'https://eonecare.co.kr/product/%EB%B2%BD%EB%B6%80%EC%B0%A9%ED%98%95-%EC%95%88%EC%A0%84%EC%86%90%EC%9E%A1%EC%9D%B4-ash-103-60cm-%EC%9B%90%EB%AA%A9-%EC%9E%A5%EC%95%A0%EC%9D%B8%EC%9A%A9%EC%86%90%EC%9E%A1%EC%9D%B4-%EB%B3%B4%EC%A1%B0%EC%86%90%EC%9E%A1%EC%9D%B4-%EC%95%88%EC%A0%84%EB%B0%94/1660/',
    urls: [
      'https://gi.esmplus.com/tktkfkd/ASH-10301010.jpg',
    ],
  },
  'msp-0002-safety-handle': {
    sourceLabel: 'MSP-0002 스탠드형 안전손잡이 상세 자료',
    sourceUrl: 'https://www.greymall.co.kr/goods/goods_view.php?goodsNo=1000000500',
    urls: [
      'https://cdn-pro-web-250-117.cdn-nhncommerce.com/greyscale_godomall_com/data/editor/goods/230217/27a6c6e1ed581cd61873588138f67e62_091603.png',
    ],
  },
  'dgp-0006-safety-handle': {
    sourceLabel: 'DGP-0006 사이드바 상세 자료',
    sourceUrl: 'https://ddoga.co.kr/store/product/129347846',
    urls: [
      'https://joa3817.cafe24.com/joa/img/AA144.jpg',
    ],
  },
  'dgp-0002-safety-handle': {
    sourceLabel: 'DGP-0002 기능 상세 자료',
    sourceUrl: 'https://ddoga.co.kr/store/product/129347851',
    urls: [
      'https://joa3817.cafe24.com/joa/ddoga/11/DGP-0002/DGP-0002_C_250512.jpg',
    ],
  },
  'cd-10-safety-handle': {
    sourceLabel: 'CD-10 설치 형태 상세 자료',
    sourceUrl: 'https://nulchan.co.kr/product/%EA%B5%AD%EC%82%B0-%EC%95%88%EC%A0%84%EC%86%90%EC%9E%A1%EC%9D%B4-%EA%B8%B0%EB%91%A5%ED%98%95-cd-10-%EC%96%B4%EB%A5%B4%EC%8B%A0-%EB%85%B8%EC%9D%B8-%EB%B3%B4%EC%A1%B0-%EC%B9%A8%EB%8C%80-%EC%95%88%EC%A0%84%EB%B4%89-%EC%B2%9C%EC%A0%95%ED%98%95-%EB%B4%89%EC%86%90%EC%9E%A1%EC%9D%B4-%EC%9E%A5%EA%B8%B0%EC%9A%94%EC%96%91-%EB%B3%B5%EC%A7%80%EC%9A%A9%EA%B5%AC/1073/',
    urls: [
      'https://nulchan.co.kr/web/product/extra/big/202501/bf9f0c022dfd4e4d345fa13546064c9d.jpg',
    ],
  },
  'ss-carbon-cane': {
    sourceLabel: 'SS 카본 지팡이 제품·기능 상세 자료',
    sourceUrl: 'https://www.greymall.co.kr/goods/goods_view.php?goodsNo=1000000288',
    urls: [
      'https://cdn-pro-web-250-117.cdn-nhncommerce.com/greyscale_godomall_com/data/editor/goods/240320/4d53e50673f43acfa9ead97b7c9c48ee_100845.jpg',
      'https://cdn-pro-web-250-117.cdn-nhncommerce.com/greyscale_godomall_com/data/editor/goods/240320/56663df5b41051664bc4bfa3037f1ba8_100920.jpg',
      'https://cdn-pro-web-250-117.cdn-nhncommerce.com/greyscale_godomall_com/data/editor/goods/221214/d6bfed6902e4328adbc26dc7fdc13d42_074410.jpg',
    ],
  },
  'isa-carbon-cane': {
    sourceLabel: 'ISA 카본 지팡이 기능 상세 자료',
    sourceUrl: 'https://maumieum.co.kr/product/%EB%B3%B5%EC%A7%80%EC%9A%A9%EA%B5%AC-%EC%A7%80%ED%8C%A1%EC%9D%B4-isa-%EC%B4%88%EA%B2%BD%EB%9F%89-%EC%B9%B4%EB%B3%B8-aion/590/',
    urls: [
      'https://ai.esmplus.com/ninanomall/welfare/stick/st-isa-03.jpg',
    ],
  },
  'samb-portable-toilet': {
    sourceLabel: 'SAMB 이동변기 제품 상세 자료',
    sourceUrl: 'https://ddoga.co.kr/store/product/129348448',
    urls: [
      'https://shopby-images.cdn-nhncommerce.com/PARTNER/20260306/PARTNER_10016343/20260306093817ece828aa970f423b9c6881b15c7ee85e/GIjZiUXwWfT-dl9NWyWHjg.jpg',
    ],
  },
  'abp-105-bedpan-urinal': {
    sourceLabel: 'ABP-105 포함 간이변기 규격 비교표',
    sourceUrl: 'https://www.greymall.co.kr/intro/sizelist.php',
    urls: [
      'https://cdn-pro-web-250-117.cdn-nhncommerce.com/greyscale_godomall_com/data/skin/front/moment/img/banner/8b3ece2d9a5e8fd675f2e769402b4d60_98269.png',
    ],
  },
  'ygm3-indoor-ramp': {
    sourceLabel: 'YGM3 설치방법 상세 자료',
    sourceUrl: 'https://ddoga.co.kr/store/product/129348587',
    urls: [
      'https://joa3817.cafe24.com/joa/img/YGM3.jpg',
    ],
  },
  'ds-801a-manual-wheelchair': {
    sourceLabel: 'DS-801A 기능·규격 상세 자료',
    sourceUrl: 'https://careshield.kr/169/?idx=1107',
    urls: [
      'https://cdn-optimized.imweb.me/upload/S201901205c43e2a37e5fa/11dc9f69e9072.jpg?w=1920',
      'https://contents.sixshop.com/thumbnails/uploadedFiles/66867/product/image_1756868349129_1000.jpg',
    ],
  },
};

export function getSupplementalDetailImages(slug: string) {
  return supplementalDetailImageSets[slug] ?? null;
}
