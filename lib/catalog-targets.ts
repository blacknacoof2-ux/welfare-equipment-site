export const OFFICIAL_CATALOG_EFFECTIVE_DATE = '2026-09-01';
export const OFFICIAL_CATALOG_NOTICE = '보건복지부고시 제2026-180호';
export const OFFICIAL_CATALOG_SOURCE_URL =
  'https://www.nhis.or.kr/lm/lmxsrv/law/lawFullContent.do?SEQ=1603&SEQ_HISTORY=601911';

// 2026-09-01 시행 보건복지부고시 제2026-180호 기준 품목별 급여대상 제품 수입니다.
// 총 723개이며, 0개 품목도 전체 품목 구조에서 누락하지 않도록 별도 보관합니다.
export const officialCatalogTargets = {
  '이동변기': 21,
  '목욕의자': 23,
  '성인용보행기': 65,
  '안전손잡이': 116,
  '미끄럼방지용품': 106,
  '간이변기': 8,
  '지팡이': 47,
  '욕창예방방석': 23,
  '자세변환용구': 25,
  '요실금팬티': 72,
  '구강세척기(마우스피스형)': 1,
  '기저귀센서': 1,
  '배회감지기(태그형)': 1,
  '고관절보호대': 0,
  '낙상알림시스템': 0,
  '수동휠체어': 50,
  '전동침대': 88,
  '수동침대': 15,
  '이동욕조': 5,
  '목욕리프트': 0,
  '배회감지기': 5,
  '욕창예방매트리스': 28,
  '경사로(실내용)': 18,
  '경사로(실외용)': 5,
  '이승보조기기': 0,
  '대화형 정서지원기기': 0,
} as const;

export type OfficialCatalogCategory = keyof typeof officialCatalogTargets;

export const OFFICIAL_CATALOG_TOTAL = Object.values(officialCatalogTargets).reduce<number>(
  (sum, count) => sum + count,
  0,
);
