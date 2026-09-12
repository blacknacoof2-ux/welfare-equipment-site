import type { Product } from './products';

const checkedAt = '2026-09-12';

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
    sourceUrl: 'https://www.data.go.kr/data/15153624/fileData.do?recommendDataYn=Y',
    sourceCheckedAt: checkedAt,
    description: '영화의료기 이동욕조 대여 급여제품입니다. 급여코드와 월 대여 급여가격을 확인했으며 이로움 현재 정상 유통 확인 전까지 비공개합니다.',
    dimensions: '83 × 135 × 83cm',
    weightKg: 3.3,
    purchaseCycleYears: 5,
    maxQuantityPerCycle: 1,
    imageRightsConfirmed: false,
    verificationSources: [
      {
        label: '공공데이터포털 복지용구 제품 코드·규격 확인',
        url: 'https://www.data.go.kr/data/15153624/fileData.do?recommendDataYn=Y',
        checkedAt,
      },
      {
        label: '고시 이력 월 대여 급여가격 확인',
        url: 'https://koa.or.kr/bbs/download.php?code=insurance&number=31899',
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
    description: 'GPS 기반 배회감지기 대여 급여제품입니다. 현행 공식 품목수 대조와 코드·가격 확인을 완료했으며, 이로움 현재 유통 여부 최종 확인 전까지 비공개합니다.',
    purchaseCycleYears: 5,
    maxQuantityPerCycle: 1,
    imageRightsConfirmed: false,
    verificationSources: [
      {
        label: '급여코드·월 대여가격 확인',
        url: 'https://www.carestore.co.kr/welfare/C18151060101',
        checkedAt,
      },
      {
        label: '고시 목록 제품코드·가격 교차확인',
        url: 'https://koa.or.kr/bbs/download.php?code=insurance&number=31899',
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
    sourceUrl: 'https://www.data.go.kr/data/15153624/fileData.do?recommendDataYn=Y',
    sourceCheckedAt: checkedAt,
    description: `${String(name)} 실외용 경사로 대여 급여제품입니다. 공식 제품코드·월 대여가격을 확인했으며 이로움 현재 유통 확인 전까지 비공개합니다.`,
    purchaseCycleYears: 8,
    maxQuantityPerCycle: 1,
    imageRightsConfirmed: false,
    verificationSources: [
      {
        label: '공단 복지용구 공공데이터 제품코드·가격 확인',
        url: 'https://www.data.go.kr/data/15153624/fileData.do?recommendDataYn=Y',
        checkedAt,
      },
      {
        label: '고시 제품목록 코드·가격 교차확인',
        url: 'https://koa.or.kr/bbs/download.php?code=insurance&number=31899',
        checkedAt,
      },
    ],
  } satisfies Product)),
];
