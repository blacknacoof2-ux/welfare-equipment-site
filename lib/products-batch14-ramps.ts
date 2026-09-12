import type { Product } from './products';

const checkedAt = '2026-09-12';
const carestore = (code: string) => `https://www.carestore.co.kr/welfare/${code}`;

function ramp(
  name: string,
  manufacturer: string,
  code: string,
  price: number,
  mode: 'PURCHASE' | 'RENTAL' = 'PURCHASE',
): Product {
  const category = mode === 'RENTAL' ? '경사로(실외용)' : '경사로(실내용)';
  return {
    slug: `${code.toLowerCase()}-ramp`,
    name,
    model: name,
    manufacturer,
    benefitCode: code,
    category,
    benefitPrice: price,
    benefitMode: mode,
    status: 'PENDING_EROUM_VERIFICATION',
    sourceUrl: carestore(code),
    sourceCheckedAt: checkedAt,
    description: `${name} ${category} 급여제품입니다. 현행 급여코드와 가격을 확인했으며 이로움 정상 유통 최종 확인 전까지 비공개합니다.`,
    purchaseCycleYears: mode === 'RENTAL' ? 8 : 2,
    maxQuantityPerCycle: mode === 'RENTAL' ? 1 : 6,
    imageRightsConfirmed: false,
    verificationSources: [{ label: '공단 반영 급여코드·가격·유통정보 확인', url: carestore(code), checkedAt }],
  };
}

export const rampBatch: Product[] = [
  ramp('나이팅게일단차해소기 10', '대성홈테크', 'F24011067102', 30200),
  ramp('YGM4', '유광정밀', 'F24000045003', 64300),
  ramp('나이팅게일단차해소기 30', '대성홈테크', 'F24011067103', 46000),
  ramp('ASW-104', '(주)에이엠이', 'F24000060004', 62400),
  ramp('나이팅게일단차해소기 20', '대성홈테크', 'F24011067101', 34900),
  ramp('ASW-103', '(주)에이엠이', 'F24010060101', 42600),
  ramp('ASW-101', '(주)에이엠이', 'F24000060001', 30800),
  ramp('YGM2', '유광정밀', 'F24000045001', 126000),
  ramp('ASW-102', '(주)에이엠이', 'F24000060002', 39300),
  ramp('TRA-H20', '티에이치케이컴퍼니', 'F24011052102', 59500),
  ramp('URB-PR104', '유니러버코퍼레이션', 'F24010181004', 43400),
  ramp('URB-PR102', '유니러버코퍼레이션', 'F24010181002', 25000),
  ramp('TRA-H10', '티에이치케이컴퍼니', 'F24011052101', 41900),
  ramp('URB-PR103', '유니러버코퍼레이션', 'F24010181003', 32200),
  ramp('URB-PR101', '유니러버코퍼레이션', 'F24010181001', 18300),
  ramp('TRA-H30', '티에이치케이컴퍼니', 'F24011052103', 77900),
  ramp('URB-PR105', '유니러버코퍼레이션', 'F24010181005', 54300),
  ramp('R-125SL', '케어맥스코리아', 'F24000088607', 36000, 'RENTAL'),
  ramp('R-245SL', '케어맥스코리아', 'F24000088610', 50400, 'RENTAL'),
];
