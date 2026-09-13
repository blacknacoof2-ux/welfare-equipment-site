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
      `급여코드 ${product.benefitCode}와 현재 유통상태·급여가격은 이로움 검증 자료를 기준으로 표시합니다.`,
    ],
    selection,
    safety,
  };
}

function categoryGuide(product: Product): DetailGuide {
  const category = product.category;

  if (category === '성인용보행기') {
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
        '젖은 바닥이나 급경사에서는 미끄러짐과 전도 위험이 커질 수 있으므로 주의하세요.',
        '좌면이 있는 제품은 앉기 전에 주차 브레이크가 체결됐는지 확인하세요.',
      ],
    );
  }

  if (category === '목욕의자') {
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
        '사용 후 물기를 제거하고 충분히 건조해 미끄럼과 부식 위험을 줄이세요.',
      ],
    );
  }

  if (category === '안전손잡이') {
    return commonGuide(
      product,
      '기립·착석·이동 시 손으로 지지할 수 있도록 돕는',
      [
        '사용자가 가장 힘을 주는 방향과 위치에서 손잡이가 자연스럽게 닿는지 확인하세요.',
        '벽부착형은 벽체 재질과 고정 가능 여부를, 거치형은 바닥 수평과 설치 면적을 확인하세요.',
        '침대·변기·현관 등 실제 사용 위치와 손잡이 높이·길이를 함께 비교하세요.',
      ],
      [
        '설치 후 손잡이를 흔들어 고정 상태와 유격을 확인하고 정기적으로 재점검하세요.',
        '벽체나 바닥 고정이 느슨해졌다면 즉시 사용을 중지하고 재시공 또는 점검을 받으세요.',
        '설계된 지지 방향을 벗어난 매달림·강한 당김 용도로 사용하지 마세요.',
      ],
    );
  }

  if (category === '이동변기' || category === '간이변기') {
    return commonGuide(
      product,
      '화장실까지 이동하기 어려운 사용자의 배변 활동을 보조하는',
      [
        '침대 옆 설치 시 안전하게 옮겨 앉을 수 있는 간격과 동선을 확보하세요.',
        '좌면 높이가 침대나 휠체어 높이와 지나치게 차이나지 않는지 확인하세요.',
        '용기 탈착 방식, 세척 편의성과 보호자의 처리 동선을 확인하세요.',
      ],
      [
        '사용 전 프레임·좌면 고정과 미끄럼 방지발 상태를 확인하세요.',
        '사용 후 오염물을 바로 처리하고 세척·건조해 위생을 유지하세요.',
        '이동·옮겨앉기에 도움이 필요한 사용자는 보호자가 낙상 위험을 줄여 주세요.',
      ],
    );
  }

  if (category === '미끄럼방지용품') {
    return commonGuide(
      product,
      '욕실·생활 공간에서 발이나 바닥의 미끄러짐 위험을 줄이는 데 사용하는',
      [
        '매트형은 설치 면적과 바닥 재질을, 양말형 등 착용 제품은 발 크기와 착용감을 확인하세요.',
        '자주 물이 닿는 장소라면 배수·건조와 세척 편의성을 함께 확인하세요.',
        '바닥에 놓는 제품은 가장자리가 보행 동선의 걸림턱이 되지 않는지 확인하세요.',
      ],
      [
        '비누·물때나 먼지가 쌓이면 미끄럼 방지 성능이 떨어질 수 있어 정기적으로 세척하세요.',
        '말림·찢어짐·마모·들뜸이 생기면 교체를 검토하세요.',
        '미끄럼방지용품만으로 낙상을 완전히 막을 수 없으므로 손잡이·조명 등 환경 개선도 함께 확인하세요.',
      ],
    );
  }

  if (category === '수동휠체어') {
    return commonGuide(
      product,
      '이동이 불편한 사용자의 실내외 이동을 보조하는',
      [
        '사용자의 좌폭과 체형에 맞는 시트 규격인지 확인하세요.',
        '집 안 문폭·복도폭·엘리베이터와 휠체어 전체 폭을 비교하세요.',
        '보호자가 차량에 싣거나 밀어야 한다면 중량, 접이 방식, 손잡이 높이도 확인하세요.',
      ],
      [
        '탑승·하차 전 양쪽 브레이크를 체결하고 발판 위치를 확인하세요.',
        '경사로나 단차에서는 뒤집힘·미끄러짐 위험이 있으므로 보호자가 충분히 주의하세요.',
        '타이어, 브레이크, 프레임, 발판과 팔걸이의 풀림·마모를 정기적으로 확인하세요.',
      ],
    );
  }

  if (category === '지팡이') {
    return commonGuide(
      product,
      '보행 시 균형과 체중 지지를 보조하는',
      [
        '팔꿈치가 자연스럽게 약간 굽혀지는 길이로 조절 가능한지 확인하세요.',
        '손잡이 형태가 손 크기와 악력에 맞고 장시간 잡기 편한지 확인하세요.',
        '실내외 바닥 환경과 사용 습관에 맞춰 단족·다족 여부와 고무팁 형태를 비교하세요.',
      ],
      [
        '길이 조절 핀이나 잠금부가 완전히 체결됐는지 확인하세요.',
        '고무팁이 닳거나 갈라지면 미끄러질 수 있으므로 교체하세요.',
        '지팡이만으로 균형 유지가 어렵다면 보행기 등 다른 보조기구가 더 적합한지 상담하세요.',
      ],
    );
  }

  if (category === '욕창예방방석') {
    return commonGuide(
      product,
      '장시간 앉아 있는 사용자의 압력 분산을 보조하는',
      [
        '휠체어나 의자의 좌판 크기와 방석 규격이 맞는지 확인하세요.',
        '공기·폼·젤 등 소재와 관리 방식이 보호자와 사용자가 감당하기 쉬운지 비교하세요.',
        '방석 사용 후 앉은 높이가 바뀌어 발판·팔걸이 위치가 불편해지지 않는지 확인하세요.',
      ],
      [
        '공기식은 권장 공기압과 누기 여부를 확인하고, 커버 오염·손상을 정기적으로 점검하세요.',
        '한 자세로 장시간 유지하지 말고 돌봄계획에 맞춰 자세 변경을 병행하세요.',
        '피부에 지속적인 발적·손상이 보이면 제품 사용만으로 판단하지 말고 의료진 또는 관련 전문가와 상의하세요.',
      ],
    );
  }

  if (category === '욕창예방매트리스') {
    return commonGuide(
      product,
      '침상 생활이 긴 사용자의 신체 압력 분산을 보조하는',
      [
        '침대 프레임과 매트리스의 폭·길이가 맞는지 확인하세요.',
        '공기압 조절식이라면 펌프 설치 공간, 소음과 전원 위치를 함께 확인하세요.',
        '사용자 체중 범위와 커버 세척·교체 방식도 비교하세요.',
      ],
      [
        '공기호스 꺾임, 누기, 펌프 작동 상태를 정기적으로 확인하세요.',
        '매트리스 사용 중에도 정기적인 피부 확인과 자세 변경이 필요합니다.',
        '전원·펌프 이상이나 매트리스 손상이 확인되면 사용설명서에 따라 즉시 점검하세요.',
      ],
    );
  }

  if (category === '자세변환용구') {
    return commonGuide(
      product,
      '침상에서 자세를 바꾸거나 특정 자세를 안정적으로 유지하는 것을 보조하는',
      [
        '사용 부위와 목적에 맞는 형태·높이·폭인지 확인하세요.',
        '커버 분리와 세척이 쉬운지, 피부에 닿는 재질이 관리하기 편한지 확인하세요.',
        '침대 폭 안에서 제품과 사용자의 몸이 안정적으로 놓이는지 확인하세요.',
      ],
      [
        '지지용구가 얼굴·목·호흡을 방해하지 않도록 위치를 확인하세요.',
        '한 부위에 압력이 집중되지 않는지 피부 상태를 정기적으로 살피세요.',
        '사용자의 신체 상태나 관절 가동 범위가 달라지면 배치 방법을 다시 확인하세요.',
      ],
    );
  }

  if (category === '요실금팬티') {
    return commonGuide(
      product,
      '요실금으로 인한 일상생활 불편과 의복 오염 관리에 사용하는',
      [
        '허리·엉덩이 둘레에 맞는 사이즈와 흡수부 위치를 확인하세요.',
        '세탁 후 반복 사용 제품은 세탁법·건조법과 교체 주기를 확인하세요.',
        '사용자의 활동량과 외출 빈도에 맞춰 착용감과 두께를 비교하세요.',
      ],
      [
        '젖은 상태로 장시간 착용하지 말고 피부를 청결하고 건조하게 관리하세요.',
        '제조사 세탁 지침을 지켜 흡수 기능 손상을 줄이세요.',
        '피부 자극이나 손상이 지속되면 사용을 중지하고 적절한 상담을 받으세요.',
      ],
    );
  }

  if (category === '전동침대' || category === '수동침대') {
    const electric = category === '전동침대';
    return commonGuide(
      product,
      `${electric ? '전동 조절' : '수동 조절'}을 통해 침상 생활과 돌봄 동작을 보조하는`,
      [
        '침대 설치 공간, 출입문 폭, 보호자의 돌봄 동선을 먼저 측정하세요.',
        '매트리스 규격과 난간·테이블 등 함께 사용하는 부속품의 호환 여부를 확인하세요.',
        electric ? '콘센트 위치와 리모컨 조작 범위, 정전 시 대응 방법을 확인하세요.' : '손잡이 또는 크랭크 조작 공간과 조작 부담을 확인하세요.',
      ],
      [
        '높이·등판·다리 각도를 조절할 때 신체나 침구가 프레임 사이에 끼지 않는지 확인하세요.',
        '이동 후에는 캐스터 브레이크를 모두 고정하세요.',
        electric ? '전원선·리모컨·모터에 손상이나 이상음이 있으면 전원을 분리하고 점검을 요청하세요.' : '조절부와 고정부에 풀림·변형이 없는지 정기적으로 확인하세요.',
      ],
    );
  }

  if (category === '경사로(실내용)' || category === '경사로(실외용)') {
    return commonGuide(
      product,
      '휠체어·보행보조기 등의 단차 이동을 돕는',
      [
        '단차 높이와 필요한 경사 길이를 실제 현장에서 측정하세요.',
        '통과할 휠체어 또는 보행보조기의 폭과 경사로 유효 폭을 비교하세요.',
        '설치면의 수평·미끄럼 여부와 출입문 개폐 간섭을 확인하세요.',
      ],
      [
        '설치 후 흔들림·들뜸이 없는지 확인하고 젖거나 얼어 있는 표면에서는 각별히 주의하세요.',
        '제품의 허용하중을 초과해 사용하지 마세요.',
        '경사가 과도한 위치는 제품 길이를 늘리거나 다른 이동 방법을 검토하세요.',
      ],
    );
  }

  if (category === '이동욕조') {
    return commonGuide(
      product,
      '침상 또는 생활 공간에서 목욕을 보조하기 위해 이동·설치하는',
      [
        '펼친 상태의 크기와 급수·배수 동선을 먼저 확인하세요.',
        '사용자 이동 방법과 보호자 작업 공간이 충분한지 확인하세요.',
        '보관 시 접이 크기, 건조 방법과 배수구 위치를 확인하세요.',
      ],
      [
        '사용 전 누수·파손 여부와 배수 상태를 확인하세요.',
        '뜨거운 물로 인한 화상을 막기 위해 물 온도를 먼저 확인하세요.',
        '사용 후 물기를 완전히 제거하고 건조해 곰팡이와 미끄럼 위험을 줄이세요.',
      ],
    );
  }

  if (category === '구강세척기(마우스피스형)') {
    return commonGuide(
      product,
      '구강 세정을 보조하기 위해 마우스피스 방식으로 사용하는',
      [
        '마우스피스의 착용 방식과 세척·교체 방법을 확인하세요.',
        '본체 설치 공간과 급수·배수 또는 물통 관리 방법을 확인하세요.',
        '사용자가 스스로 조작하기 어려운 경우 보호자의 사용 절차도 함께 확인하세요.',
      ],
      [
        '사용 전 제조사의 사용설명서와 세척 방법을 확인하세요.',
        '마우스피스는 개인별 위생관리를 하고 오염·손상이 있으면 교체하세요.',
        '통증·출혈 등 이상이 지속될 때는 기기 사용만으로 판단하지 말고 치과 등 전문가와 상의하세요.',
      ],
    );
  }

  if (category === '기저귀센서') {
    return commonGuide(
      product,
      '기저귀 상태 확인과 보호자의 교체 판단을 보조하는',
      [
        '센서 부착 방식과 알림을 확인하는 기기·앱의 호환성을 확인하세요.',
        '충전·배터리 관리와 세척 시 센서 분리 방법을 확인하세요.',
        '사용 장소의 통신 환경과 보호자가 알림을 확인할 수 있는 범위를 점검하세요.',
      ],
      [
        '센서가 피부를 직접 압박하거나 손상시키지 않도록 설명서대로 부착하세요.',
        '기기 알림만 의존하지 말고 정기적인 상태 확인을 병행하세요.',
        '침수·파손·과열 등 이상이 있으면 사용을 중지하세요.',
      ],
    );
  }

  if (category === '배회감지기' || category === '배회감지기(태그형)') {
    return commonGuide(
      product,
      '인지 저하 등으로 위치 확인이 필요한 사용자의 안전 관리를 보조하는',
      [
        '위치 확인 방식과 보호자 알림 수단, 통신 가능 지역을 확인하세요.',
        '착용형·태그형은 사용자가 불편 없이 지속 착용할 수 있는지 확인하세요.',
        '충전 주기와 보호자가 실제로 알림을 확인하는 절차를 정해 두세요.',
      ],
      [
        '배터리 잔량과 통신 상태를 정기적으로 확인하세요.',
        '위치정보는 오차나 지연이 있을 수 있으므로 감지기만으로 안전을 보장할 수 없습니다.',
        '개인정보와 위치정보는 제품 안내와 관련 법령에 맞게 관리하세요.',
      ],
    );
  }

  return commonGuide(
    product,
    '장기요양 수급자의 일상생활을 보조하기 위해 사용하는',
    [
      '사용자의 신체 상태와 실제 생활 공간에 제품 규격이 맞는지 확인하세요.',
      '급여 가능 여부와 남은 한도는 계약 전 복지용구 사업소 또는 장기요양 관련 조회를 통해 확인하세요.',
      '가격뿐 아니라 설치, 사용, 세척, 보관과 A/S 편의성도 함께 비교하세요.',
    ],
    [
      '처음 사용하기 전에 제조·공급사의 사용설명서와 주의사항을 확인하세요.',
      '파손, 흔들림, 잠금 이상이 확인되면 사용을 중지하고 점검을 요청하세요.',
      '사용자의 신체 상태가 달라졌다면 기존 제품이 계속 적합한지 다시 확인하세요.',
    ],
  );
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
        이로움 현재 유통상태와 급여코드·급여가격, 제조·공급 자료를 기준으로 제품 선택에 필요한 정보를 정리했습니다.
        외부 상세페이지를 그대로 복제하지 않고 확인 가능한 사실과 사용 포인트 중심으로 제공합니다.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 20 }}>
        <article className="content-card" style={{ margin: 0, padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>핵심 특징</h3>
          <ul>
            {guide.highlights.map((item) => <li key={item} style={{ marginBottom: 10 }}>{item}</li>)}
          </ul>
        </article>
        <article className="content-card" style={{ margin: 0, padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>선택 전 확인</h3>
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

      <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid #e2e8f0' }}>
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
