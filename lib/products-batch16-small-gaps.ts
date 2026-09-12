import type { Product } from './products';

const checkedAt = '2026-09-12';
const currentNhOfficial =
  'https://www.nhis.or.kr/lm/lmxsrv/law/lawFullContent.do?SEQ=1603&SEQ_HISTORY=';
const historicalNotice = 'https://koa.or.kr/bbs/download.php?code=insurance&number=31899';

export const smallGapBatch: Product[] = [
  {
    slug: 'yh-2023-portable-bath',
    name: 'YH-2023',
    model: 'YH-2023',
    manufacturer: '영화의료기',
    benefitCode: 'B03030031101',
    category: '이동욕조',
    benefitPrice: 34600,
    benefitMode: 'RENTAL',
    status: 'PENDING_EROUM_VERIFICATION',
    sourceUrl: currentNhOfficial,
    sourceCheckedAt: checkedAt,
    description: '영화의료기 이동욕조 대여 급여제품 후보입니다. 현행 공단 고시의 이동욕조 4개 품목수와 고시 이력의 제품코드·월 대여가격을 대조했으며, 이로움 현재 정상 유통 및 현행 제품표 직접 확인 전까지 비공개합니다.',
    dimensions: '83 × 135 × 83cm',
    weightKg: 3.3,
    purchaseCycleYears: 5,
    maxQuantityPerCycle: 1,
    imageRightsConfirmed: false,
    verificationSources: [
      {
        label: 'NHIS 2026-09-01 현행 고시 이동욕조 공식 품목수 확인',
        url: currentNhOfficial,
        checkedAt,
      },
      {
        label: '고시 이력 제품코드·월 대여 급여가격 확인',
        url: historicalNotice,
        checkedAt,
      },
    ],
  },
  {
    slug: 'neyo-100-wander-detector',
    name: 'NEYO-100',
    model: 'NEYO-100',
    manufacturer: '사람을보호하는기업',
    benefitCode: 'C18151060101',
    category: '배회감지기',
    benefitPrice: 21300,
    benefitMode: 'RENTAL',
    status: 'PENDING_EROUM_VERIFICATION',
    sourceUrl: 'https://www.carestore.co.kr/welfare/C18151060101',
    sourceCheckedAt: checkedAt,
    description: 'GPS 기반 배회감지기 대여 급여제품 후보입니다. 현행 공단 고시는 배회감지기 5개를 유지하고 있으며 코드·가격 이력도 확인했습니다. 이로움 현재 유통 여부 최종 확인 전까지 비공개합니다.',
    purchaseCycleYears: 5,
    maxQuantityPerCycle: 1,
    imageRightsConfirmed: false,
    verificationSources: [
      {
        label: '제품코드·월 대여가격 및 유통상태 참고',
        url: 'https://www.carestore.co.kr/welfare/C18151060101',
        checkedAt,
      },
      {
        label: 'NHIS 2026-09-01 현행 고시 배회감지기 공식 품목수 확인',
        url: currentNhOfficial,
        checkedAt,
      },
      {
        label: '고시 이력 제품코드·월 대여가격 확인',
        url: historicalNotice,
        checkedAt,
      },
    ],
  },
  ...[
    ['WR04-3.4', '가나안', 'F24001007601', 9400],
    ['IW-101', '일원기계', 'F24001027101', 25500],
    ['KD-001', '케이디이엔지', 'F24001024101', 25400],
  ].map(([name, manufacturer, benefitCode, benefitPrice]) => ({
    slug: `${String(benefitCode).toLowerCase()}-outdoor-ramp`,
    name: String(name),
    model: String(name),
    manufacturer: String(manufacturer),
    benefitCode: String(benefitCode),
    category: '경사로(실외용)',
    benefitPrice: Number(benefitPrice),
    benefitMode: 'RENTAL' as const,
    status: 'PENDING_EROUM_VERIFICATION' as const,
    sourceUrl: currentNhOfficial,
    sourceCheckedAt: checkedAt,
    description: `${String(name)} 실외용 경사로 대여 급여제품 후보입니다. 현행 공단 고시의 실외용 경사로 5개 품목수와 고시 이력의 제품코드·월 대여가격을 대조했으며 이로움 현재 유통 확인 전까지 비공개합니다.`,
    purchaseCycleYears: 8,
    maxQuantityPerCycle: 1,
    imageRightsConfirmed: false,
    verificationSources: [
      {
        label: 'NHIS 2026-09-01 현행 고시 실외용 경사로 공식 품목수 확인',
        url: currentNhOfficial,
        checkedAt,
      },
      {
        label: '고시 이력 제품코드·월 대여가격 확인',
        url: historicalNotice,
        checkedAt,
      },
    ],
  } satisfies Product)),
];
