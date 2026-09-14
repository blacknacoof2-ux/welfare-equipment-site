'use client';

import { useMemo, useState } from 'react';
import AddToConsultCart from '@/components/AddToConsultCart';
import { CONSULT_NEEDS_KEY } from '@/lib/consult-cart';

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

const formatter = new Intl.NumberFormat('ko-KR');

function copay(price: number, rate: number) {
  return Math.floor((price * rate) / 10) * 10;
}

const rules: Array<{ keywords: RegExp; categories: Array<[string, number]> }> = [
  { keywords: /걷|보행|실버카|롤레이터|외출|다리.?힘|균형|지팡이/, categories: [['성인용보행기', 20], ['지팡이', 12]] },
  { keywords: /화장실|변기|배변|일어나기|일어서기/, categories: [['안전손잡이', 18], ['이동변기', 15]] },
  { keywords: /목욕|샤워|욕실|씻/, categories: [['목욕의자', 22], ['안전손잡이', 14], ['미끄럼방지용품', 12]] },
  { keywords: /미끄|낙상|넘어|넘어질/, categories: [['미끄럼방지용품', 20], ['안전손잡이', 15], ['성인용보행기', 8]] },
  { keywords: /휠체어|장거리.?이동|앉아서.?이동/, categories: [['수동휠체어', 22]] },
  { keywords: /침대|누워|기상|체위|욕창/, categories: [['전동침대', 18], ['수동침대', 14], ['욕창예방매트리스', 12], ['욕창예방방석', 8]] },
  { keywords: /배회|위치|길.?잃|치매/, categories: [['배회감지기', 20]] },
  { keywords: /경사|문턱|단차|휠체어.?턱/, categories: [['경사로', 20]] },
];

const quickNeeds = [
  '걷기가 불편하고 외출할 때 보행기가 필요해요',
  '화장실에서 앉고 일어날 때 힘들어요',
  '욕실에서 미끄러질까 걱정돼요',
  '침대에서 일어나기 어렵고 자세 바꾸기가 힘들어요',
  '휠체어로 집 안 문턱을 넘기 어려워요',
];

export default function CareConsultation({ candidates }: { candidates: ConsultationCandidate[] }) {
  const [needs, setNeeds] = useState('');
  const [place, setPlace] = useState<'home' | 'outdoor' | 'both'>('home');
  const [priority, setPriority] = useState<'fit' | 'light' | 'cost'>('fit');

  const ranked = useMemo(() => {
    const text = needs.trim();
    if (!text) return [];

    const scores = new Map<string, number>();
    rules.forEach((rule) => {
      if (rule.keywords.test(text)) {
        rule.categories.forEach(([category, score]) => scores.set(category, (scores.get(category) ?? 0) + score));
      }
    });

    return candidates
      .map((candidate) => {
        let score = scores.get(candidate.category) ?? 0;
        const searchable = `${candidate.title} ${candidate.description} ${candidate.category}`;
        const tokens = text.split(/[\s,./]+/).filter((token) => token.length >= 2);
        tokens.forEach((token) => {
          if (searchable.includes(token)) score += 2;
        });
        if (place === 'outdoor' && /실외|외출|바퀴|브레이크/.test(searchable)) score += 4;
        if (place === 'home' && /실내|슬림|컴팩트|접이/.test(searchable)) score += 3;
        if (priority === 'light' && candidate.weightKg !== undefined) score += Math.max(0, 8 - candidate.weightKg);
        if (priority === 'cost') score += Math.max(0, 8 - candidate.benefitPrice / 100000);
        return { ...candidate, score };
      })
      .filter((candidate) => candidate.score > 0)
      .sort((a, b) => b.score - a.score || (a.weightKg ?? 999) - (b.weightKg ?? 999) || a.benefitPrice - b.benefitPrice)
      .slice(0, 6);
  }, [candidates, needs, place, priority]);

  const suggestedCategories = Array.from(new Set(ranked.slice(0, 4).map((item) => item.category)));

  function persistNeeds() {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CONSULT_NEEDS_KEY, JSON.stringify({ needs, place, priority, savedAt: new Date().toISOString() }));
  }

  return (
    <section className="consult-shell">
      <div className="consult-hero">
        <div>
          <p className="eyebrow">ATOM CARE 맞춤 상담</p>
          <h1>필요한 상황을 말씀해 주세요</h1>
          <p>제품명을 몰라도 괜찮습니다. 불편한 상황과 사용 장소를 입력하면 현재 정상 유통 복지용구 중 맞는 품목과 제품을 먼저 추천합니다.</p>
        </div>
        <div className="consult-flow-mini">
          <strong>추천 → 신청목록 → 수급자 정보·인정서 제출 → 아톰케어 확인</strong>
          <span>사이트에서는 신청 접수까지 진행하고, 이후 공단 조회와 급여 확인은 아톰케어에서 별도로 처리합니다.</span>
        </div>
      </div>

      <div className="consult-card consult-input-card">
        <label className="consult-main-label">
          <span>어떤 도움이 필요하신가요?</span>
          <textarea
            rows={5}
            value={needs}
            onChange={(event) => setNeeds(event.target.value)}
            placeholder="예: 어머니가 화장실에서 일어나기 힘들고 욕실에서도 자주 미끄러질까 걱정됩니다."
          />
        </label>
        <div className="consult-quick-needs">
          {quickNeeds.map((text) => <button type="button" onClick={() => setNeeds(text)} key={text}>{text}</button>)}
        </div>
        <div className="consult-options">
          <label><span>주 사용 장소</span><select value={place} onChange={(event) => setPlace(event.target.value as typeof place)}><option value="home">집 안 위주</option><option value="outdoor">외출 위주</option><option value="both">실내·외 모두</option></select></label>
          <label><span>우선 기준</span><select value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)}><option value="fit">사용환경 적합</option><option value="light">가벼운 제품</option><option value="cost">낮은 일반 15% 부담금</option></select></label>
        </div>
      </div>

      {needs.trim() && ranked.length === 0 && (
        <div className="consult-card"><h2>조금 더 구체적으로 적어주세요</h2><p>예: 걷기, 화장실, 목욕, 미끄럼, 휠체어, 침대, 문턱처럼 실제 불편한 상황을 포함하면 더 정확히 찾을 수 있습니다.</p></div>
      )}

      {ranked.length > 0 && (
        <div className="consult-results">
          <div className="consult-results-heading">
            <div><p className="eyebrow">추천 결과</p><h2>현재 상황에 맞는 제품</h2><p>추천 품목: {suggestedCategories.join(' · ')}</p></div>
            <a className="button secondary" href="/consult/cart" onClick={persistNeeds}>신청목록 보기</a>
          </div>
          <div className="consult-result-grid">
            {ranked.map((candidate, index) => {
              const c15 = copay(candidate.benefitPrice, 0.15);
              const c9 = copay(candidate.benefitPrice, 0.09);
              const c6 = copay(candidate.benefitPrice, 0.06);
              return (
                <article className={`consult-product ${index === 0 ? 'best' : ''}`} key={candidate.benefitCode}>
                  <div className="consult-rank">{index === 0 ? 'BEST 1' : `${index + 1}위`}</div>
                  {candidate.imageUrl && <a href={`/products/${candidate.slug}`}><img src={candidate.imageUrl} alt={`${candidate.title} 제품사진`} loading="lazy" /></a>}
                  <div className="consult-product-body">
                    <span className="category-chip">{candidate.category}</span>
                    <h3><a href={`/products/${candidate.slug}`}>{candidate.title}</a></h3>
                    <p>{candidate.manufacturer} · {candidate.benefitCode}</p>
                    <div className="consult-price-main"><span>일반 15%</span><strong>{formatter.format(c15)}원{candidate.priceSuffix}</strong></div>
                    <small>감경 9% {formatter.format(c9)}원{candidate.priceSuffix} · 감경 6% {formatter.format(c6)}원{candidate.priceSuffix}</small>
                    <AddToConsultCart item={{ slug: candidate.slug, title: candidate.title, manufacturer: candidate.manufacturer, benefitCode: candidate.benefitCode, benefitPrice: candidate.benefitPrice, category: candidate.category, benefitMode: candidate.benefitMode, priceSuffix: candidate.priceSuffix, imageUrl: candidate.imageUrl }} compact />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      <div className="consult-card consult-disclaimer">
        <strong>중요 안내</strong>
        <p>이 추천은 제품 선택을 돕기 위한 1차 안내입니다. 수급자 정보와 장기요양인정서를 신청 시 함께 제출하고, 이후 공단 조회와 실제 급여 가능 여부 확인은 아톰케어에서 별도로 진행합니다.</p>
      </div>
    </section>
  );
}
