export type ProductStatus =
  | 'ACTIVE'
  | 'DISCONTINUED'
  | 'NOT_DISTRIBUTED'
  | 'OUT_OF_STOCK'
  | 'TEMP_OUT_OF_STOCK';

export type VerificationSource = {
  label: string;
  url: string;
  checkedAt: string;
};

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
  description: string;
  material?: string;
  dimensions?: string;
  weightKg?: number;
  purchaseCycleYears?: number;
  maxQuantityPerCycle?: number;
  imageUrl?: string;
  imageRightsConfirmed?: boolean;
  verificationSources: VerificationSource[];
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

// 등록 원칙
// 1) 이로움 기준 단종 / 비유통 / 품절 / 일시품절은 게시하지 않습니다.
// 2) 급여코드와 급여가격은 별도 급여 데이터와 교차검증합니다.
// 3) 제품 이미지는 제조사/공급사로부터 사용권이 확인된 경우에만 imageUrl을 활성화합니다.
// 4) 사이트 가격 표시는 15% / 9% / 6% 본인부담금만 사용하며 0%는 노출하지 않습니다.
export const products: Product[] = [
  {
    slug: 'wag02-adult-walker',
    name: 'WAG02',
    model: 'WAG02',
    manufacturer: '(주)미라클메디',
    benefitCode: 'M06090217502',
    category: '성인용보행기',
    benefitPrice: 468000,
    status: 'ACTIVE',
    sourceUrl: 'https://eroumcare.com/shop/search.php?ca_id=&itmaker=&itmodel=&page=26&pttag=&q=&qbasic=&qexplan=&qid=&qname=1&qorder=&qsort=&qtag=',
    sourceCheckedAt: '2026-09-12',
    description: '알루미늄 프레임의 경량 성인용보행기입니다. 접이식 구조로 이동과 보관이 편리하며 실내외 보행 보조에 적합합니다.',
    material: '알루미늄, 폴리프로필렌, EVA',
    dimensions: '50 × 63.5 × 80~95cm',
    weightKg: 4.9,
    purchaseCycleYears: 5,
    maxQuantityPerCycle: 2,
    imageRightsConfirmed: false,
    verificationSources: [
      {
        label: '이로움 정상 유통 검색 결과',
        url: 'https://eroumcare.com/shop/search.php?ca_id=&itmaker=&itmodel=&page=26&pttag=&q=&qbasic=&qexplan=&qid=&qname=1&qorder=&qsort=&qtag=',
        checkedAt: '2026-09-12',
      },
      {
        label: '급여코드·가격·유통중 교차검증',
        url: 'https://www.carestore.co.kr/welfare/M06090217502',
        checkedAt: '2026-09-12',
      },
    ],
  },
  {
    slug: 'sporty-adult-walker',
    name: 'SPORTY',
    model: 'SPORTY',
    manufacturer: '우진WMD',
    benefitCode: 'M06061285601',
    category: '성인용보행기',
    benefitPrice: 550000,
    status: 'ACTIVE',
    sourceUrl: 'https://eroumcare.com/shop/search.php?ca_id=&itmodel=&page=8&pttag=&q=&qbasic=&qexplan=&qid=&qname=1&qorder=&qsort=&qtag=',
    sourceCheckedAt: '2026-09-12',
    description: '카본 소재를 사용한 성인용 롤레이터형 보행기입니다. 큰 바퀴와 접이식 구조를 갖춰 실내외 보행 보조와 이동 편의성을 고려한 제품입니다.',
    material: '카본, PVC, PP+PU, 나일론',
    dimensions: '49 × 70 × 83~93cm (좌면높이 52cm)',
    weightKg: 6.45,
    purchaseCycleYears: 5,
    maxQuantityPerCycle: 2,
    imageRightsConfirmed: false,
    verificationSources: [
      {
        label: '이로움 정상 유통 검색 결과',
        url: 'https://eroumcare.com/shop/search.php?ca_id=&itmodel=&page=8&pttag=&q=&qbasic=&qexplan=&qid=&qname=1&qorder=&qsort=&qtag=',
        checkedAt: '2026-09-12',
      },
      {
        label: '급여코드·가격·유통중 교차검증',
        url: 'https://www.carestore.co.kr/welfare/M06061285601',
        checkedAt: '2026-09-12',
      },
    ],
  },
];

export const publishedProducts = products.filter(isPublishable);
