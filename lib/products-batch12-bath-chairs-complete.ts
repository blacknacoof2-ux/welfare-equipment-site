import type { Product } from './products';

const checkedAt = '2026-09-12';
const carestore = (code: string) => `https://www.carestore.co.kr/welfare/${code}`;

function pending(name: string, manufacturer: string, code: string, price: number): Product {
  return {
    slug: `${code.toLowerCase()}-bath-chair`,
    name,
    model: name,
    manufacturer,
    benefitCode: code,
    category: '목욕의자',
    benefitPrice: price,
    status: 'PENDING_EROUM_VERIFICATION',
    sourceUrl: carestore(code),
    sourceCheckedAt: checkedAt,
    description: `${name} 목욕의자입니다. 현행 급여코드·급여가격을 확인했으며 이로움 정상 유통 최종 확인 전까지 비공개합니다.`,
    purchaseCycleYears: 5,
    maxQuantityPerCycle: 1,
    imageRightsConfirmed: false,
    verificationSources: [{ label: '공단 반영 급여코드·가격·유통정보 확인', url: carestore(code), checkedAt }],
  };
}

function removed(name: string, manufacturer: string, code: string, price: number): Product {
  return {
    slug: `${code.toLowerCase()}-bath-chair`,
    name,
    model: name,
    manufacturer,
    benefitCode: code,
    category: '목욕의자',
    benefitPrice: price,
    status: 'REMOVED_FROM_BENEFIT_LIST',
    sourceUrl: 'https://www.nhis.or.kr/lm/lmxsrv/law/lawFullContent.do?SEQ=1603&SEQ_HISTORY=601911',
    sourceCheckedAt: checkedAt,
    description: `${name}은(는) 과거 후보 원장에는 있었으나 2026-09-01 현행 복지용구 급여제품 목록에는 포함되지 않아 공개 대상에서 제외합니다.`,
    purchaseCycleYears: 5,
    maxQuantityPerCycle: 1,
    imageRightsConfirmed: false,
    verificationSources: [
      {
        label: '2026-09-01 현행 복지용구 급여제품 목록 대조',
        url: 'https://www.nhis.or.kr/lm/lmxsrv/law/lawFullContent.do?SEQ=1603&SEQ_HISTORY=601911',
        checkedAt,
      },
    ],
  };
}

export const bathChairCompleteBatch: Product[] = [
  pending('라온아띠 KCS-811', '코리아케어서프라이', 'B03180001501', 350000),
  pending('BOFEEL 8', '보필', 'B03180025104', 178000),
  pending('PT-300', '미키코리아', 'B03180043004', 517000),
  pending('ASC-501', '(주)에이엠이', 'B03180060005', 153000),
  pending('BOFEEL11', '보필', 'B03180025014', 187000),
  pending('SMC-01', '세종메디컬', 'B03181159601', 153000),
  removed('CSC-1000', '세비앙', 'B03180191001', 187000),
  pending('SK-390L(블루,레드)', '삼원스카이', 'B03180006003', 180000),
  pending('MTCA', '민택산업', 'B03180049001', 720000),
  pending('KT-130', '케어맥스코리아', 'B03180088602', 166000),
  pending('ASC-102', '(주)에이엠이', 'B03180060002', 168000),
  pending('BFSC-112', '보필', 'B03180025015', 187000),
  pending('PN-L41522D', '(주)신동아이에스', 'B03180081506', 187000),
  pending('Clean49', '(주)리스케어', 'B03180088502', 657000),
  pending('ASC-103', '(주)에이엠이', 'B03180060003', 165000),
  pending('NYC-01', '주식회사 남양금속', 'B03180200001', 165000),
  removed('HANGANG10000', '(주)미라클메디', 'B03180217501', 175000),
];
