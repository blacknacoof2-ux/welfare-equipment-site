export type WelfareCategory = {
  slug: string;
  name: string;
  shortDescription: string;
  seoTitle: string;
  seoDescription: string;
  intro: string;
  keywords: string[];
};

export const categories: WelfareCategory[] = [
  {
    slug: 'adult-walker',
    name: '성인용보행기',
    shortDescription: '보행 안정과 이동을 돕는 대표 복지용구',
    seoTitle: '성인용보행기 가격·본인부담금·복지용구 비교',
    seoDescription: '장기요양 성인용보행기의 급여가격과 15%·9%·6% 본인부담금, 무게, 규격, 제조사와 급여코드를 비교하세요.',
    intro: '성인용보행기는 보행이 불편한 어르신이 실내외에서 보다 안정적으로 이동할 수 있도록 돕는 복지용구입니다. 제품별 무게, 바퀴 크기, 접이 방식, 좌면 높이와 급여가격 차이가 크므로 실제 사용환경과 이용자의 신체 상태를 함께 확인하는 것이 중요합니다.',
    keywords: ['성인용보행기', '노인보행기', '실버카', '롤레이터', '복지용구 보행기', '성인용보행기 본인부담금'],
  },
  {
    slug: 'shower-chair',
    name: '목욕의자',
    shortDescription: '욕실 낙상 위험을 줄이는 목욕 보조용품',
    seoTitle: '목욕의자 복지용구 가격·본인부담금',
    seoDescription: '장기요양 목욕의자 급여제품의 가격, 15%·9%·6% 본인부담금과 규격을 확인하세요.',
    intro: '목욕의자는 욕실에서 앉은 자세로 안전하게 씻을 수 있도록 돕는 복지용구입니다.',
    keywords: ['목욕의자', '복지용구 목욕의자', '노인 목욕의자'],
  },
  {
    slug: 'safety-handle',
    name: '안전손잡이',
    shortDescription: '침실·욕실·현관 이동을 돕는 안전용품',
    seoTitle: '안전손잡이 복지용구 가격·본인부담금',
    seoDescription: '장기요양 안전손잡이 제품의 급여가격과 본인부담금, 설치 유형과 규격을 확인하세요.',
    intro: '안전손잡이는 일어서기, 앉기, 방향 전환과 이동 시 지지점을 제공해 낙상 위험을 줄이는 데 도움을 줍니다.',
    keywords: ['안전손잡이', '복지용구 안전손잡이', '노인 안전손잡이'],
  },
  {
    slug: 'portable-toilet',
    name: '이동변기',
    shortDescription: '거동이 불편한 수급자의 배변 보조용품',
    seoTitle: '이동변기 복지용구 가격·본인부담금',
    seoDescription: '장기요양 이동변기 급여제품의 가격, 본인부담금, 규격과 재질을 확인하세요.',
    intro: '이동변기는 화장실까지 이동이 어려운 사용자의 배변을 보조하는 복지용구입니다.',
    keywords: ['이동변기', '복지용구 이동변기', '노인 이동변기'],
  },
  {
    slug: 'anti-slip',
    name: '미끄럼방지용품',
    shortDescription: '욕실과 생활공간의 미끄러짐을 줄이는 용품',
    seoTitle: '미끄럼방지용품 복지용구 가격·본인부담금',
    seoDescription: '미끄럼방지매트와 미끄럼방지양말 등 장기요양 복지용구의 가격과 본인부담금을 확인하세요.',
    intro: '미끄럼방지용품은 욕실과 생활공간에서 미끄러짐을 줄이고 보다 안전한 이동을 돕습니다.',
    keywords: ['미끄럼방지매트', '미끄럼방지양말', '복지용구 미끄럼방지'],
  },
  {
    slug: 'pressure-cushion',
    name: '욕창예방방석',
    shortDescription: '장시간 착석 시 압력 분산을 돕는 용품',
    seoTitle: '욕창예방방석 복지용구 가격·본인부담금',
    seoDescription: '장기요양 욕창예방방석 제품의 급여가격, 본인부담금과 주요 규격을 확인하세요.',
    intro: '욕창예방방석은 장시간 앉아 생활하는 사용자의 압력 분산을 돕는 복지용구입니다.',
    keywords: ['욕창예방방석', '복지용구 방석', '노인 욕창방석'],
  },
  {
    slug: 'pressure-mattress',
    name: '욕창예방매트리스',
    shortDescription: '침상 생활자의 압력 분산을 위한 용품',
    seoTitle: '욕창예방매트리스 가격·본인부담금',
    seoDescription: '장기요양 욕창예방매트리스 급여제품의 가격과 본인부담금, 규격을 확인하세요.',
    intro: '욕창예방매트리스는 침상 생활 시간이 긴 사용자의 신체 압력을 분산하도록 설계된 복지용구입니다.',
    keywords: ['욕창예방매트리스', '복지용구 매트리스', '욕창방지매트리스'],
  },
  {
    slug: 'cane',
    name: '지팡이',
    shortDescription: '일상 보행을 보조하는 이동 지원용품',
    seoTitle: '복지용구 지팡이 가격·본인부담금',
    seoDescription: '장기요양 지팡이 급여제품의 가격, 본인부담금, 길이와 무게를 비교하세요.',
    intro: '지팡이는 보행 시 지지면을 넓혀 균형 유지와 이동을 보조하는 복지용구입니다.',
    keywords: ['복지용구 지팡이', '노인 지팡이', '장기요양 지팡이'],
  },
];

export function getCategoryBySlug(slug: string) {
  return categories.find((category) => category.slug === slug);
}
