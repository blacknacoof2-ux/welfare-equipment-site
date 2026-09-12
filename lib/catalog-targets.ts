export const OFFICIAL_CATALOG_EFFECTIVE_DATE = '2026-09-01';
export const OFFICIAL_CATALOG_NOTICE = '보건복지부고시 제2026-180호';

export const officialCatalogTargets = {
  '이동변기': 21,
  '목욕의자': 25,
  '성인용보행기': 63,
  '안전손잡이': 119,
  '미끄럼방지용품': 105,
  '간이변기': 8,
  '지팡이': 58,
  '욕창예방방석': 25,
  '자세변환용구': 25,
  '요실금팬티': 67,
  '구강세척기': 1,
  '기저귀센서': 1,
  '배회감지기(태그형)': 1,
  '수동휠체어': 47,
  '전동침대': 85,
  '수동침대': 13,
  '이동욕조': 4,
  '배회감지기': 5,
  '욕창예방매트리스': 28,
  '경사로(실내용)': 18,
  '경사로(실외용)': 5,
} as const;

export const OFFICIAL_CATALOG_TOTAL = Object.values(officialCatalogTargets).reduce(
  (sum, count) => sum + count,
  0,
);
