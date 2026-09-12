import type { Product } from './products';

const checkedAt = '2026-09-12';
const carestore = (code: string) => `https://www.carestore.co.kr/welfare/${code}`;

function pending(name: string, manufacturer: string, code: string, price: number): Product {
  return {
    slug: `${code.toLowerCase()}-bedpan`,
    name,
    model: name,
    manufacturer,
    benefitCode: code,
    category: '간이변기',
    benefitPrice: price,
    status: 'PENDING_EROUM_VERIFICATION',
    sourceUrl: carestore(code),
    sourceCheckedAt: checkedAt,
    description: `${name} 간이변기입니다. 현행 급여코드와 가격을 확인했으며 이로움 정상 유통 확인 전까지 비공개합니다.`,
    maxQuantityPerCycle: 2,
    imageRightsConfirmed: false,
    verificationSources: [{ label: '공단 반영 급여코드·가격·유통정보 확인', url: carestore(code), checkedAt }],
  };
}

export const bedpanBatch: Product[] = [
  pending('ABP101', '(주)에이엠이', 'T03060060001', 16500),
  pending('ABP-106', '(주)에이엠이', 'T03060060102', 14500),
  pending('HD-UM-001', '현대의료산업', 'T03060058002', 7300),
  pending('BFTL5', '보필', 'T03060025102', 14300),
  pending('BFTL6', '보필', 'T03060025103', 14500),
  pending('BFTL4', '보필', 'T03060025101', 13500),
  pending('HD-B-001', '현대의료산업', 'T03060058001', 11000),
];
