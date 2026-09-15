'use client';

import { useMemo, useState } from 'react';
import AddToConsultCart from '@/components/AddToConsultCart';
import AdultWalkerRecommender, { type WalkerCandidate } from '@/components/AdultWalkerRecommender';

export type ConsultationCandidate = {
  slug: string;
  title: string;
  manufacturer: string;
  benefitCode: string;
  benefitPrice: number;
  category: string;
  benefitMode: 'PURCHASE' | 'RENTAL' | 'PURCHASE_OR_RENTAL';
  priceSuffix: string;
  imageUrl?: string;
  description: string;
  dimensions?: string;
  weightKg?: number;
};

type GuidedCategory =
  | '성인용보행기'
  | '안전손잡이'
  | '목욕의자'
  | '욕창예방매트리스'
  | '욕창예방방석'
  | '전동침대'
  | '수동휠체어';

type Answers = {
  height: string;
  userWeight: string;
  environment: 'indoor' | 'outdoor' | 'mixed';
  doorway: string;
  transport: 'often' | 'sometimes' | 'rare';
  priority: 'fit' | 'light' | 'cost';
  location: 'bathroom' | 'toilet' | 'bedroom' | 'entrance';
  installType: 'any' | 'wall' | 'pole';
  compactSpace: 'yes' | 'no';
  armrest: 'required' | 'any';
  fold: 'required' | 'any';
  rail: 'required' | 'any';
  bedFunction: 'any' | 'back' | 'legs' | 'both';
  airPump: 'required' | 'any';
  useHours: 'short' | 'long' | 'verylong';
};

type Scored = ConsultationCandidate & { score: number; reasons: string[]; cautions: string[]; widthCm?: number };

const formatter = new Intl.NumberFormat('ko-KR');
const PHONE = '031-975-3335';

const categories: Array<{ name: GuidedCategory; icon: string; help: string }> = [
  { name: '성인용보행기', icon: '🚶', help: '키·몸무게·실내외·제품무게·통로·차량적재' },
  { name: '수동휠체어', icon: '♿', help: '체형·실내외·통로폭·접이·차량적재' },
  { name: '목욕의자', icon: '🛁', help: '몸무게·욕실공간·팔걸이·접이 여부' },
  { name: '안전손잡이', icon: '🛡️', help: '설치 위치·설치 방식·사용 목적' },
  { name: '전동침대', icon: '🛏️', help: '몸무게·필요 기능·난간·돌봄 환경' },
  { name: '욕창예방매트리스', icon: '🛌', help: '몸무게·침상시간·에어펌프·체압분산' },
  { name: '욕창예방방석', icon: '🪑', help: '몸무게·휠체어 사용시간·휴대성' },
];

const initialAnswers: Answers = {
  height: '165',
  userWeight: '65',
  environment: 'mixed',
  doorway: '75',
  transport: 'sometimes',
  priority: 'fit',
  location: 'bathroom',
  installType: 'any',
  compactSpace: 'no',
  armrest: 'any',
  fold: 'any',
  rail: 'any',
  bedFunction: 'any',
  airPump: 'any',
  useHours: 'long',
};

function copay(price: number, rate: number) {
  return Math.floor((price * rate) / 10) * 10;
}

function normalizeCm(value: number, unit?: string, source?: string) {
  const explicitMm = unit?.toLowerCase() === 'mm' || /mm|㎜/i.test(source ?? '');
  if (explicitMm || value > 150) return value / 10;
  return value;
}

function getWidthCm(dimensions?: string) {
  if (!dimensions) return undefined;
  const match = dimensions.match(/(?:폭|너비|W)?\s*(\d+(?:\.\d+)?)\s*(cm|mm|㎝|㎜)?\s*(?:×|x|X|\*)/);
  if (!match) return undefined;
  const value = normalizeCm(Number(match[1]), match[2], dimensions);
  return value >= 25 && value <= 110 ? value : undefined;
}

function priceScore(price: number, minPrice: number, maxPrice: number) {
  if (maxPrice <= minPrice) return 0;
  return Math.round(((maxPrice - price) / (maxPrice - minPrice)) * 12);
}

function scoreGuided(candidate: ConsultationCandidate, category: GuidedCategory, answers: Answers, minPrice: number, maxPrice: number): Scored {
  let score = 45;
  const reasons: string[] = [];
  const cautions: string[] = [];
  const searchable = `${candidate.title} ${candidate.description} ${candidate.dimensions ?? ''}`.toLocaleLowerCase('ko-KR');
  const widthCm = getWidthCm(candidate.dimensions);

  if (answers.priority === 'cost') {
    score += priceScore(candidate.benefitPrice, minPrice, maxPrice);
    reasons.push('현재 비교 제품 중 급여가격을 함께 반영했습니다.');
  }

  if (category === '수동휠체어') {
    if (answers.environment === 'outdoor' && /실외|바퀴|브레이크|주행/.test(searchable)) {
      score += 12;
      reasons.push('제품 설명에서 실외 이동·바퀴·브레이크 관련 특징이 확인됩니다.');
    }
    if (answers.environment === 'indoor' && widthCm && widthCm <= 65) {
      score += 12;
      reasons.push(`전체 폭 약 ${widthCm}cm로 실내 이동 조건을 우선 반영했습니다.`);
    }
    const doorway = Number(answers.doorway) || 0;
    if (doorway > 0 && widthCm) {
      const clearance = doorway - widthCm;
      if (clearance >= 5) {
        score += 16;
        reasons.push(`입력한 통로폭 ${doorway}cm보다 제품 폭이 작아 여유가 있습니다.`);
      } else if (clearance < 0) {
        score -= 35;
        cautions.push(`제품 폭 약 ${widthCm}cm가 입력 통로폭 ${doorway}cm보다 넓습니다.`);
      } else {
        score -= 5;
        cautions.push('통로 통과 여유가 작아 실제 측정 확인이 필요합니다.');
      }
    }
    if (answers.transport !== 'rare' && /접이|폴딩/.test(searchable)) {
      score += 10;
      reasons.push('접이 관련 정보가 확인되어 차량 적재 조건에 유리합니다.');
    }
    if (answers.priority === 'light' && candidate.weightKg !== undefined) {
      score += Math.max(0, Math.round(16 - candidate.weightKg / 2));
      reasons.push(`제품 중량 ${candidate.weightKg}kg를 경량 우선 조건에 반영했습니다.`);
    }
  }

  if (category === '목욕의자') {
    if (answers.compactSpace === 'yes' && widthCm && widthCm <= 55) {
      score += 14;
      reasons.push(`폭 약 ${widthCm}cm로 좁은 욕실 조건을 우선 반영했습니다.`);
    }
    if (answers.armrest === 'required') {
      if (/팔걸이|암레스트/.test(searchable)) {
        score += 15;
        reasons.push('팔걸이 관련 정보가 제품 설명에서 확인됩니다.');
      } else {
        score -= 8;
        cautions.push('팔걸이 필요 조건을 제품 설명에서 확인하지 못했습니다.');
      }
    }
    if (answers.fold === 'required') {
      if (/접이|폴딩/.test(searchable)) {
        score += 15;
        reasons.push('접이 기능 관련 정보가 확인됩니다.');
      } else {
        score -= 8;
        cautions.push('접이 기능 필요 조건을 제품 설명에서 확인하지 못했습니다.');
      }
    }
    if (/미끄럼|배수|등받이|높이조절/.test(searchable)) {
      score += 7;
      reasons.push('목욕 시 안전·편의 관련 특징이 제품 설명에 포함되어 있습니다.');
    }
  }

  if (category === '안전손잡이') {
    const locationPatterns: Record<Answers['location'], RegExp> = {
      bathroom: /욕실|목욕|샤워/,
      toilet: /변기|화장실|배변/,
      bedroom: /침대|침실|기상/,
      entrance: /현관|출입|계단/,
    };
    if (locationPatterns[answers.location].test(searchable)) {
      score += 18;
      reasons.push('선택한 설치 위치와 관련된 제품 설명이 확인됩니다.');
    }
    if (answers.installType === 'wall') {
      if (/벽|벽부착|벽면/.test(searchable)) {
        score += 18;
        reasons.push('벽부착형 관련 정보가 확인됩니다.');
      } else score -= 8;
    }
    if (answers.installType === 'pole') {
      if (/기둥|천장|바닥|수직/.test(searchable)) {
        score += 18;
        reasons.push('기둥·수직 설치형 관련 정보가 확인됩니다.');
      } else score -= 8;
    }
  }

  if (category === '전동침대') {
    if (answers.rail === 'required') {
      if (/난간|사이드레일|안전가드/.test(searchable)) {
        score += 14;
        reasons.push('난간·사이드레일 관련 정보가 확인됩니다.');
      } else cautions.push('난간 필요 조건은 상세 사양을 추가 확인해야 합니다.');
    }
    if (answers.bedFunction === 'back' && /등판|상체|등\s*각도/.test(searchable)) {
      score += 14;
      reasons.push('상체·등판 조절 관련 기능이 확인됩니다.');
    }
    if (answers.bedFunction === 'legs' && /다리|무릎|각도/.test(searchable)) {
      score += 14;
      reasons.push('다리·무릎 조절 관련 기능이 확인됩니다.');
    }
    if (answers.bedFunction === 'both') {
      const back = /등판|상체|등\s*각도/.test(searchable);
      const legs = /다리|무릎/.test(searchable);
      if (back && legs) {
        score += 18;
        reasons.push('상체와 다리 조절 관련 기능이 모두 확인됩니다.');
      } else cautions.push('상체·다리 동시 조절 여부는 상세 사양 확인이 필요합니다.');
    }
    if (/높이조절|전동|모터/.test(searchable)) {
      score += 7;
      reasons.push('전동 조절 관련 설명이 확인됩니다.');
    }
  }

  if (category === '욕창예방매트리스') {
    if (answers.airPump === 'required') {
      if (/펌프|에어|공기|교대압/.test(searchable)) {
        score += 18;
        reasons.push('에어·펌프 방식 관련 정보가 확인됩니다.');
      } else {
        score -= 8;
        cautions.push('에어펌프 필요 조건을 제품 설명에서 확인하지 못했습니다.');
      }
    }
    if (answers.useHours === 'verylong' && /체압|분산|욕창|교대압/.test(searchable)) {
      score += 14;
      reasons.push('장시간 침상생활에서 확인할 체압분산 관련 설명이 있습니다.');
    } else if (answers.useHours === 'long' && /체압|분산|욕창/.test(searchable)) {
      score += 9;
      reasons.push('체압분산 관련 설명을 확인했습니다.');
    }
  }

  if (category === '욕창예방방석') {
    if (answers.useHours !== 'short' && /체압|분산|욕창|쿠션/.test(searchable)) {
      score += answers.useHours === 'verylong' ? 16 : 11;
      reasons.push('장시간 착석 시 확인할 체압분산 관련 설명이 있습니다.');
    }
    if (answers.priority === 'light' && candidate.weightKg !== undefined) {
      score += Math.max(0, Math.round(12 - candidate.weightKg));
      reasons.push(`제품 중량 ${candidate.weightKg}kg를 휴대성 조건에 반영했습니다.`);
    }
  }

  if (reasons.length === 0) {
    reasons.push('현재 공개된 제품 정보와 급여가격을 기준으로 기본 적합도를 비교했습니다.');
  }

  return {
    ...candidate,
    score: Math.max(0, Math.min(100, Math.round(score))),
    reasons: reasons.slice(0, 3),
    cautions: cautions.slice(0, 2),
    widthCm,
  };
}

function CategoryForm({ category, answers, setAnswers }: {
  category: GuidedCategory;
  answers: Answers;
  setAnswers: React.Dispatch<React.SetStateAction<Answers>>;
}) {
  const set = <K extends keyof Answers>(key: K, value: Answers[K]) => setAnswers((current) => ({ ...current, [key]: value }));

  if (category === '수동휠체어') {
    return (
      <div className="guided-form">
        <label><span>어르신 키</span><input type="number" min="130" max="210" value={answers.height} onChange={(e) => set('height', e.target.value)} /></label>
        <label><span>어르신 몸무게(kg)</span><input type="number" min="30" max="180" value={answers.userWeight} onChange={(e) => set('userWeight', e.target.value)} /></label>
        <label><span>주 사용 장소</span><select value={answers.environment} onChange={(e) => set('environment', e.target.value as Answers['environment'])}><option value="mixed">실내·실외 모두</option><option value="indoor">실내 위주</option><option value="outdoor">실외 위주</option></select></label>
        <label><span>가장 좁은 통로폭(cm)</span><input type="number" min="45" max="130" value={answers.doorway} onChange={(e) => set('doorway', e.target.value)} /></label>
        <label><span>차량 적재</span><select value={answers.transport} onChange={(e) => set('transport', e.target.value as Answers['transport'])}><option value="often">자주</option><option value="sometimes">가끔</option><option value="rare">거의 없음</option></select></label>
        <label><span>우선 기준</span><select value={answers.priority} onChange={(e) => set('priority', e.target.value as Answers['priority'])}><option value="fit">사용환경 적합</option><option value="light">가벼운 제품</option><option value="cost">낮은 본인부담금</option></select></label>
      </div>
    );
  }

  if (category === '목욕의자') {
    return (
      <div className="guided-form">
        <label><span>어르신 몸무게(kg)</span><input type="number" min="30" max="180" value={answers.userWeight} onChange={(e) => set('userWeight', e.target.value)} /></label>
        <label><span>욕실 공간</span><select value={answers.compactSpace} onChange={(e) => set('compactSpace', e.target.value as Answers['compactSpace'])}><option value="no">보통</option><option value="yes">좁은 편</option></select></label>
        <label><span>팔걸이</span><select value={answers.armrest} onChange={(e) => set('armrest', e.target.value as Answers['armrest'])}><option value="any">상관없음</option><option value="required">꼭 필요</option></select></label>
        <label><span>접이 기능</span><select value={answers.fold} onChange={(e) => set('fold', e.target.value as Answers['fold'])}><option value="any">상관없음</option><option value="required">꼭 필요</option></select></label>
        <label><span>우선 기준</span><select value={answers.priority} onChange={(e) => set('priority', e.target.value as Answers['priority'])}><option value="fit">사용환경 적합</option><option value="light">가벼운 제품</option><option value="cost">낮은 본인부담금</option></select></label>
      </div>
    );
  }

  if (category === '안전손잡이') {
    return (
      <div className="guided-form">
        <label><span>설치 위치</span><select value={answers.location} onChange={(e) => set('location', e.target.value as Answers['location'])}><option value="bathroom">욕실·샤워실</option><option value="toilet">변기·화장실</option><option value="bedroom">침대·침실</option><option value="entrance">현관·출입구</option></select></label>
        <label><span>희망 설치 방식</span><select value={answers.installType} onChange={(e) => set('installType', e.target.value as Answers['installType'])}><option value="any">상관없음</option><option value="wall">벽부착형</option><option value="pole">기둥·수직형</option></select></label>
        <label><span>우선 기준</span><select value={answers.priority} onChange={(e) => set('priority', e.target.value as Answers['priority'])}><option value="fit">설치환경 적합</option><option value="cost">낮은 본인부담금</option><option value="light">간결한 구조</option></select></label>
      </div>
    );
  }

  if (category === '전동침대') {
    return (
      <div className="guided-form">
        <label><span>어르신 몸무게(kg)</span><input type="number" min="30" max="200" value={answers.userWeight} onChange={(e) => set('userWeight', e.target.value)} /></label>
        <label><span>필요한 조절 기능</span><select value={answers.bedFunction} onChange={(e) => set('bedFunction', e.target.value as Answers['bedFunction'])}><option value="any">상관없음</option><option value="back">상체·등판 조절</option><option value="legs">다리·무릎 조절</option><option value="both">상체+다리 모두</option></select></label>
        <label><span>안전 난간</span><select value={answers.rail} onChange={(e) => set('rail', e.target.value as Answers['rail'])}><option value="any">상관없음</option><option value="required">꼭 필요</option></select></label>
        <label><span>우선 기준</span><select value={answers.priority} onChange={(e) => set('priority', e.target.value as Answers['priority'])}><option value="fit">기능 적합</option><option value="cost">낮은 월 본인부담금</option><option value="light">단순한 구성</option></select></label>
      </div>
    );
  }

  if (category === '욕창예방매트리스') {
    return (
      <div className="guided-form">
        <label><span>어르신 몸무게(kg)</span><input type="number" min="30" max="200" value={answers.userWeight} onChange={(e) => set('userWeight', e.target.value)} /></label>
        <label><span>하루 침상 사용시간</span><select value={answers.useHours} onChange={(e) => set('useHours', e.target.value as Answers['useHours'])}><option value="short">짧은 편</option><option value="long">긴 편</option><option value="verylong">대부분 침상 생활</option></select></label>
        <label><span>에어펌프 방식</span><select value={answers.airPump} onChange={(e) => set('airPump', e.target.value as Answers['airPump'])}><option value="any">상관없음</option><option value="required">에어펌프형 우선</option></select></label>
        <label><span>우선 기준</span><select value={answers.priority} onChange={(e) => set('priority', e.target.value as Answers['priority'])}><option value="fit">사용환경 적합</option><option value="cost">낮은 월 본인부담금</option><option value="light">관리 편의</option></select></label>
      </div>
    );
  }

  return (
    <div className="guided-form">
      <label><span>어르신 몸무게(kg)</span><input type="number" min="30" max="180" value={answers.userWeight} onChange={(e) => set('userWeight', e.target.value)} /></label>
      <label><span>하루 휠체어·의자 사용시간</span><select value={answers.useHours} onChange={(e) => set('useHours', e.target.value as Answers['useHours'])}><option value="short">짧은 편</option><option value="long">긴 편</option><option value="verylong">대부분 앉아서 생활</option></select></label>
      <label><span>우선 기준</span><select value={answers.priority} onChange={(e) => set('priority', e.target.value as Answers['priority'])}><option value="fit">체압분산 적합</option><option value="light">휴대성</option><option value="cost">낮은 본인부담금</option></select></label>
    </div>
  );
}

export default function CareConsultation({ candidates }: { candidates: ConsultationCandidate[] }) {
  const [selectedCategory, setSelectedCategory] = useState<GuidedCategory | null>(null);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);

  const allowedCandidates = useMemo(
    () => candidates.filter((candidate) => categories.some((category) => category.name === candidate.category)),
    [candidates],
  );

  const selectedCandidates = useMemo(
    () => selectedCategory ? allowedCandidates.filter((candidate) => candidate.category === selectedCategory) : [],
    [allowedCandidates, selectedCategory],
  );

  const walkerCandidates: WalkerCandidate[] = useMemo(
    () => selectedCandidates.map((candidate) => ({
      slug: candidate.slug,
      title: candidate.title,
      manufacturer: candidate.manufacturer,
      benefitCode: candidate.benefitCode,
      benefitPrice: candidate.benefitPrice,
      dimensions: candidate.dimensions,
      weightKg: candidate.weightKg,
      description: candidate.description,
      imageUrl: candidate.imageUrl,
    })),
    [selectedCandidates],
  );

  const ranked = useMemo(() => {
    if (!selectedCategory || selectedCategory === '성인용보행기') return [];
    const prices = selectedCandidates.map((candidate) => candidate.benefitPrice).filter((price) => price > 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    return selectedCandidates
      .map((candidate) => scoreGuided(candidate, selectedCategory, answers, minPrice, maxPrice))
      .filter((candidate) => candidate.score > 0)
      .sort((a, b) => b.score - a.score || (a.weightKg ?? 999) - (b.weightKg ?? 999) || a.benefitPrice - b.benefitPrice)
      .slice(0, 3);
  }, [answers, selectedCandidates, selectedCategory]);

  return (
    <section className="consult-shell">
      <div className="consult-hero">
        <div>
          <p className="eyebrow">ATOM CARE LAB AI 맞춤 추천</p>
          <h1>제품부터 선택하면<br />조건에 맞는 제품을 찾아드립니다</h1>
          <p>추천 대상은 성인용보행기, 안전손잡이, 목욕의자, 욕창예방매트리스, 욕창예방방석, 전동침대, 수동휠체어 7개 품목으로 제한합니다.</p>
        </div>
        <div className="consult-flow-mini">
          <strong>제품 선택 → 어르신 정보 → 사용환경 → BEST 1~3 → 상담·신청</strong>
          <span>제품 스펙이 확인되지 않은 항목은 임의로 추정하지 않으며 구매 전 아톰케어랩에서 최종 확인합니다.</span>
          <a className="button primary" href="tel:0319753335">☎ 구매 및 문의 {PHONE}</a>
        </div>
      </div>

      <section className="consult-category-section" aria-labelledby="consult-category-title">
        <p className="eyebrow">STEP 1</p>
        <h2 id="consult-category-title">어떤 제품을 찾으세요?</h2>
        <p className="muted">먼저 제품을 선택하면 해당 품목에 필요한 질문만 보여드립니다.</p>
        <div className="consult-category-grid">
          {categories.map((category) => {
            const count = allowedCandidates.filter((candidate) => candidate.category === category.name).length;
            return (
              <button
                type="button"
                className={`consult-category-card ${selectedCategory === category.name ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.name)}
                disabled={count === 0}
                key={category.name}
              >
                <span className="consult-category-icon" aria-hidden="true">{category.icon}</span>
                <strong>{category.name}</strong>
                <small>{category.help}</small>
                <small>{count > 0 ? `현재 비교 가능 ${count}개` : '검증 상품 준비중'}</small>
              </button>
            );
          })}
        </div>
      </section>

      {selectedCategory && (
        <>
          <div className="consult-selected-bar">
            <div><small>선택한 품목</small><br /><strong>{selectedCategory}</strong></div>
            <button type="button" onClick={() => setSelectedCategory(null)}>다른 제품 선택</button>
          </div>

          {selectedCategory === '성인용보행기' ? (
            <AdultWalkerRecommender candidates={walkerCandidates} />
          ) : (
            <>
              <div className="consult-card consult-input-card">
                <div>
                  <p className="eyebrow">STEP 2</p>
                  <h2>{selectedCategory} 맞춤 조건</h2>
                </div>
                <CategoryForm category={selectedCategory} answers={answers} setAnswers={setAnswers} />
                {['수동휠체어', '목욕의자', '전동침대', '욕창예방매트리스', '욕창예방방석'].includes(selectedCategory) && (
                  <p className="guided-recommend-note">몸무게는 상담정보로 받습니다. 현재 상품 원장에 허용하중이 없는 제품은 허용하중을 임의 추정하거나 안전 적합으로 표시하지 않습니다.</p>
                )}
              </div>

              <div className="consult-results">
                <div className="consult-results-heading">
                  <div><p className="eyebrow">STEP 3 · 추천 결과</p><h2>{selectedCategory} BEST {Math.min(3, ranked.length)}</h2><p>조건에 맞는 제품만 최대 3개를 보여드립니다.</p></div>
                </div>

                {ranked.length > 0 ? (
                  <div className="consult-result-grid">
                    {ranked.map((candidate, index) => {
                      const c15 = copay(candidate.benefitPrice, 0.15);
                      const c9 = copay(candidate.benefitPrice, 0.09);
                      const c6 = copay(candidate.benefitPrice, 0.06);
                      return (
                        <article className={`consult-product ${index === 0 ? 'best' : ''}`} key={candidate.benefitCode}>
                          <div className="consult-rank">BEST {index + 1}</div>
                          {candidate.imageUrl && <a href={`/products/${candidate.slug}`}><img src={candidate.imageUrl} alt={`${candidate.title} 제품사진`} loading="lazy" /></a>}
                          <div className="consult-product-body">
                            <span className="category-chip">{candidate.category}</span>
                            <h3><a href={`/products/${candidate.slug}`}>{candidate.title}</a></h3>
                            <p>{candidate.manufacturer} · {candidate.benefitCode}</p>
                            <div className="walker-score-line"><strong>적합도 {candidate.score}/100</strong></div>
                            <ul className="guided-result-reasons">{candidate.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                            {candidate.cautions.length > 0 && <div className="guided-result-caution">확인 필요: {candidate.cautions.join(' · ')}</div>}
                            <div className="consult-price-main"><span>일반 15%</span><strong>{formatter.format(c15)}원{candidate.priceSuffix}</strong></div>
                            <small>감경 9% {formatter.format(c9)}원{candidate.priceSuffix} · 감경 6% {formatter.format(c6)}원{candidate.priceSuffix}</small>
                            <a className="button secondary" href={`/products/${candidate.slug}`}>제품 상세보기</a>
                            <AddToConsultCart item={{ slug: candidate.slug, title: candidate.title, manufacturer: candidate.manufacturer, benefitCode: candidate.benefitCode, benefitPrice: candidate.benefitPrice, category: candidate.category, benefitMode: candidate.benefitMode, priceSuffix: candidate.priceSuffix, imageUrl: candidate.imageUrl }} compact />
                            <div className="consult-call-inline"><span>구매·적합성 확인</span><a href="tel:0319753335">{PHONE}</a></div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="consult-card">
                    <h3>현재 조건에 맞는 추천 제품이 없습니다.</h3>
                    <p>조건을 임의로 완화해 부적합 제품을 추천하지 않습니다. 현재 비교 가능한 제품이 1~2개라면 그 수만 표시하며, 적합 제품이 없으면 전화 상담으로 연결합니다.</p>
                    <a className="button primary" href="tel:0319753335">구매 및 문의 {PHONE}</a>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      <div className="consult-card consult-disclaimer">
        <strong>중요 안내</strong>
        <p>추천은 현재 정상 유통으로 확인된 제품의 공개 규격과 설명을 비교한 1차 안내입니다. 허용하중·설치조건·신체상태 등 안전에 필요한 미확인 사양은 추정하지 않으며 실제 급여 가능 여부와 최종 제품 선택은 상담 과정에서 확인합니다.</p>
      </div>
    </section>
  );
}
