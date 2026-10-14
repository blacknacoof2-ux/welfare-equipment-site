import type { Product } from '@/lib/products';

type DetailGuide = {
  highlights: string[];
  selection: string[];
  safety: string[];
};

const verifiedOverrides: Record<string, Partial<DetailGuide>> = {
// SEO pilot: 10 model-specific, source-grounded descriptions (2026-10-14).
// Source: verified published-product fields; preserve category-wide safety guidance.
  'catalog-f18031026103-safety-handle': {
    highlights: [
      "CC1200은 천연원목과 아연 소재가 기재된 세비앙 안전손잡이입니다.",
      "등록된 길이는 121cm, 높이는 7.4cm로, 같은 품목의 짧은 손잡이와 설치에 필요한 길이가 다릅니다.",
      "제품 원장에 손잡이둘레 3.8×2.4cm로 표기되어 있어, 실제 쥐는 부분의 형태는 공급사 도면으로 확인할 필요가 있습니다.",
    ],
    selection: [
      "손잡이를 설치할 벽면에서 121cm 길이를 확보할 수 있는지 먼저 측정하세요.",
      "벽체 재질과 고정 방식이 이 제품의 설치 조건에 맞는지 공급사 설명서를 확인하세요.",
    ],
  },
  'catalog-f18030045119-safety-handle': {
    highlights: [
      "YGC01은 스테인리스와 ABS수지로 표기된 유광정밀 안전손잡이입니다.",
      "등록 규격은 길이 55cm·높이 7.4cm이며 손잡이둘레는 32Φ로 기록되어 있습니다.",
      "같은 길이의 다른 손잡이도 재질과 손으로 잡는 부분의 형태가 다를 수 있으므로 규격뿐 아니라 설치 위치를 함께 비교해야 합니다.",
    ],
    selection: [
      "길이 55cm가 필요한 지지 구간을 충분히 덮는지 실제 설치 위치에서 확인하세요.",
      "32Φ 표기의 측정 기준과 설치 부속품 포함 여부는 제조사 자료에서 확인하세요.",
    ],
  },
  'catalog-f18030060113-safety-handle': {
    highlights: [
      "ASH-120은 천연목 손잡이와 아연합금 소재가 등록된 에이엠이 안전손잡이입니다.",
      "제품 길이는 41cm이며 높이 5.5cm, 손잡이 직경 3.5cm로 기재되어 있습니다.",
      "등록 중량은 0.6kg로, 설치 전 제품 자체 무게와 벽체 고정 조건을 함께 검토할 수 있습니다.",
    ],
    selection: [
      "41cm 길이와 직경 3.5cm가 사용자의 손 크기 및 필요한 지지 범위에 맞는지 확인하세요.",
      "벽체의 고정 강도는 제품 중량만으로 판단하지 말고 제조사의 설치 기준을 적용하세요.",
    ],
  },
  'catalog-f18030060103-safety-handle': {
    highlights: [
      "ASH-108은 천연목과 아연합금 소재를 사용한다고 등록된 안전손잡이입니다.",
      "길이 60cm·높이 5.5cm·손잡이 직경 3.5cm의 규격을 제공합니다.",
      "제품 자체 중량은 0.75kg로 기록되어 있으며, 길이가 41cm인 ASH-120과 설치 공간이 다릅니다.",
    ],
    selection: [
      "60cm 길이가 실제 설치 구간과 손을 뻗는 범위에 맞는지 확인하세요.",
      "나사 고정 위치와 벽체 하중 조건은 별도의 제조사 설치 자료를 확인하세요.",
    ],
  },
  'sporty-adult-walker': {
    highlights: [
      "SPORTY는 우진WMD의 카본 소재 성인용보행기로, 원장에 중량 6.45kg가 등록되어 있습니다.",
      "외형 규격은 49×70×83~93cm이고, 좌면높이는 52cm로 안내되어 있습니다.",
      "손잡이 높이 조절 범위와 좌면높이를 함께 비교해야 사용자의 보행과 앉는 자세에 맞는지 판단할 수 있습니다.",
    ],
    selection: [
      "83~93cm 높이 범위가 이용자의 키와 손목 위치에 맞는지 실제로 확인하세요.",
      "좌면높이 52cm와 전체 설치 공간을 확인하고, 착석 전 제동 방법은 제조사 설명서에 따라 점검하세요.",
    ],
  },
  'catalog-m06090005106-adult-walker': {
    highlights: [
      "KS-300은 삼주유니콘 제품으로, 소재는 알루미늄 외로 등록되어 있습니다.",
      "원장에 기재된 외형 규격은 43×54×87~95cm입니다.",
      "제품 자체 중량은 6kg로 기록되어 있어 실내 통로·보관 공간과 함께 이동 시 취급 부담을 검토할 수 있습니다.",
    ],
    selection: [
      "43×54cm의 바닥 점유 공간과 높이 87~95cm가 실제 생활공간에 맞는지 확인하세요.",
      "실외에서 사용할 계획이라면 바퀴와 제동 방식은 모델별 사용설명서에서 별도로 확인하세요.",
    ],
  },
  'catalog-m06060006003-adult-walker': {
    highlights: [
      "SKB-101W는 삼원스카이 성인용보행기로 스틸·크롬·레자외피·스펀지폼 소재가 표기되어 있습니다.",
      "등록 규격은 68×75×90~108cm이며, 중량은 13kg입니다.",
      "다른 소형 보행기와 비교할 때 출입문 폭뿐 아니라 보호자가 제품을 들어 올리거나 보관해야 하는 상황을 함께 살펴야 합니다.",
    ],
    selection: [
      "68×75cm의 점유 공간과 높이 90~108cm가 이동 동선 및 사용자 체형에 맞는지 확인하세요.",
      "중량 13kg를 고려해 보호자가 차량 적재 또는 이동 시 다룰 수 있는지 검토하세요.",
    ],
  },
  'catalog-m18030043028-manual-wheelchair': {
    highlights: [
      "MRT-7D는 미키코리아 수동휠체어이며, 원장의 재질 표기는 AL 7003-T5입니다.",
      "등록 외형 규격은 60×101×89cm이고, 제품 자체 중량은 15.5kg입니다.",
      "이 제품은 월 대여 급여가격이 등록된 대여 품목이므로, 총 사용기간과 설치·회수 조건을 함께 검토해야 합니다.",
    ],
    selection: [
      "등록 규격 60×101×89cm를 실제 출입문·복도와 대조하되, 좌폭은 별도로 확인하세요.",
      "보호자가 접거나 차량에 싣는다면 15.5kg 중량과 실제 접이 상태의 규격을 공급사에 확인하세요.",
    ],
  },
  'catalog-m18031139103-manual-wheelchair': {
    highlights: [
      "유닉스 22D-A는 휠라인의 수동휠체어이며 알루미늄과 PU타이어가 원장에 등록되어 있습니다.",
      "외형 규격은 폭 62cm·길이 98.4cm·높이 89cm로 표기되어 있습니다.",
      "제품 자체 중량 15.3kg는 이동·적재 조건을 검토할 때 참고할 수 있지만, 사용자에게 맞는 좌폭을 뜻하지는 않습니다.",
    ],
    selection: [
      "실내 문폭과 통로 여유 공간을 62cm의 외형 폭과 비교하고 회전 공간도 별도 확인하세요.",
      "좌석 폭·브레이크 조작 및 차량 적재 시 접은 크기는 제조사 사양서로 확인하세요.",
    ],
  },
  'catalog-m18030043103-manual-wheelchair': {
    highlights: [
      "MIRAGE22D-P는 미키코리아의 수동휠체어로, 알루미늄과 PU타이어가 원장에 기재되어 있습니다.",
      "등록 규격은 63.5×100×86cm이고 제품 자체 중량은 13kg입니다.",
      "다른 월 대여형 수동휠체어와 비교할 때 중량과 외형 규격뿐 아니라 실제 사용자의 좌석 규격을 확인해야 합니다.",
    ],
    selection: [
      "외형 규격 63.5×100×86cm를 이동 동선과 비교하고, 좌폭·좌면높이는 별도 사양서로 확인하세요.",
      "차량 적재를 고려한다면 13kg 중량과 접은 상태의 실제 크기를 함께 확인하세요.",
    ],
  },
  'wag02-adult-walker': {
    highlights: [
      '4.9kg 경량 알루미늄 프레임으로 이동과 보관 부담을 줄인 성인용보행기입니다.',
      '원터치 접이식 구조와 슬림한 폴딩 형태를 갖춰 차량 적재와 보관이 편리한 편입니다.',
      '앞바퀴 캐스터를 180도 회전 또는 고정 방식으로 사용할 수 있고 드럼 브레이크가 적용된 모델입니다.',
      '보조 가방 적재 하중은 안내 자료 기준 최대 5kg입니다.',
    ],
    selection: [
      '손잡이 높이 80~95cm 범위가 실제 사용자의 체형에 맞는지 확인하세요.',
      '폭 50cm이므로 현관, 복도, 엘리베이터 등 자주 지나는 공간의 통과 폭을 확인하세요.',
      '사용 전 브레이크 작동, 접이 잠금, 앞바퀴 캐스터 고정 상태를 확인하는 것이 좋습니다.',
    ],
    safety: [
      '제품 사용 전 제조사 사용설명서의 조립·접이·브레이크 사용방법을 확인하세요.',
      '비정상적인 흔들림이나 제동 이상이 있으면 사용을 중지하고 제조·공급사에 점검을 요청하세요.',
      '사용 환경과 사용자 상태에 따라 보호자의 도움이 필요한지 함께 확인하세요.',
    ],
  },
};

function specLine(product: Product) {
  const pieces = [
    product.dimensions ? `규격 ${product.dimensions}` : '',
    product.weightKg !== undefined ? `중량 ${product.weightKg}kg` : '',
    product.material ? `재질 ${product.material}` : '',
  ].filter(Boolean);

  return pieces.length > 0
    ? `${pieces.join(' · ')} 정보를 실제 사용 공간과 함께 확인하세요.`
    : '제품 규격과 설치·사용 조건을 실제 생활 공간과 함께 확인하세요.';
}

function commonGuide(product: Product, purpose: string, selection: string[], safety: string[]): DetailGuide {
  return {
    highlights: [
      `${product.name}은(는) ${purpose} ${product.category} 급여제품입니다.`,
      specLine(product),
      `급여코드 ${product.benefitCode} 기준으로 등록된 제품입니다.`,
    ],
    selection,
    safety,
  };
}

function categoryGuide(product: Product): DetailGuide {
  switch (product.category) {
    case '성인용보행기':
      return commonGuide(
        product,
        '보행이 불편한 사용자의 실내외 이동과 균형 유지를 보조하는',
        [
          '사용자의 키에 맞게 손잡이 높이를 조절할 수 있는지 확인하세요.',
          '집 안 문폭·복도폭, 엘리베이터, 차량 트렁크와 제품의 전체 폭·접이 크기를 비교하세요.',
          '실외 사용이 많다면 바퀴 크기, 브레이크 조작성, 턱 통과 편의성을 함께 확인하세요.',
        ],
        [
          '사용 전 브레이크, 바퀴, 프레임과 접이 잠금 상태를 확인하세요.',
          '젖은 바닥이나 급경사에서는 미끄러짐과 전도 위험에 주의하세요.',
          '좌면이 있는 제품은 앉기 전에 주차 브레이크가 체결됐는지 확인하세요.',
        ],
      );
    case '목욕의자':
      return commonGuide(
        product,
        '욕실에서 앉은 자세로 세정과 기립을 보조하는',
        [
          '욕실 문폭과 샤워 공간에 제품이 충분히 들어가는지 확인하세요.',
          '좌면 높이와 팔걸이 위치가 사용자의 앉고 일어서기 동작에 맞는지 확인하세요.',
          '높이 조절식 제품은 네 다리의 높이를 동일하게 맞출 수 있는지 확인하세요.',
        ],
        [
          '사용 전 고무발 마모·파손과 프레임 흔들림을 확인하세요.',
          '젖은 욕실 바닥에서 의자가 완전히 안정된 것을 확인한 뒤 착석하세요.',
          '사용 후 물기를 제거하고 충분히 건조하세요.',
        ],
      );
    case '안전손잡이':
      return commonGuide(
        product,
        '기립·착석·이동 시 손으로 지지할 수 있도록 돕는',
        [
          '사용자가 힘을 주는 방향과 위치에서 손잡이가 자연스럽게 닿는지 확인하세요.',
          '벽부착형은 벽체 재질과 고정 가능 여부를, 거치형은 바닥 수평과 설치 면적을 확인하세요.',
          '실제 사용 위치와 손잡이 높이·길이를 함께 비교하세요.',
        ],
        [
          '설치 후 손잡이를 흔들어 고정 상태와 유격을 확인하세요.',
          '고정이 느슨해졌다면 즉시 사용을 중지하고 재시공 또는 점검을 받으세요.',
          '설계된 지지 방향을 벗어난 용도로 사용하지 마세요.',
        ],
      );
    case '수동휠체어':
      return commonGuide(
        product,
        '이동이 불편한 사용자의 실내외 이동을 보조하는',
        [
          '사용자의 좌폭과 체형에 맞는 시트 규격인지 확인하세요.',
          '집 안 문폭·복도폭·엘리베이터와 휠체어 전체 폭을 비교하세요.',
          '차량 적재가 필요하다면 중량과 접이 방식도 확인하세요.',
        ],
        [
          '탑승·하차 전 양쪽 브레이크를 체결하고 발판 위치를 확인하세요.',
          '경사로나 단차에서는 뒤집힘·미끄러짐 위험에 주의하세요.',
          '타이어, 브레이크, 프레임, 발판과 팔걸이의 풀림·마모를 정기적으로 확인하세요.',
        ],
      );
    case '지팡이':
      return commonGuide(
        product,
        '보행 시 균형과 체중 지지를 보조하는',
        [
          '팔꿈치가 자연스럽게 약간 굽혀지는 길이로 조절 가능한지 확인하세요.',
          '손잡이 형태가 손 크기와 악력에 맞는지 확인하세요.',
          '실내외 바닥 환경에 맞춰 고무팁 상태와 형태를 확인하세요.',
        ],
        [
          '길이 조절 장치가 단단히 고정됐는지 확인하세요.',
          '고무팁이 닳거나 미끄러우면 교체하세요.',
          '젖은 바닥이나 경사면에서는 특히 주의하세요.',
        ],
      );
    default:
      return commonGuide(
        product,
        '일상생활의 안전과 편의를 돕는',
        [
          '제품 규격이 실제 사용자의 체형과 생활 공간에 맞는지 확인하세요.',
          '설치·보관·이동 방법이 보호자와 사용자에게 적합한지 확인하세요.',
          '필요한 기능과 급여 방식이 맞는지 신청 전에 다시 확인하세요.',
        ],
        [
          '사용 전 파손, 흔들림, 고정 상태를 확인하세요.',
          '제조사의 사용설명서와 주의사항을 따라 사용하세요.',
          '이상이 느껴지면 사용을 중지하고 점검을 받으세요.',
        ],
      );
  }
}

export default function ProductDetailContent({ product }: { product: Product }) {
  const base = categoryGuide(product);
  const override = verifiedOverrides[product.slug];
  const guide: DetailGuide = {
    highlights: override?.highlights ?? base.highlights,
    selection: override?.selection ?? base.selection,
    safety: override?.safety ?? base.safety,
  };

  return (
    <div className="content-card" style={{ marginTop: 28 }}>
      <p className="eyebrow" style={{ marginBottom: 6 }}>PRODUCT DETAIL</p>
      <h2 style={{ marginTop: 0 }}>{product.name} 상세페이지</h2>
      <p className="muted">제품 특징과 선택 전 확인사항, 안전 사용 정보를 정리했습니다.</p>

      <div className="detail-info-grid" style={{ marginTop: 20 }}>
        <article>
          <h3>제품 특징</h3>
          <ul>
            {guide.highlights.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>
        <article>
          <h3>선택 전 확인</h3>
          <ul>
            {guide.selection.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>
        <article>
          <h3>안전 사용</h3>
          <ul>
            {guide.safety.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>
      </div>
    </div>
  );
}
