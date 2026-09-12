import type { Product } from '@/lib/products';

type DetailGuide = {
  highlights: string[];
  selection: string[];
  safety: string[];
  extraSources?: { label: string; url: string }[];
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
      '비정상적인 흔들림이나 제동 이상이 있으면 사용을 중지하고 판매처 또는 제조·공급사에 점검을 요청하세요.',
      '제조·공급사 자료에는 구입 후 1년 무상 A/S 기준이 안내되어 있습니다. 사용자 과실·임의 개조·소모품 마모 등은 제외될 수 있습니다.',
    ],
    extraSources: [
      { label: 'WAG02 급여·유통·사용설명서', url: 'https://www.carestore.co.kr/welfare/M06090217502' },
      { label: 'WAG02 기능·사양 영상 자료', url: 'https://www.youtube.com/watch?v=LdgXF1sijGU' },
    ],
  },
  'sporty-adult-walker': {
    highlights: [
      '카본 소재를 중심으로 구성된 롤레이터형 성인용보행기입니다.',
      '제품 크기는 약 49 × 70 × 83~93cm, 좌면 높이는 약 52cm로 안내됩니다.',
      '중량은 약 6.45kg이며 실내외 보행 보조와 휴식용 좌면을 함께 고려한 형태입니다.',
      '제품안전정보센터에서 고령자용 보행차 모델 Sporty의 안전확인 적합 정보를 확인할 수 있습니다.',
    ],
    selection: [
      '좌면 높이 52cm와 손잡이 높이 83~93cm가 실제 사용자의 체형에 맞는지 확인하세요.',
      '카본 소재의 장점보다 사용자의 균형능력, 브레이크 조작력, 보행 환경이 더 중요한 선택 기준입니다.',
      '폭 49cm·길이 70cm 수준이므로 실내 동선과 차량 적재 공간을 함께 확인하세요.',
    ],
    safety: [
      '보행 전 브레이크와 바퀴 상태를 확인하고, 경사로나 젖은 바닥에서는 속도를 충분히 낮추세요.',
      '좌면을 사용할 때는 제품이 움직이지 않도록 주차 브레이크 체결 여부를 먼저 확인하세요.',
      '사용 중 프레임, 바퀴 또는 브레이크에 이상이 느껴지면 즉시 사용을 중지하고 점검을 받으세요.',
    ],
    extraSources: [
      { label: 'SPORTY 급여·유통 정보', url: 'https://www.carestore.co.kr/welfare/M06061285601' },
      { label: 'SPORTY 제품안전 적합 정보', url: 'https://www.safetykorea.kr/search/searchPop?certNum=B201R143-25001&menu=search' },
    ],
  },
};

function categoryGuide(product: Product): DetailGuide {
  const category = product.category;
  const dimensions = product.dimensions ? `규격 ${product.dimensions}` : '설치·사용 공간의 실제 치수';
  const weight = product.weightKg !== undefined ? `중량 ${product.weightKg}kg` : '제품 중량';

  if (category.includes('성인용보행기')) {
    return {
      highlights: [
        `${product.name}은(는) 보행이 불편한 어르신의 실내외 이동을 보조하는 ${category} 제품입니다.`,
        `${dimensions}${product.weightKg !== undefined ? `, ${weight}` : ''} 기준으로 실제 사용 환경과 이동·보관 편의성을 비교할 수 있습니다.`,
        '손잡이 높이, 바퀴 크기, 브레이크 조작 방식과 접이 편의성은 구매 전 반드시 확인할 항목입니다.',
      ],
      selection: [
        '사용자의 키에 맞게 손잡이 높이를 조절할 수 있는지 확인하세요.',
        '집 안 문폭·복도폭, 엘리베이터, 차량 트렁크 등 자주 이용하는 공간과 제품 규격을 비교하세요.',
        '실외 사용 비중이 높다면 바퀴, 브레이크, 턱 통과 편의성을 함께 확인하세요.',
      ],
      safety: [
        '사용 전 브레이크, 바퀴, 프레임 잠금 상태를 확인하세요.',
        '젖은 바닥이나 급경사에서는 미끄러짐과 전도 위험이 커질 수 있으므로 주의하세요.',
        '제품에 앉을 수 있는 구조라도 좌면 사용 전 반드시 주차 브레이크를 확인하세요.',
      ],
    };
  }

  if (category.includes('목욕의자')) {
    return {
      highlights: [
        `${product.name}은(는) 욕실에서 앉은 자세로 세정과 이동을 보조하는 ${category} 제품입니다.`,
        `${dimensions}${product.weightKg !== undefined ? `, ${weight}` : ''}를 확인해 욕실 공간과 사용자 체형에 맞는지 비교하세요.`,
        '좌면 높이, 미끄럼 방지 고무발, 팔걸이와 등받이 형태는 실제 사용 안정성에 영향을 줍니다.',
      ],
      selection: [
        '욕실 문폭과 샤워 공간에 제품이 충분히 들어가는지 확인하세요.',
        '사용자가 앉고 일어설 때 팔걸이를 안정적으로 잡을 수 있는지 확인하세요.',
        '높이 조절식 제품은 네 다리 높이를 동일하게 맞추는 것이 중요합니다.',
      ],
      safety: [
        '사용 전 고무발 마모·파손과 프레임 흔들림을 확인하세요.',
        '젖은 욕실 바닥에서는 제품이 완전히 고정된 상태인지 확인한 뒤 착석하세요.',
        '사용 후에는 물기를 제거하고 충분히 건조해 미끄럼과 부식 위험을 줄이세요.',
      ],
    };
  }

  if (category.includes('안전손잡이')) {
    return {
      highlights: [
        `${product.name}은(는) 기립·착석·이동 시 손으로 지지할 수 있도록 돕는 ${category} 제품입니다.`,
        `${dimensions}를 기준으로 침대, 화장실, 현관 등 실제 설치 위치를 먼저 확인하세요.`,
        '벽부착형·거치형·기둥형 등 설치 방식에 따라 필요한 공간과 시공 조건이 다를 수 있습니다.',
      ],
      selection: [
        '사용자가 가장 힘을 주는 방향과 위치에 손잡이가 자연스럽게 닿는지 확인하세요.',
        '벽부착형은 벽체 재질과 고정 가능 여부를 시공 전에 확인해야 합니다.',
        '거치형은 바닥 수평과 미끄럼 여부, 침대·변기와의 간격을 확인하세요.',
      ],
      safety: [
        '손잡이를 임의로 흔들어 고정 상태와 유격을 정기적으로 확인하세요.',
        '벽체나 바닥 고정이 느슨해졌다면 즉시 사용을 중지하고 재시공 또는 점검을 받으세요.',
        '제품을 원래 설계된 방향과 용도 외의 당김·매달림 용도로 사용하지 마세요.',
      ],
    };
  }

  if (category.includes('이동변기') || category.includes('간이변기')) {
    return {
      highlights: [
        `${product.name}은(는) 화장실까지 이동이 어려운 사용자를 위한 ${category} 제품입니다.`,
        `${dimensions}${product.weightKg !== undefined ? `, ${weight}` : ''}를 확인해 침상 주변과 생활 공간에 배치 가능한지 비교하세요.`,
        '좌면 높이, 팔걸이, 등받이, 용기 탈착과 세척 편의성을 함께 확인하는 것이 좋습니다.',
      ],
      selection: [
        '침대 옆 설치 시 사용자가 안전하게 옮겨 앉을 수 있는 간격을 확보하세요.',
        '좌면 높이가 침대나 휠체어 높이와 크게 차이나지 않는지 확인하세요.',
        '용기 탈착 방식과 세척 동선을 실제 보호자 사용 기준으로 확인하세요.',
      ],
      safety: [
        '사용 전 프레임과 좌면 고정, 미끄럼 방지발 상태를 확인하세요.',
        '사용 후 오염물을 바로 처리하고 세척·건조해 위생을 유지하세요.',
        '사용자 이동 시 필요한 경우 보호자가 옆에서 낙상 위험을 줄여 주세요.',
      ],
    };
  }

  if (category.includes('미끄럼') && category.includes('매트')) {
    return {
      highlights: [
        `${product.name}은(는) 욕실·생활 공간의 미끄러짐 위험을 줄이기 위한 ${category} 제품입니다.`,
        `${dimensions}를 확인해 실제 설치 공간을 충분히 덮는지 비교하세요.`,
        '바닥과의 밀착력, 표면 배수·세척성, 들뜸 여부를 함께 확인하는 것이 중요합니다.',
      ],
      selection: [
        '설치할 바닥의 재질과 물 사용 빈도를 확인하세요.',
        '매트 가장자리가 보행 동선에 걸림턱을 만들지 않는지 확인하세요.',
        '욕실 전체가 아니라 자주 발을 딛는 위치를 우선해 배치하세요.',
      ],
      safety: [
        '바닥과 매트 사이의 비누·물때를 주기적으로 제거하세요.',
        '말림, 찢어짐, 들뜸이 생긴 매트는 교체를 고려하세요.',
        '미끄럼방지매트만으로 낙상을 완전히 방지할 수 없으므로 안전손잡이 등 환경 개선을 함께 고려하세요.',
      ],
    };
  }

  if (category.includes('휠체어')) {
    return {
      highlights: [
        `${product.name}은(는) 이동이 불편한 사용자의 이동을 보조하는 ${category} 제품입니다.`,
        `${dimensions}${product.weightKg !== undefined ? `, ${weight}` : ''}를 확인해 사용자 체형과 차량 적재 환경에 맞는지 비교하세요.`,
        '좌폭, 전체폭, 브레이크, 발판과 팔걸이 구조는 실제 사용성에 큰 영향을 줍니다.',
      ],
      selection: [
        '사용자 좌폭과 체형에 맞는 시트 규격인지 확인하세요.',
        '집 안 문폭·복도폭·엘리베이터와 휠체어 전체폭을 비교하세요.',
        '보호자가 밀어야 하는 경우 제품 중량과 접이 편의성도 함께 확인하세요.',
      ],
      safety: [
        '승하차 전 반드시 브레이크를 잠그고 발판 위치를 확인하세요.',
        '경사로에서는 진행 방향과 보조자 위치를 제조사 지침에 따라 사용하세요.',
        '타이어 공기압 또는 바퀴 마모, 브레이크 성능을 정기적으로 확인하세요.',
      ],
    };
  }

  if (category.includes('전동침대') || category.includes('침대')) {
    return {
      highlights: [
        `${product.name}은(는) 침상 생활과 자세 변경을 보조하는 ${category} 제품입니다.`,
        `${dimensions}를 기준으로 방 안 설치 공간, 출입 동선, 주변 가구 간격을 확인하세요.`,
        '전동 기능이 있는 경우 등판·다리·높이 조절 범위와 비상 시 수동 대응 방법을 확인하는 것이 좋습니다.',
      ],
      selection: [
        '침대 설치 후 보호자가 양쪽에서 접근 가능한 공간을 확보할 수 있는지 확인하세요.',
        '사용자의 이동 방식에 맞춰 침대 높이와 난간 구조를 비교하세요.',
        '전원 콘센트 위치와 전선이 보행 동선을 방해하지 않는지 확인하세요.',
      ],
      safety: [
        '움직이는 프레임 사이에 손·발·침구가 끼이지 않도록 주의하세요.',
        '전동 조절 중 이상음이나 멈춤이 발생하면 조작을 중지하고 점검을 받으세요.',
        '난간은 제조사 지침에 맞게 잠금 상태를 확인한 뒤 사용하세요.',
      ],
    };
  }

  if (category.includes('지팡이')) {
    return {
      highlights: [
        `${product.name}은(는) 보행 시 균형과 체중 지지를 보조하는 ${category} 제품입니다.`,
        `${dimensions}${product.weightKg !== undefined ? `, ${weight}` : ''}를 확인해 사용자 키와 휴대성을 비교하세요.`,
        '손잡이 형태, 길이 조절 범위와 고무팁 상태가 실제 사용 편의성에 영향을 줍니다.',
      ],
      selection: [
        '팔꿈치가 자연스럽게 약간 굽혀지는 길이로 조절 가능한지 확인하세요.',
        '손잡이가 손 크기와 악력에 맞는지 직접 잡아보는 것이 좋습니다.',
        '실내외 바닥 환경에 맞춰 고무팁의 마찰력과 상태를 확인하세요.',
      ],
      safety: [
        '길이 조절 핀 또는 잠금부가 완전히 체결됐는지 확인하세요.',
        '고무팁이 닳거나 갈라지면 미끄러질 수 있으므로 즉시 교체하세요.',
        '지팡이 사용만으로 균형 유지가 어렵다면 보행기 등 다른 보조기구 상담이 필요할 수 있습니다.',
      ],
    };
  }

  return {
    highlights: [
      `${product.name} ${product.model}은(는) 장기요양 복지용구 ${category} 제품입니다.`,
      `${product.material ? `주요 재질은 ${product.material}이며, ` : ''}${product.dimensions ? `규격은 ${product.dimensions}입니다.` : '제품 규격과 설치 조건을 구매 전에 확인하세요.'}`,
      `${product.weightKg !== undefined ? `제품 중량은 약 ${product.weightKg}kg입니다. ` : ''}급여코드와 최신 유통상태는 하단 검증 기록에서 확인할 수 있습니다.`,
    ],
    selection: [
      '사용자의 신체 상태와 실제 생활 공간에 제품 규격이 맞는지 확인하세요.',
      '급여 가능 여부와 남은 한도는 계약 전 복지용구 사업소 또는 장기요양 관련 조회를 통해 확인하세요.',
      '제품 선택 시 가격뿐 아니라 설치, 사용, 세척, 보관, A/S 편의성도 함께 비교하세요.',
    ],
    safety: [
      '처음 사용하기 전에 제조·공급사의 사용설명서와 주의사항을 확인하세요.',
      '파손, 흔들림, 잠금 이상이 확인되면 사용을 중지하고 점검을 요청하세요.',
      '사용자의 신체 상태가 달라졌다면 기존 제품이 계속 적합한지 전문가와 다시 확인하는 것이 좋습니다.',
    ],
  };
}

export default function ProductDetailContent({ product }: { product: Product }) {
  const base = categoryGuide(product);
  const override = verifiedOverrides[product.slug];
  const guide: DetailGuide = {
    highlights: override?.highlights ?? base.highlights,
    selection: override?.selection ?? base.selection,
    safety: override?.safety ?? base.safety,
    extraSources: override?.extraSources ?? [],
  };

  const sourceLinks = [
    { label: '이로움 유통 확인 자료', url: product.sourceUrl },
    ...product.verificationSources.map((source) => ({ label: source.label, url: source.url })),
    ...(guide.extraSources ?? []),
  ].filter((source, index, array) => array.findIndex((item) => item.url === source.url) === index);

  return (
    <div className="content-card" style={{ marginTop: 28 }}>
      <p className="eyebrow" style={{ marginBottom: 6 }}>PRODUCT DETAIL</p>
      <h2 style={{ marginTop: 0 }}>{product.name} 상세페이지</h2>
      <p className="muted">
        이로움 정상 유통 확인 자료와 급여·제조·공급 자료를 교차 확인해 핵심 정보만 다시 정리했습니다.
        외부 상세페이지를 그대로 복제하지 않고, 제품 선택에 필요한 사실 정보와 사용 포인트 중심으로 구성합니다.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 20 }}>
        <article className="content-card" style={{ margin: 0, padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>핵심 특징</h3>
          <ul>
            {guide.highlights.map((item) => <li key={item} style={{ marginBottom: 10 }}>{item}</li>)}
          </ul>
        </article>
        <article className="content-card" style={{ margin: 0, padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>구매 전 확인</h3>
          <ul>
            {guide.selection.map((item) => <li key={item} style={{ marginBottom: 10 }}>{item}</li>)}
          </ul>
        </article>
        <article className="content-card" style={{ margin: 0, padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>사용·안전 포인트</h3>
          <ul>
            {guide.safety.map((item) => <li key={item} style={{ marginBottom: 10 }}>{item}</li>)}
          </ul>
        </article>
      </div>

      <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
        <h3 style={{ marginTop: 0 }}>원문·검증 자료</h3>
        <p className="muted">가격·유통상태·급여코드·제품 사양은 아래 원문에서도 다시 확인할 수 있습니다.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {sourceLinks.map((source) => (
            <a className="button secondary" href={source.url} target="_blank" rel="noreferrer" key={source.url}>
              {source.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
