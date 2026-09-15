'use client';

import { useMemo, useState } from 'react';

export type WalkerCandidate = {
  slug: string;
  title: string;
  manufacturer: string;
  benefitCode: string;
  benefitPrice: number;
  dimensions?: string;
  weightKg?: number;
  maxUserWeightKg?: number;
  description: string;
  imageUrl?: string;
};

type Environment = 'mixed' | 'indoor' | 'outdoor';
type TransportNeed = 'often' | 'sometimes' | 'rare';
type Priority = 'balanced' | 'light' | 'narrow' | 'cost';

type ScoredCandidate = WalkerCandidate & {
  score: number;
  reasons: string[];
  cautions: string[];
  handleRange?: [number, number];
  widthCm?: number;
};

const formatter = new Intl.NumberFormat('ko-KR');

function copay15(price: number) {
  return Math.floor((price * 0.15) / 10) * 10;
}

function normalizeCm(value: number, unit?: string, source?: string) {
  const explicitMm = unit?.toLowerCase() === 'mm' || /mm|㎜/i.test(source ?? '');
  if (explicitMm || value > 150) return value / 10;
  return value;
}

function getHandleRange(dimensions?: string): [number, number] | undefined {
  if (!dimensions) return undefined;
  const matches = Array.from(
    dimensions.matchAll(/(\d+(?:\.\d+)?)\s*(?:~|～|-|–|—)\s*(\d+(?:\.\d+)?)\s*(cm|mm|㎝|㎜)?/gi),
  );

  const ranges = matches
    .map((match) => {
      const min = normalizeCm(Number(match[1]), match[3], dimensions);
      const max = normalizeCm(Number(match[2]), match[3], dimensions);
      return [Math.min(min, max), Math.max(min, max)] as [number, number];
    })
    .filter((range) => range[1] >= 60 && range[1] <= 130);

  if (!ranges.length) return undefined;
  return ranges.sort((a, b) => (b[0] + b[1]) - (a[0] + a[1]))[0];
}

function getWidthCm(dimensions?: string) {
  if (!dimensions) return undefined;
  const match = dimensions.match(/(?:폭|너비|W)?\s*(\d+(?:\.\d+)?)\s*(cm|mm|㎝|㎜)?\s*(?:×|x|X|\*)/);
  if (!match) return undefined;
  const value = normalizeCm(Number(match[1]), match[2], dimensions);
  return value >= 30 && value <= 100 ? value : undefined;
}

function scoreCandidate(
  candidate: WalkerCandidate,
  inputs: {
    heightCm: number;
    userWeightKg: number;
    doorwayCm: number;
    environment: Environment;
    transportNeed: TransportNeed;
    seatNeeded: boolean;
    priority: Priority;
    minPrice: number;
    maxPrice: number;
  },
): ScoredCandidate {
  let score = 50;
  const reasons: string[] = [];
  const cautions: string[] = [];
  const handleRange = getHandleRange(candidate.dimensions);
  const widthCm = getWidthCm(candidate.dimensions);

  if (candidate.maxUserWeightKg !== undefined) {
    if (inputs.userWeightKg > candidate.maxUserWeightKg) {
      return {
        ...candidate,
        score: 0,
        reasons: [],
        cautions: [`사용자 몸무게 ${inputs.userWeightKg}kg가 확인된 허용하중 ${candidate.maxUserWeightKg}kg를 초과합니다.`],
        handleRange,
        widthCm,
      };
    }
    reasons.push(`확인된 허용하중 ${candidate.maxUserWeightKg}kg 범위 안에 있습니다.`);
    score += 8;
  }

  // 키의 약 47%를 손목 높이의 참고 추정치로 사용합니다. 최종 높이는 실제 자세에서 확인해야 합니다.
  const targetHandle = inputs.heightCm * 0.47;
  if (handleRange) {
    if (targetHandle >= handleRange[0] && targetHandle <= handleRange[1]) {
      score += 25;
      reasons.push(`키 ${inputs.heightCm}cm 기준 추정 손잡이 높이와 제품 조절범위 ${handleRange[0]}~${handleRange[1]}cm가 잘 맞습니다.`);
    } else {
      const gap = targetHandle < handleRange[0]
        ? handleRange[0] - targetHandle
        : targetHandle - handleRange[1];
      if (gap <= 3) {
        score += 15;
        reasons.push('손잡이 조절범위가 예상 적정 높이에 가깝습니다.');
      } else if (gap <= 6) {
        score += 7;
        reasons.push('손잡이 높이는 사용 전 직접 맞춤 확인이 권장됩니다.');
      } else {
        score -= 16;
        cautions.push('키 기준 예상 손잡이 높이와 제품 조절범위 차이가 큽니다.');
      }
    }
  } else {
    cautions.push('공개 규격에서 손잡이 높이 범위를 자동 확인하지 못했습니다.');
  }

  if (inputs.doorwayCm > 0 && widthCm) {
    const clearance = inputs.doorwayCm - widthCm;
    if (clearance >= 10) {
      score += 14;
      reasons.push(`폭 약 ${widthCm}cm로 입력한 문폭 ${inputs.doorwayCm}cm에 여유가 있습니다.`);
    } else if (clearance >= 5) {
      score += 10;
      reasons.push(`폭 약 ${widthCm}cm로 문폭 통과 여유가 비교적 충분합니다.`);
    } else if (clearance >= 2) {
      score += 4;
      reasons.push('문폭 통과는 가능 범위지만 손·프레임 간섭 여유를 확인하세요.');
    } else if (clearance >= 0) {
      score -= 8;
      cautions.push(`제품 폭과 문폭 차이가 ${clearance.toFixed(1)}cm 정도라 실제 통과 확인이 필요합니다.`);
    } else {
      score -= 28;
      cautions.push(`제품 폭 약 ${widthCm}cm가 입력한 문폭 ${inputs.doorwayCm}cm보다 넓습니다.`);
    }
  } else if (inputs.doorwayCm > 0) {
    cautions.push('제품 전체 폭 정보가 부족해 문폭 적합도를 확인하지 못했습니다.');
  }

  if (candidate.weightKg !== undefined) {
    if (inputs.transportNeed === 'often') {
      if (candidate.weightKg <= 5) {
        score += 15;
        reasons.push(`${candidate.weightKg}kg로 차량 적재를 자주 할 때 비교적 가벼운 편입니다.`);
      } else if (candidate.weightKg <= 7) {
        score += 10;
        reasons.push(`${candidate.weightKg}kg로 차량 적재 시 무게 부담이 비교적 낮습니다.`);
      } else if (candidate.weightKg <= 10) {
        score += 3;
      } else {
        score -= 8;
        cautions.push(`${candidate.weightKg}kg로 자주 들어 올려 적재하기에는 부담이 클 수 있습니다.`);
      }
    } else if (inputs.transportNeed === 'sometimes') {
      if (candidate.weightKg <= 7) score += 7;
      else if (candidate.weightKg <= 10) score += 3;
    }
  } else if (inputs.transportNeed === 'often') {
    cautions.push('제품 중량 정보가 없어 차량 적재 편의 점수에 반영하지 못했습니다.');
  }

  const searchable = `${candidate.title} ${candidate.description} ${candidate.dimensions ?? ''}`.toLocaleLowerCase('ko-KR');
  if (inputs.environment === 'outdoor') {
    if (/실외|큰\s*바퀴|대형\s*바퀴|롤레이터|브레이크/.test(searchable)) {
      score += 9;
      reasons.push('공개 설명에서 실외 보행·바퀴·브레이크 관련 특징이 확인됩니다.');
    }
  } else if (inputs.environment === 'indoor') {
    if (widthCm && widthCm <= 55) {
      score += 9;
      reasons.push('전체 폭이 비교적 슬림해 실내 동선에 유리한 편입니다.');
    }
  } else if (/실내외/.test(searchable)) {
    score += 7;
    reasons.push('공개 설명에서 실내외 사용을 함께 고려한 제품입니다.');
  }

  if (inputs.seatNeeded) {
    if (/좌면|시트|앉|휴식/.test(searchable)) {
      score += 8;
      reasons.push('좌면·휴식 관련 정보가 확인됩니다.');
    } else {
      cautions.push('좌면 필요 조건을 선택했습니다. 상세페이지에서 좌면 유무를 다시 확인하세요.');
    }
  }

  if (inputs.priority === 'light' && candidate.weightKg !== undefined) {
    if (candidate.weightKg <= 5) score += 12;
    else if (candidate.weightKg <= 7) score += 7;
    else if (candidate.weightKg >= 10) score -= 5;
  }

  if (inputs.priority === 'narrow' && widthCm) {
    if (widthCm <= 50) score += 12;
    else if (widthCm <= 55) score += 7;
    else if (widthCm >= 65) score -= 5;
  }

  if (inputs.priority === 'cost' && inputs.maxPrice > inputs.minPrice) {
    const normalized = (inputs.maxPrice - candidate.benefitPrice) / (inputs.maxPrice - inputs.minPrice);
    score += Math.round(normalized * 14);
    if (normalized >= 0.7) reasons.push('현재 비교 제품 중 급여가격이 낮은 편입니다.');
  }

  return {
    ...candidate,
    score: Math.max(0, Math.min(100, Math.round(score))),
    reasons: reasons.slice(0, 3),
    cautions: cautions.slice(0, 2),
    handleRange,
    widthCm,
  };
}

export default function AdultWalkerRecommender({ candidates }: { candidates: WalkerCandidate[] }) {
  const [height, setHeight] = useState('165');
  const [userWeight, setUserWeight] = useState('65');
  const [doorway, setDoorway] = useState('75');
  const [environment, setEnvironment] = useState<Environment>('mixed');
  const [transportNeed, setTransportNeed] = useState<TransportNeed>('sometimes');
  const [seatNeeded, setSeatNeeded] = useState(false);
  const [priority, setPriority] = useState<Priority>('balanced');

  const ranked = useMemo(() => {
    const heightCm = Math.min(210, Math.max(130, Number(height) || 165));
    const userWeightKg = Math.min(180, Math.max(30, Number(userWeight) || 65));
    const doorwayCm = Math.min(130, Math.max(0, Number(doorway) || 0));
    const prices = candidates.map((candidate) => candidate.benefitPrice).filter((price) => price > 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;

    return candidates
      .map((candidate) => scoreCandidate(candidate, {
        heightCm,
        userWeightKg,
        doorwayCm,
        environment,
        transportNeed,
        seatNeeded,
        priority,
        minPrice,
        maxPrice,
      }))
      .filter((candidate) => candidate.score > 0)
      .sort((a, b) => b.score - a.score || (a.weightKg ?? 999) - (b.weightKg ?? 999) || a.benefitPrice - b.benefitPrice)
      .slice(0, 3);
  }, [candidates, doorway, environment, height, priority, seatNeeded, transportNeed, userWeight]);

  const hasVerifiedCapacity = candidates.some((candidate) => candidate.maxUserWeightKg !== undefined);

  return (
    <section className="walker-recommender" aria-labelledby="walker-recommender-title">
      <div className="walker-recommender-heading">
        <div>
          <p className="eyebrow">FIT FINDER</p>
          <h2 id="walker-recommender-title">내 몸과 생활환경에 맞는 성인용보행기 찾기</h2>
          <p>키·몸무게·사용 장소·제품 무게와 이동조건을 입력하면 현재 정상 유통 제품 중 최대 3개를 추천합니다.</p>
        </div>
        <span className="walker-recommender-count">비교 대상 {candidates.length}개</span>
      </div>

      <div className="walker-recommender-form">
        <label>
          <span>어르신 키</span>
          <div className="walker-input-with-unit">
            <input type="number" min="130" max="210" value={height} onChange={(event) => setHeight(event.target.value)} />
            <b>cm</b>
          </div>
        </label>
        <label>
          <span>어르신 몸무게</span>
          <div className="walker-input-with-unit">
            <input type="number" min="30" max="180" value={userWeight} onChange={(event) => setUserWeight(event.target.value)} />
            <b>kg</b>
          </div>
        </label>
        <label>
          <span>주 사용 장소</span>
          <select value={environment} onChange={(event) => setEnvironment(event.target.value as Environment)}>
            <option value="mixed">실내·실외 모두</option>
            <option value="indoor">실내 위주</option>
            <option value="outdoor">실외 위주</option>
          </select>
        </label>
        <label>
          <span>가장 좁은 문·통로 폭</span>
          <div className="walker-input-with-unit">
            <input type="number" min="45" max="130" value={doorway} onChange={(event) => setDoorway(event.target.value)} />
            <b>cm</b>
          </div>
        </label>
        <label>
          <span>차량에 싣는 빈도</span>
          <select value={transportNeed} onChange={(event) => setTransportNeed(event.target.value as TransportNeed)}>
            <option value="often">자주 싣습니다</option>
            <option value="sometimes">가끔 싣습니다</option>
            <option value="rare">거의 싣지 않습니다</option>
          </select>
        </label>
        <label>
          <span>제품 선택 우선 기준</span>
          <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
            <option value="balanced">전체 균형</option>
            <option value="light">가벼운 제품</option>
            <option value="narrow">좁은 실내 통과</option>
            <option value="cost">낮은 본인부담금</option>
          </select>
        </label>
        <label className="walker-checkbox">
          <input type="checkbox" checked={seatNeeded} onChange={(event) => setSeatNeeded(event.target.checked)} />
          <span>앉아서 쉴 수 있는 좌면이 꼭 필요해요</span>
        </label>
        {!hasVerifiedCapacity && (
          <p className="walker-user-weight-note">
            몸무게는 상담정보로 받지만 현재 공개 상품 데이터에 허용하중이 없는 제품은 몸무게 적합 여부를 임의 추정하지 않습니다. 구매 전 아톰케어랩에서 허용하중을 확인합니다.
          </p>
        )}
      </div>

      <div className="walker-recommendation-results" aria-live="polite">
        {ranked.map((candidate, index) => (
          <article className={`walker-result-card ${index === 0 ? 'best' : ''}`} key={candidate.slug}>
            <div className="walker-rank">
              <strong>BEST {index + 1}</strong>
              {index === 0 && <span>BEST MATCH</span>}
            </div>
            <div className="walker-result-main">
              <div className="walker-result-image">
                {candidate.imageUrl ? (
                  <img src={candidate.imageUrl} alt={`${candidate.title} 성인용보행기 제품사진`} loading="lazy" />
                ) : (
                  <div className="walker-result-placeholder">제품사진</div>
                )}
              </div>
              <div className="walker-result-copy">
                <div className="walker-score-line">
                  <div>
                    <h3>{candidate.title}</h3>
                    <p>{candidate.manufacturer} · 급여코드 {candidate.benefitCode}</p>
                  </div>
                  <div className="walker-score"><strong>{candidate.score}</strong><span>/100</span></div>
                </div>
                <div className="walker-fit-facts">
                  {candidate.handleRange && <span>손잡이 {candidate.handleRange[0]}~{candidate.handleRange[1]}cm</span>}
                  {candidate.widthCm && <span>폭 약 {candidate.widthCm}cm</span>}
                  {candidate.weightKg !== undefined && <span>제품 중량 {candidate.weightKg}kg</span>}
                  {candidate.maxUserWeightKg !== undefined && <span>허용하중 {candidate.maxUserWeightKg}kg</span>}
                  <span>일반 15% 부담 {formatter.format(copay15(candidate.benefitPrice))}원</span>
                </div>
                {candidate.reasons.length > 0 && (
                  <ul className="walker-reasons">
                    {candidate.reasons.map((reason) => <li key={reason}>✓ {reason}</li>)}
                  </ul>
                )}
                {candidate.cautions.length > 0 && (
                  <ul className="walker-cautions">
                    {candidate.cautions.map((caution) => <li key={caution}>확인: {caution}</li>)}
                  </ul>
                )}
                <a className="button primary" href={`/products/${candidate.slug}`}>제품 상세보기</a>
                <div className="consult-call-inline"><span>구매·적합성 확인</span><a href="tel:0319753335">031-975-3335</a></div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {ranked.length === 0 && (
        <div className="consult-card">
          <h3>현재 입력 조건에 맞는 추천 제품을 찾지 못했습니다.</h3>
          <p>조건을 임의로 완화해 부적합 제품을 추천하지 않습니다. 아톰케어랩에서 확인해 드리겠습니다.</p>
          <a className="button primary" href="tel:0319753335">구매 및 문의 031-975-3335</a>
        </div>
      )}

      <p className="walker-recommender-note">
        추천 점수는 확인된 제품 규격과 입력한 생활환경을 비교한 참고용 순위입니다. 실제 구매 전에는 허용하중, 손잡이 높이, 브레이크 조작, 보행 안정성, 좌면 높이와 사용 공간을 직접 확인해야 합니다.
      </p>
    </section>
  );
}
