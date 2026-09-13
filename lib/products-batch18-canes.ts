import type { Product } from './products';

const checkedAt = '2026-09-12';
const carestore = (code: string) => `https://www.carestore.co.kr/welfare/${code}`;
const officialNotice = 'https://www.nhis.or.kr/lm/lmxsrv/law/lawFullContent.do?SEQ=1603&SEQ_HISTORY=601911';

type CaneRow = [
  name: string,
  manufacturer: string,
  benefitCode: string,
  benefitPrice: number,
  secondaryStatus?: 'CURRENT' | 'DISTRIBUTION_STOPPED' | 'REMOVED',
];

// 2026-09-01 시행 현행 고시의 지팡이는 47개입니다.
// ISA(M03031033101)는 products-batch4.ts, SS(M03030132002)는 products-batch3.ts에 ACTIVE로 존재합니다.
// 따라서 이 파일에는 현행 45개 + 과거 급여목록 제거 기록 11개를 보관합니다.
const rows: CaneRow[] = [
  ['LS-20F', '해올', 'M03031003103', 59400],
  ['아이온 사발지팡이', '아이온', 'M03031033103', 61500],
  ['BS', '아이온', 'M03030132008', 61500],
  ['LC', '아이온', 'M03030132007', 72500],
  ['CHOICE-02', '메디케어코리아', 'M03031088602', 57300],
  ['나래-1000', '주식회사 나래', 'M03031086001', 58800],
  ['Choice-01', '메디케어코리아', 'M03031088101', 48700],
  ['ILA', '아이온', 'M03030132005', 46400],
  ['EL-40S', '(유)시선', 'M03031080102', 50600],
  ['NS', '아이온', 'M03030132009', 45300],
  ['나래-4000', '주식회사 나래', 'M03031083103', 66600],
  ['SF', '아이온', 'M03031033104', 63700],
  ['TW-0128', '(주)코인스', 'M03030202501', 99300],
  ['WE37J5401-00(24)', '마키테크코리아', 'M03030245501', 45600, 'REMOVED'],
  ['SW-200F', '애스앤애프', 'M03030174002', 66600],
  ['CHOICE-03', '메디케어코리아', 'M03031088603', 61500, 'REMOVED'],
  ['MCS-04', '삼인라이프롬(Samin.Lifrom)', 'M03030078002', 45000],
  ['백건 여자 지팡이-01', '킴스케어', 'M03031071601', 59400],
  ['FS929L+D60', '주식회사 화강지에스케이', 'M03031131601', 25000],
  ['안심동행401', '(유)시선', 'M03031080103', 55600, 'REMOVED'],
  ['컴포핸들스틱 (CF-50011)', '(주)코인스', 'M03030202504', 53900, 'REMOVED'],
  ['ONE STICK J-3000', '주식회사 나래', 'M03031083102', 65000],
  ['백건 여자 지팡이-02', '킴스케어', 'M03031071602', 59400],
  ['TH-CFN', '더건강한 의료기', 'M03030226504', 30900],
  ['SW-100P', '애스앤애프', 'M03030174007', 44300],
  ['SKL-060', '삼원스카이', 'M03030006503', 27000, 'REMOVED'],
  ['LF', '아이온', 'M03030132010', 65000, 'REMOVED'],
  ['SW-300T', '애스앤애프', 'M03030174006', 66600],
  ['WETJ5490-00(24)', '마키테크코리아', 'M03030245502', 45600, 'REMOVED'],
  ['SKL-050', '삼원스카이', 'M03030006502', 29800, 'REMOVED'],
  ['SW-100F', '애스앤애프', 'M03030174001', 44300],
  ['이지핸들2웨이스틱 (EH-50042)', '(주)코인스', 'M03030202506', 74300, 'REMOVED'],
  ['이스틱-B', '디알컴퍼니', 'M03030230001', 75000],
  ['화려한 실버', '에이오파트너', 'M03031099601', 36200],
  ['LAS', '해올', 'M03030129002', 45700],
  ['TH-CF', '더건강한 의료기', 'M03030226503', 41500],
  ['나래-1100', '주식회사 나래', 'M03030186002', 58800],
  ['SKL-030', '삼원스카이', 'M03030006102', 32600],
  ['Chunji', '(주)레머디랩', 'M03031147601', 60500],
  ['SW-100T', '애스앤애프', 'M03030174004', 44300],
  ['SW-300F', '애스앤애프', 'M03030174003', 66600],
  ['WELKER-01', '대세엠케어', 'M03030057602', 63000],
  ['SKL-020', '삼원스카이', 'M03030006101', 28800],
  ['이틱', '(유)시선', 'M03030153001', 41200],
  ['TH-CA', '더건강한 의료기', 'M03030226502', 27300],
  ['이지핸들스틱 (EH-50011)', '(주)코인스', 'M03030202505', 53800, 'REMOVED'],
  ['LF-S', '아이온', 'M03030132011', 70000, 'REMOVED'],
  ['ONE STICK J-1000', '주식회사 나래', 'M03031083101', 57300],
  ['TH-CC', '더건강한 의료기', 'M03030226505', 48700],
  ['백건 남자 지팡이-01', '킴스케어', 'M03031071603', 59400],
  ['TH-C', '더건강한 의료기', 'M03030226501', 25100],
  ['YGM04', '유광정밀', 'M03030045101', 63600],
  ['LS-10B', '해올', 'M03030129001', 58800, 'DISTRIBUTION_STOPPED'],
  ['SW-200T', '애스앤애프', 'M03030174005', 66600, 'DISTRIBUTION_STOPPED'],
  ['케어스틱', '대기정공', 'M03031070101', 57300, 'DISTRIBUTION_STOPPED'],
  ['사랑해', '에이오파트너', 'M03031099101', 38800, 'DISTRIBUTION_STOPPED'],
];

export const caneCatalogBatch: Product[] = rows.map(
  ([name, manufacturer, benefitCode, benefitPrice, secondaryStatus = 'CURRENT']) => {
    const removed = secondaryStatus === 'REMOVED';
    const distributionStopped = secondaryStatus === 'DISTRIBUTION_STOPPED';

    return {
      slug: `${benefitCode.toLowerCase()}-cane`,
      name,
      model: name,
      manufacturer,
      benefitCode,
      category: '지팡이',
      benefitPrice,
      status: removed ? 'REMOVED_FROM_BENEFIT_LIST' : 'PENDING_EROUM_VERIFICATION',
      sourceUrl: removed ? officialNotice : carestore(benefitCode),
      sourceCheckedAt: checkedAt,
      description: removed
        ? `${name} 지팡이는 과거 원장에는 있었으나 2026-09-01 현행 복지용구 급여제품 47개 목록에는 포함되지 않아 공개 대상에서 제외합니다.`
        : distributionStopped
          ? `${name} 지팡이는 현행 공식 급여목록에는 포함되어 있습니다. 기존 유통중단 표기가 있어 이로움 현재 상태를 재확인한 뒤 공개 여부를 결정합니다.`
          : `${name} 지팡이 급여제품입니다. 현행 급여코드·급여가를 확인했으며 이로움 현재 정상유통 최종 확인 전까지 비공개합니다.`,
      purchaseCycleYears: 2,
      maxQuantityPerCycle: 1,
      imageRightsConfirmed: false,
      verificationSources: [
        {
          label: removed
            ? '2026-09-01 현행 47개 지팡이 급여목록 대조 — 목록 제외'
            : distributionStopped
              ? '현행 급여목록 포함 · 이로움 유통상태 재확인 필요'
              : '제품코드·급여가 확인 · 이로움 유통상태 확인 대기',
          url: removed ? officialNotice : carestore(benefitCode),
          checkedAt,
        },
      ],
    } as Product;
  },
);
