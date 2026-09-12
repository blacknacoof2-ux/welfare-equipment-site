import type { Product } from './products';

const checkedAt = '2026-09-12';
const carestore = (code: string) => `https://www.carestore.co.kr/welfare/${code}`;

function pending(
  name: string,
  manufacturer: string,
  code: string,
  category: string,
  price: number,
  benefitMode: Product['benefitMode'] = 'PURCHASE',
): Product {
  return {
    slug: `${code.toLowerCase()}-${category.replace(/[^a-zA-Z0-9가-힣]/g, '-')}`,
    name,
    model: name,
    manufacturer,
    benefitCode: code,
    category,
    benefitPrice: price,
    benefitMode,
    status: 'PENDING_EROUM_VERIFICATION',
    sourceUrl: carestore(code),
    sourceCheckedAt: checkedAt,
    description: `${name} ${category} 급여제품입니다. 현행 급여코드와 가격을 확인했으며 이로움 정상 유통 최종 확인 전까지 비공개합니다.`,
    maxQuantityPerCycle: 1,
    imageRightsConfirmed: false,
    verificationSources: [{ label: '공단 반영 급여코드·가격·유통정보 확인', url: carestore(code), checkedAt }],
  };
}

export const smallRentalCategoryBatch: Product[] = [
  pending('YH-2014', '영화의료기', 'B03030031004', '이동욕조', 31600, 'RENTAL'),
  pending('YH-2013', '영화의료기', 'B03030031002', '이동욕조', 26700, 'RENTAL'),
  pending('YH-2002', '영화의료기', 'B03030031001', '이동욕조', 33400, 'RENTAL'),

  pending('CS06BHB01D', '솔루엠', 'C18211271601', '배회감지기(태그형)', 15100, 'PURCHASE'),
  pending('KS0013M01S', '스마트아이넷', 'C18151049104', '배회감지기', 18400, 'RENTAL'),
  pending('T4S01AR0', '스마트아이넷', 'C18151049601', '배회감지기', 9600, 'RENTAL'),
  pending('IF-WT100', '스마트아이넷', 'C18151049105', '배회감지기', 16100, 'RENTAL'),
  pending('Gper-L200', '스파코사', 'C18151076101', '배회감지기', 9900, 'RENTAL'),
];
