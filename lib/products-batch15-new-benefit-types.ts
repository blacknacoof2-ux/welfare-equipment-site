import type { Product } from './products';

const checkedAt = '2026-09-12';

export const newBenefitTypeBatch: Product[] = [
  {
    slug: 'bcc1wa1a-oral-washer',
    name: 'DCC1WA1A(코모랄)',
    model: 'DCC1WA1A',
    manufacturer: '(주)에스엠디솔루션',
    benefitCode: 'B06121162101',
    category: '구강세척기(마우스피스형)',
    benefitPrice: 440000,
    status: 'PENDING_EROUM_VERIFICATION',
    sourceUrl: 'https://www.carestore.co.kr/welfare/B06121162101',
    sourceCheckedAt: checkedAt,
    description: '마우스피스형 구강세척기 급여제품입니다. 현행 급여코드와 가격을 확인했으며 이로움 정상 유통 확인 전까지 비공개합니다.',
    purchaseCycleYears: 5,
    maxQuantityPerCycle: 1,
    imageRightsConfirmed: false,
    verificationSources: [{ label: '공단 반영 급여코드·가격·유통정보 확인', url: 'https://www.carestore.co.kr/welfare/B06121162101', checkedAt }],
  },
  {
    slug: 'sbm-s100k-diaper-sensor',
    name: '맥스 기저귀 알림 센서(SBM-S100K)',
    model: 'SBM-S100K',
    manufacturer: '(주)모닛',
    benefitCode: 'T09091161101',
    category: '기저귀센서',
    benefitPrice: 134000,
    status: 'PENDING_EROUM_VERIFICATION',
    sourceUrl: 'https://www.carestore.co.kr/welfare/T09091161101',
    sourceCheckedAt: checkedAt,
    description: '기저귀 상태 확인을 보조하는 기저귀센서 급여제품입니다. 현행 급여코드와 가격을 확인했으며 이로움 정상 유통 확인 전까지 비공개합니다.',
    purchaseCycleYears: 3,
    maxQuantityPerCycle: 1,
    imageRightsConfirmed: false,
    verificationSources: [{ label: '공단 반영 급여코드·가격·유통정보 확인', url: 'https://www.carestore.co.kr/welfare/T09091161101', checkedAt }],
  },
];
