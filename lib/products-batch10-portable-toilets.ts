import type { Product } from './products';

const checkedAt = '2026-09-12';
const carestore = (code: string) => `https://www.carestore.co.kr/welfare/${code}`;

function pending(name: string, manufacturer: string, code: string, price: number): Product {
  return {
    slug: `${code.toLowerCase()}-portable-toilet`,
    name,
    model: name,
    manufacturer,
    benefitCode: code,
    category: '이동변기',
    benefitPrice: price,
    status: 'PENDING_EROUM_VERIFICATION',
    sourceUrl: carestore(code),
    sourceCheckedAt: checkedAt,
    description: `${name} 이동변기입니다. 2026-09-01 공단 급여제품 기준 코드와 급여가격을 확인했으며, 이로움 정상 유통 여부 최종 확인 전까지 사이트에는 공개하지 않습니다.`,
    purchaseCycleYears: 5,
    maxQuantityPerCycle: 1,
    imageRightsConfirmed: false,
    verificationSources: [
      {
        label: '공단 반영 급여코드·가격·유통정보 교차검증',
        url: carestore(code),
        checkedAt,
      },
    ],
  };
}

export const portableToiletBatch: Product[] = [
  pending('CS-3', '미키코리아메디칼', 'T03030111601', 411000),
  pending('BFMB-109', '보필', 'T03030025011', 321000),
  pending('APT-103', '(주)에이엠이', 'T03030060005', 321000),
  pending('BFMB5', '보필', 'T03030025105', 230000),
  pending('APT-301', '(주)케어로', 'T03030232003', 230000),
  pending('NT-CT100', '엔티바이오', 'T03030155001', 321000),
  pending('BFMB20', '보필', 'T03030025009', 228000),
  pending('BFMB8', '보필', 'T03030025008', 292000),
  pending('APT-210', '(주)에이엠이', 'T03030060102', 198000),
  pending('PT-100', '미키코리아', 'T03030043002', 416000),
  pending('APT-126', '(주)케어로', 'T03030232002', 306000),
  pending('BFMB4', '보필', 'T03030025104', 321000),
  pending('PN-L30200BK', '(주)신동아이에스', 'T03030081602', 167000),
  pending('APT-106', '(주)케어로', 'T03030232001', 292000),
  pending('코디-200', '주식회사 코지디자인', 'T03031261101', 321000),
  pending('PN-L23206KR', '(주)신동아이에스', 'T03030081603', 272000),
  {
    ...pending('SKC-660', '삼원스카이', 'T03030006002', 216000),
    status: 'NOT_DISTRIBUTED',
    sourceUrl: 'https://eroumcare.com/shop/search.php',
    description: '이로움에서 비유통·단종·품절 표시가 확인되어 공개 대상에서 제외한 이동변기입니다.',
    verificationSources: [
      {
        label: '공단 반영 급여코드·가격 확인',
        url: carestore('T03030006002'),
        checkedAt,
      },
      {
        label: '이로움 비유통·단종·품절 확인',
        url: 'https://eroumcare.com/shop/search.php',
        checkedAt,
      },
    ],
  },
];
