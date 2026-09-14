import type { Product } from '@/lib/products';

type DetailGuide = {
  highlights: string[];
  selection: string[];
  safety: string[];
};

const verifiedOverrides: Record<string, Partial<DetailGuide>> = {
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
