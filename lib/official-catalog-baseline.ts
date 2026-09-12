export type OfficialCatalogBaseline = {
  category: string;
  benefitMode: 'PURCHASE' | 'RENTAL' | 'PURCHASE_OR_RENTAL';
  officialProductCount: number;
};

// 국민건강보험공단 건강Law
// 보건복지부고시 제2026-180호, 2026-09-01 시행
export const OFFICIAL_CATALOG_EFFECTIVE_DATE = '2026-09-01';
export const OFFICIAL_CATALOG_NOTICE = '보건복지부고시 제2026-180호';
export const OFFICIAL_CATALOG_SOURCE_URL =
  'https://www.nhis.or.kr/lm/lmxsrv/law/lawFullContent.do?SEQ=1603&SEQ_HISTORY=';

export const officialCatalogBaseline: OfficialCatalogBaseline[] = [
  { category: '이동변기', benefitMode: 'PURCHASE', officialProductCount: 21 },
  { category: '목욕의자', benefitMode: 'PURCHASE', officialProductCount: 25 },
  { category: '성인용보행기', benefitMode: 'PURCHASE', officialProductCount: 63 },
  { category: '안전손잡이', benefitMode: 'PURCHASE', officialProductCount: 119 },
  { category: '미끄럼방지용품', benefitMode: 'PURCHASE', officialProductCount: 105 },
  { category: '간이변기', benefitMode: 'PURCHASE', officialProductCount: 8 },
  { category: '지팡이', benefitMode: 'PURCHASE', officialProductCount: 58 },
  { category: '욕창예방방석', benefitMode: 'PURCHASE', officialProductCount: 25 },
  { category: '자세변환용구', benefitMode: 'PURCHASE', officialProductCount: 25 },
  { category: '요실금팬티', benefitMode: 'PURCHASE', officialProductCount: 67 },
  { category: '구강세척기(마우스피스형)', benefitMode: 'PURCHASE', officialProductCount: 1 },
  { category: '기저귀센서', benefitMode: 'PURCHASE', officialProductCount: 1 },
  { category: '배회감지기(태그형)', benefitMode: 'PURCHASE', officialProductCount: 1 },
  { category: '고관절보호대', benefitMode: 'PURCHASE', officialProductCount: 0 },
  { category: '낙상알림시스템', benefitMode: 'PURCHASE', officialProductCount: 0 },
  { category: '수동휠체어', benefitMode: 'RENTAL', officialProductCount: 47 },
  { category: '전동침대', benefitMode: 'RENTAL', officialProductCount: 85 },
  { category: '수동침대', benefitMode: 'RENTAL', officialProductCount: 13 },
  { category: '이동욕조', benefitMode: 'RENTAL', officialProductCount: 4 },
  { category: '목욕리프트', benefitMode: 'RENTAL', officialProductCount: 0 },
  { category: '배회감지기', benefitMode: 'RENTAL', officialProductCount: 5 },
  { category: '욕창예방매트리스', benefitMode: 'PURCHASE_OR_RENTAL', officialProductCount: 28 },
  { category: '경사로(실내용)', benefitMode: 'PURCHASE_OR_RENTAL', officialProductCount: 18 },
  { category: '경사로(실외용)', benefitMode: 'PURCHASE_OR_RENTAL', officialProductCount: 5 },
  { category: '이승보조기기', benefitMode: 'PURCHASE_OR_RENTAL', officialProductCount: 0 },
  { category: '대화형 정서지원기기', benefitMode: 'PURCHASE_OR_RENTAL', officialProductCount: 0 },
];

export const OFFICIAL_PURCHASE_PRODUCT_COUNT = officialCatalogBaseline
  .filter((item) => item.benefitMode === 'PURCHASE')
  .reduce((sum, item) => sum + item.officialProductCount, 0);

export const OFFICIAL_RENTAL_PRODUCT_COUNT = officialCatalogBaseline
  .filter((item) => item.benefitMode === 'RENTAL')
  .reduce((sum, item) => sum + item.officialProductCount, 0);

export const OFFICIAL_PURCHASE_OR_RENTAL_PRODUCT_COUNT = officialCatalogBaseline
  .filter((item) => item.benefitMode === 'PURCHASE_OR_RENTAL')
  .reduce((sum, item) => sum + item.officialProductCount, 0);

export const OFFICIAL_TOTAL_PRODUCT_COUNT = officialCatalogBaseline.reduce(
  (sum, item) => sum + item.officialProductCount,
  0,
);
