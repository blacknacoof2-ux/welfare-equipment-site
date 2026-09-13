'use client';

import { useEffect, useMemo, useState } from 'react';
import AddToCompare from '@/components/AddToCompare';
import AddToConsultCart from '@/components/AddToConsultCart';
import {
  addConsultCartItem,
  readConsultationDraft,
  writeConsultationDraft,
  type CareConditionDraft,
  type RecipientDraft,
} from '@/lib/consult-cart';

export type ConsultationCandidate = {
  slug: string;
  title: string;
  model: string;
  manufacturer: string;
  benefitCode: string;
  benefitPrice: number;
  category: string;
  benefitMode: 'PURCHASE' | 'RENTAL' | 'PURCHASE_OR_RENTAL';
  priceSuffix: string;
  imageUrl?: string;
  description: string;
  dimensions?: string;
  material?: string;
  weightKg?: number;
};

type CategoryRecommendation = {
  category: string;
  score: number;
  reasons: string[];
};

const formatter = new Intl.NumberFormat('ko-KR');

function copay(price: number, rate: number) {
  return Math.floor((price * rate) / 10) * 10;
}

const initialRecipient: RecipientDraft = {
  recipientName: '',
  recognitionNumber: '',
  birthDate: '',
  careGrade: '',
  validityStartDate: '',
};

const initialConditions: CareConditionDraft = {
  walkingStatus: 'independent',
  legStrength: 'good',
  sitStand: 'independent',
  fallRisk: 'low',
  bathroomRisk: 'low',
  bathingHelp: 'none',
  toiletDifficulty: 'none',
  threshold: 'none',
  bedMobility: 'independent',
  caregiver: 'resident',
  place: 'home',
  priority: 'fit',
  notes: '',
};

function sameCategory(candidateCategory: string, requestedCategory: string) {
  if (candidateCategory === requestedCategory) return true;
  if (requestedCategory === '경사로') return candidateCategory.startsWith('경사로');
  return false;
}

function setupTitle(categories: string[]) {
  if (categories.includes('성인용보행기') && categories.includes('안전손잡이')) return '보행·낙상 예방 홈 셋업';
  if (categories.includes('목욕의자') && categories.includes('미끄럼방지용품')) return '욕실 안심 셋업';
  if (categories.includes('이동변기') && categories.includes('안전손잡이')) return '화장실 기립·배변 셋업';
  if (categories.includes('수동휠체어') || categories.some((category) => category.startsWith('경사로'))) return '휠체어 이동 동선 셋업';
  if (categories.includes('전동침대') || categories.includes('욕창예방매트리스')) return '침실 돌봄 셋업';
  return '생활 안전 맞춤 셋업';
}

export default function CareConsultation({ candidates }: { candidates: ConsultationCandidate[] }) {
  const [recipient, setRecipient] = useState<RecipientDraft>(initialRecipient);
  const [conditions, setConditions] = useState<CareConditionDraft>(initialConditions);
  const [needs, setNeeds] = useState('');
  const [hasRun, setHasRun] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [cartMessage, setCartMessage] = useState('');

  useEffect(() => {
    const draft = readConsultationDraft();
    if (!draft) return;
    setRecipient(draft.recipient);
    setConditions(draft.conditions);
    setNeeds(draft.needs ?? '');
    if (draft.recommendedCategories?.length) setHasRun(true);
  }, []);

  const categoryRecommendations = useMemo(() => {
    if (!hasRun) return [] as CategoryRecommendation[];

    const map = new Map<string, { score: number; reasons: string[] }>();
    const add = (category: string, score: number, reason: string) => {
      const current = map.get(category) ?? { score: 0, reasons: [] };
      current.score += score;
      if (!current.reasons.includes(reason)) current.reasons.push(reason);
      map.set(category, current);
    };

    if (conditions.walkingStatus === 'unstable') {
      add('성인용보행기', 34, '혼자 걷기는 가능하지만 보행이 불안정해 이동 지지가 우선입니다.');
      add('안전손잡이', 16, '집 안 기립·방향전환 시 잡을 지지점이 도움이 됩니다.');
    }
    if (conditions.walkingStatus === 'assist') {
      add('성인용보행기', 38, '부축이 필요한 보행 상태라 보행 보조 제품을 우선 검토합니다.');
      add('안전손잡이', 20, '실내 주요 동선에 안정적인 손 지지점이 필요합니다.');
    }
    if (conditions.walkingStatus === 'walker') {
      add('성인용보행기', 46, '현재 보행기 수준의 지지가 필요한 상태로 입력되었습니다.');
      add('안전손잡이', 20, '침실·화장실 이동 구간의 추가 지지를 권장합니다.');
    }
    if (conditions.walkingStatus === 'wheelchair') {
      add('수동휠체어', 48, '보행보다 휠체어 이동 비중이 높은 상태로 입력되었습니다.');
      add('경사로', 26, '문턱과 단차를 줄여 휠체어 이동 동선을 확보할 필요가 있습니다.');
    }

    if (conditions.legStrength === 'weak') {
      add('성인용보행기', 18, '다리 힘이 약해 보행 중 지지력이 필요합니다.');
      add('안전손잡이', 16, '기립과 착석 때 상지로 지지할 수 있는 손잡이가 도움이 됩니다.');
    }
    if (conditions.legStrength === 'oneSide') {
      add('성인용보행기', 17, '한쪽 다리 힘이 약해 좌우 균형을 보조할 필요가 있습니다.');
      add('지팡이', 10, '전문가 확인 후 보조 지지용 지팡이도 비교할 수 있습니다.');
    }
    if (conditions.legStrength === 'veryWeak') {
      add('성인용보행기', 24, '양쪽 다리 힘이 매우 약해 충분한 지지가 필요합니다.');
      add('수동휠체어', 22, '장거리 또는 피로 시 앉아서 이동하는 대안을 함께 검토합니다.');
      add('안전손잡이', 22, '기립·착석 구간의 손 지지가 중요합니다.');
    }

    if (conditions.sitStand === 'hard') add('안전손잡이', 24, '앉고 일어서기가 많이 불편해 기립 보조 손잡이를 우선 권장합니다.');
    if (conditions.sitStand === 'help') {
      add('안전손잡이', 30, '기립 시 다른 사람의 도움이 필요한 상태라 고정 지지점이 중요합니다.');
      add('이동변기', 12, '화장실 이동이 어렵다면 이동거리를 줄이는 배변 보조용품도 검토합니다.');
    }

    if (conditions.fallRisk === 'high') {
      add('안전손잡이', 24, '낙상 위험이 높아 주요 생활 동선의 지지점 확보가 필요합니다.');
      add('미끄럼방지용품', 22, '미끄러운 바닥 환경을 함께 개선하는 것이 좋습니다.');
      add('성인용보행기', 12, '이동 시 균형 보조 필요성을 함께 검토합니다.');
    }
    if (conditions.fallRisk === 'recent') {
      add('안전손잡이', 30, '최근 낙상 경험이 있어 생활공간 안전 보강을 우선합니다.');
      add('미끄럼방지용품', 26, '바닥 미끄럼 위험을 줄이는 보조용품을 함께 권장합니다.');
      add('성인용보행기', 15, '이동 시 안정성을 높일 보행 보조 제품을 검토합니다.');
    }

    if (conditions.bathroomRisk === 'medium') add('미끄럼방지용품', 16, '욕실 미끄럼 위험이 있어 바닥 안전 보강이 필요합니다.');
    if (conditions.bathroomRisk === 'high') {
      add('미끄럼방지용품', 28, '욕실 미끄럼 위험이 높아 바닥 안전용품을 우선 권장합니다.');
      add('안전손잡이', 24, '욕실 기립·이동 시 잡을 손잡이가 필요합니다.');
      add('목욕의자', 20, '서서 목욕하는 시간을 줄여 낙상 위험을 낮추는 데 도움이 됩니다.');
    }

    if (conditions.bathingHelp === 'partial') add('목욕의자', 24, '목욕 시 일부 도움이 필요해 앉아서 씻을 수 있는 환경을 권장합니다.');
    if (conditions.bathingHelp === 'full') {
      add('목욕의자', 32, '목욕 시 전반적인 도움이 필요한 상태로 안정적인 착석 환경이 중요합니다.');
      add('안전손잡이', 18, '욕실 이동과 옮겨앉기 동작을 보조할 지지점을 함께 검토합니다.');
    }

    if (conditions.toiletDifficulty === 'stand') add('안전손잡이', 24, '변기에서 일어나기 어려워 변기 주변 손잡이가 우선입니다.');
    if (conditions.toiletDifficulty === 'distance') {
      add('이동변기', 30, '화장실까지 이동이 어려워 생활공간 가까운 배변 보조용품을 권장합니다.');
      add('안전손잡이', 15, '옮겨앉기와 기립 동작을 보조할 지지점도 함께 검토합니다.');
    }
    if (conditions.toiletDifficulty === 'both') {
      add('이동변기', 36, '화장실 이동과 기립 모두 불편해 이동거리를 줄이는 제품을 우선 검토합니다.');
      add('안전손잡이', 28, '배변 전후 옮겨앉기와 기립을 보조할 손잡이가 필요합니다.');
    }

    if (conditions.threshold === 'some') add('경사로', 18, '집 안 문턱·단차가 있어 이동 동선 개선을 검토합니다.');
    if (conditions.threshold === 'many') add('경사로', 28, '문턱·단차가 많아 이동기기 사용 전 동선 정리가 필요합니다.');

    if (conditions.bedMobility === 'hard') {
      add('전동침대', 20, '침대에서 기상·자세변경이 불편해 높이와 각도 조절 기능을 검토합니다.');
      add('안전손잡이', 12, '침대 옆 기립 지지점도 함께 고려합니다.');
    }
    if (conditions.bedMobility === 'help') {
      add('전동침대', 28, '침대에서 움직일 때 도움이 필요한 상태라 돌봄 동작을 줄일 수 있는 침대를 검토합니다.');
      add('욕창예방매트리스', 18, '누워 있는 시간이 길다면 피부 압박 관리 제품도 함께 상담합니다.');
    }
    if (conditions.bedMobility === 'mostlyBed') {
      add('전동침대', 34, '침상 생활 비중이 높아 체위·기립 보조가 가능한 침대를 우선 검토합니다.');
      add('욕창예방매트리스', 30, '장시간 누워 지내는 경우 압박 분산용 매트리스를 함께 검토합니다.');
      add('자세변환용구', 18, '체위 변경 보조용품도 함께 상담합니다.');
    }

    if (conditions.caregiver === 'alone') {
      add('안전손잡이', 10, '혼자 있는 시간이 많아 스스로 잡을 수 있는 고정 지지점의 우선도가 올라갑니다.');
      add('성인용보행기', 8, '독립 이동이 필요한 시간대의 보행 안정성을 함께 검토합니다.');
    }

    const freeText = `${needs} ${conditions.notes}`.trim();
    if (/걷|보행|다리|실버카|롤레이터/.test(freeText)) add('성인용보행기', 12, '입력한 설명에 보행 관련 불편이 포함되어 있습니다.');
    if (/화장실|변기|일어나|기립/.test(freeText)) add('안전손잡이', 10, '입력한 설명에 기립·화장실 관련 불편이 포함되어 있습니다.');
    if (/목욕|샤워|욕실/.test(freeText)) add('목욕의자', 10, '입력한 설명에 목욕·욕실 관련 불편이 포함되어 있습니다.');
    if (/미끄|낙상|넘어/.test(freeText)) add('미끄럼방지용품', 10, '입력한 설명에 낙상·미끄럼 위험이 포함되어 있습니다.');
    if (/휠체어/.test(freeText)) add('수동휠체어', 12, '입력한 설명에 휠체어 이동 필요가 포함되어 있습니다.');
    if (/문턱|단차|경사/.test(freeText)) add('경사로', 10, '입력한 설명에 문턱·단차 문제가 포함되어 있습니다.');
    if (/침대|누워|욕창|체위/.test(freeText)) add('전동침대', 10, '입력한 설명에 침상 생활 관련 불편이 포함되어 있습니다.');

    return Array.from(map.entries())
      .map(([category, value]) => ({ category, score: value.score, reasons: value.reasons }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [conditions, hasRun, needs]);

  const categoryGroups = useMemo(() => {
    return categoryRecommendations.map((recommendation) => {
      const products = candidates
        .filter((candidate) => sameCategory(candidate.category, recommendation.category))
        .map((candidate) => {
          let fitScore = recommendation.score;
          const searchable = `${candidate.title} ${candidate.model} ${candidate.description} ${candidate.dimensions ?? ''}`;
          if (conditions.place === 'home' && /실내|슬림|컴팩트|접이/.test(searchable)) fitScore += 4;
          if (conditions.place === 'outdoor' && /실외|외출|바퀴|브레이크/.test(searchable)) fitScore += 4;
          if (conditions.place === 'both' && /실내외|접이|브레이크/.test(searchable)) fitScore += 3;
          if (conditions.priority === 'light' && candidate.weightKg !== undefined) fitScore += Math.max(0, 10 - candidate.weightKg);
          if (conditions.priority === 'cost') fitScore += Math.max(0, 10 - candidate.benefitPrice / 100000);
          return { ...candidate, fitScore };
        })
        .sort((a, b) => b.fitScore - a.fitScore || (a.weightKg ?? 999) - (b.weightKg ?? 999) || a.benefitPrice - b.benefitPrice)
        .slice(0, 3);
      return { ...recommendation, products };
    }).filter((group) => group.products.length > 0);
  }, [candidates, categoryRecommendations, conditions.place, conditions.priority]);

  const setProducts = useMemo(() => categoryGroups.map((group) => group.products[0]).slice(0, 5), [categoryGroups]);
  const setCategories = categoryGroups.map((group) => group.products[0]?.category ?? group.category).slice(0, 5);
  const recommendationTitle = setupTitle(setCategories);

  const recipientComplete = Boolean(
    recipient.recipientName.trim()
      && /^\d{10}$/.test(recipient.recognitionNumber)
      && recipient.birthDate
      && recipient.careGrade
      && recipient.validityStartDate,
  );

  function persistDraft() {
    writeConsultationDraft({
      recipient,
      conditions,
      needs,
      recommendedSetTitle: recommendationTitle,
      recommendedCategories: setCategories,
      savedAt: new Date().toISOString(),
    });
  }

  function runRecommendation() {
    setFormMessage('');
    setCartMessage('');
    if (!recipientComplete) {
      setFormMessage('계약 상담에 필요한 수급자 기본정보를 먼저 모두 입력해 주세요. 인정번호는 L을 제외한 숫자 10자리입니다.');
      return;
    }
    setHasRun(true);
    window.setTimeout(() => {
      writeConsultationDraft({
        recipient,
        conditions,
        needs,
        recommendedSetTitle: '맞춤 셋업',
        savedAt: new Date().toISOString(),
      });
    }, 0);
  }

  function addWholeSet() {
    setProducts.forEach((product) => addConsultCartItem({
      slug: product.slug,
      title: product.title,
      manufacturer: product.manufacturer,
      benefitCode: product.benefitCode,
      benefitPrice: product.benefitPrice,
      category: product.category,
      benefitMode: product.benefitMode,
      priceSuffix: product.priceSuffix,
      imageUrl: product.imageUrl,
    }));
    persistDraft();
    setCartMessage(`${recommendationTitle} ${setProducts.length}개 제품을 상담 장바구니에 담았습니다.`);
  }

  return (
    <section className="consult-shell">
      <div className="consult-hero">
        <div>
          <p className="eyebrow">ATOM CARE AI 복지용구 셋업</p>
          <h1>수급자 상태를 입력하면 집에 필요한 복지용구를 세트로 추천합니다</h1>
          <p>처음 복지용구를 준비할 때 보행, 욕실, 화장실, 침실과 집 안 이동 상태를 함께 보고 필요한 품목을 한 번에 구성합니다.</p>
        </div>
        <div className="consult-flow-mini">
          <strong>수급자 정보 → 상태 진단 → AI 셋업 추천 → 같은 품목 비교 → 상담 장바구니</strong>
          <span>추천은 현재 정상 유통 제품과 확인 가능한 사양을 기반으로 하며, 실제 급여 가능 여부와 본인부담률은 담당자 확인 후 확정합니다.</span>
        </div>
      </div>

      <div className="consult-card recipient-card">
        <div className="consult-section-title">
          <div><p className="eyebrow">1. 수급자 정보</p><h2>계약 상담 기본정보</h2></div>
          <span className="privacy-chip">현재 탭에서만 임시 보관</span>
        </div>
        <div className="recipient-grid">
          <label><span>수급자명 <b>*</b></span><input value={recipient.recipientName} onChange={(event) => setRecipient({ ...recipient, recipientName: event.target.value })} placeholder="수급자명 입력" autoComplete="off" /></label>
          <label><span>장기요양인정번호 <b>*</b></span><div className="recognition-input"><strong>L</strong><input value={recipient.recognitionNumber} maxLength={10} inputMode="numeric" onChange={(event) => setRecipient({ ...recipient, recognitionNumber: event.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="숫자 10자리" autoComplete="off" /></div></label>
          <label><span>생년월일 <b>*</b></span><input type="date" value={recipient.birthDate} onChange={(event) => setRecipient({ ...recipient, birthDate: event.target.value })} /></label>
          <label><span>장기요양인정등급 <b>*</b></span><select value={recipient.careGrade} onChange={(event) => setRecipient({ ...recipient, careGrade: event.target.value })}><option value="">선택</option><option>1등급</option><option>2등급</option><option>3등급</option><option>4등급</option><option>5등급</option><option>인지지원등급</option></select></label>
          <label><span>유효기간 시작일 <b>*</b></span><input type="date" value={recipient.validityStartDate} onChange={(event) => setRecipient({ ...recipient, validityStartDate: event.target.value })} /></label>
        </div>
        <p className="recipient-note">계약기준일은 입력받지 않습니다. 수급자 정보는 추천·상담 연결을 위해 현재 브라우저 탭의 세션에만 임시 보관하며, 상담 전송 시에는 별도 동의 후 보안 접수처로 전달합니다.</p>
      </div>

      <div className="consult-card condition-card">
        <div className="consult-section-title"><div><p className="eyebrow">2. 생활·신체 상태</p><h2>어디에서 무엇이 가장 불편한가요?</h2></div></div>
        <div className="condition-grid">
          <label><span>보행 상태</span><select value={conditions.walkingStatus} onChange={(event) => setConditions({ ...conditions, walkingStatus: event.target.value })}><option value="independent">혼자 걸음 가능</option><option value="unstable">혼자 걷지만 불안정</option><option value="assist">부축 필요</option><option value="walker">보행기 수준의 지지 필요</option><option value="wheelchair">휠체어 이동 위주</option></select></label>
          <label><span>다리 힘</span><select value={conditions.legStrength} onChange={(event) => setConditions({ ...conditions, legStrength: event.target.value })}><option value="good">양호</option><option value="weak">양쪽이 약함</option><option value="oneSide">한쪽이 약함</option><option value="veryWeak">매우 약함</option></select></label>
          <label><span>앉고 일어나기</span><select value={conditions.sitStand} onChange={(event) => setConditions({ ...conditions, sitStand: event.target.value })}><option value="independent">스스로 가능</option><option value="slightly">조금 불편</option><option value="hard">많이 불편</option><option value="help">다른 사람 도움 필요</option></select></label>
          <label><span>낙상 위험</span><select value={conditions.fallRisk} onChange={(event) => setConditions({ ...conditions, fallRisk: event.target.value })}><option value="low">낮음</option><option value="medium">보통</option><option value="high">높음</option><option value="recent">최근 넘어진 적 있음</option></select></label>
          <label><span>욕실 미끄럼 위험</span><select value={conditions.bathroomRisk} onChange={(event) => setConditions({ ...conditions, bathroomRisk: event.target.value })}><option value="low">낮음</option><option value="medium">걱정됨</option><option value="high">높음 / 잡을 곳 필요</option></select></label>
          <label><span>목욕 도움</span><select value={conditions.bathingHelp} onChange={(event) => setConditions({ ...conditions, bathingHelp: event.target.value })}><option value="none">혼자 가능</option><option value="partial">일부 도움 필요</option><option value="full">많은 도움 필요</option></select></label>
          <label><span>화장실 이용</span><select value={conditions.toiletDifficulty} onChange={(event) => setConditions({ ...conditions, toiletDifficulty: event.target.value })}><option value="none">큰 불편 없음</option><option value="stand">변기에서 일어나기 힘듦</option><option value="distance">화장실까지 이동이 힘듦</option><option value="both">이동과 기립 모두 힘듦</option></select></label>
          <label><span>문턱·단차</span><select value={conditions.threshold} onChange={(event) => setConditions({ ...conditions, threshold: event.target.value })}><option value="none">거의 없음</option><option value="some">일부 있음</option><option value="many">여러 곳에 있음</option></select></label>
          <label><span>침대에서 움직이기</span><select value={conditions.bedMobility} onChange={(event) => setConditions({ ...conditions, bedMobility: event.target.value })}><option value="independent">스스로 가능</option><option value="hard">기상·자세변경이 불편</option><option value="help">도움 필요</option><option value="mostlyBed">침상 생활 비중이 높음</option></select></label>
          <label><span>보호자 도움</span><select value={conditions.caregiver} onChange={(event) => setConditions({ ...conditions, caregiver: event.target.value })}><option value="resident">주로 함께 있음</option><option value="daytime">일부 시간만 도움</option><option value="alone">혼자 있는 시간이 많음</option></select></label>
          <label><span>주 사용 장소</span><select value={conditions.place} onChange={(event) => setConditions({ ...conditions, place: event.target.value as CareConditionDraft['place'] })}><option value="home">집 안 위주</option><option value="outdoor">외출 위주</option><option value="both">실내·외 모두</option></select></label>
          <label><span>제품 선택 우선순위</span><select value={conditions.priority} onChange={(event) => setConditions({ ...conditions, priority: event.target.value as CareConditionDraft['priority'] })}><option value="fit">사용환경 적합</option><option value="light">가벼운 제품 우선</option><option value="cost">낮은 일반 15% 부담금</option></select></label>
        </div>
        <label className="consult-main-label condition-notes"><span>추가로 알려주실 내용</span><textarea rows={3} value={needs} onChange={(event) => setNeeds(event.target.value)} placeholder="예: 밤에 화장실을 자주 가고 침대에서 일어날 때 벽을 짚습니다. 욕실에는 잡을 손잡이가 없습니다." /></label>
        <button className="button primary recommend-button" type="button" onClick={runRecommendation}>AI 복지용구 셋업 추천하기</button>
        {formMessage && <div className="consult-submit-message error">{formMessage}</div>}
      </div>

      {hasRun && categoryGroups.length === 0 && (
        <div className="consult-card"><h2>현재 입력에서는 우선 추천 세트가 없습니다</h2><p>불편한 항목을 실제 상태에 맞게 선택하거나 추가 설명을 입력해 주세요. 필요하지 않은 복지용구를 억지로 추천하지 않습니다.</p></div>
      )}

      {hasRun && setProducts.length > 0 && (
        <>
          <div className="consult-card setup-summary">
            <div className="consult-section-title">
              <div><p className="eyebrow">3. AI 맞춤 셋업</p><h2>{recommendationTitle}</h2><p>{recipient.recipientName} 수급자님의 입력 상태를 기준으로 우선 필요한 품목을 구성했습니다.</p></div>
              <div className="setup-actions"><button type="button" className="button primary" onClick={addWholeSet}>추천 세트 전체 담기</button><a className="button secondary" href="/consult/cart" onClick={persistDraft}>상담 장바구니 보기</a></div>
            </div>
            {cartMessage && <div className="consult-submit-message success">{cartMessage}</div>}
            <div className="setup-product-grid">
              {setProducts.map((product, index) => {
                const group = categoryGroups[index];
                return (
                  <article className="setup-product" key={product.benefitCode}>
                    <span className={`setup-priority ${index < 3 ? 'required' : 'recommended'}`}>{index < 3 ? '우선 추천' : '추가 권장'}</span>
                    {product.imageUrl && <a href={`/products/${product.slug}`}><img src={product.imageUrl} alt={`${product.title} 제품사진`} /></a>}
                    <div><span className="category-chip">{product.category}</span><h3><a href={`/products/${product.slug}`}>{product.title}</a></h3><p className="muted">{group?.reasons[0]}</p><strong>일반 15% {formatter.format(copay(product.benefitPrice, 0.15))}원{product.priceSuffix}</strong></div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="consult-results">
            <div className="consult-results-heading"><div><p className="eyebrow">4. 품목별 제품 선택</p><h2>추천 품목 안에서 제품을 비교하세요</h2><p>같은 품목 후보 2~3개를 비교함에 담아 규격과 가격을 나란히 볼 수 있습니다.</p></div><a className="button secondary" href="/compare">제품 비교함 열기</a></div>
            {categoryGroups.slice(0, 5).map((group) => (
              <section className="category-recommend-block" key={group.category}>
                <div className="category-recommend-heading"><div><h3>{group.products[0]?.category ?? group.category}</h3><p>{group.reasons.slice(0, 2).join(' ')}</p></div><span>{group.products.length}개 후보</span></div>
                <div className="consult-result-grid">
                  {group.products.map((candidate, index) => {
                    const c15 = copay(candidate.benefitPrice, 0.15);
                    const c9 = copay(candidate.benefitPrice, 0.09);
                    const c6 = copay(candidate.benefitPrice, 0.06);
                    const compareItem = {
                      slug: candidate.slug,
                      title: candidate.title,
                      model: candidate.model,
                      manufacturer: candidate.manufacturer,
                      benefitCode: candidate.benefitCode,
                      benefitPrice: candidate.benefitPrice,
                      category: candidate.category,
                      benefitMode: candidate.benefitMode,
                      priceSuffix: candidate.priceSuffix,
                      imageUrl: candidate.imageUrl,
                      dimensions: candidate.dimensions,
                      material: candidate.material,
                      weightKg: candidate.weightKg,
                    };
                    return (
                      <article className={`consult-product ${index === 0 ? 'best' : ''}`} key={candidate.benefitCode}>
                        <div className="consult-rank">{index === 0 ? 'BEST MATCH' : `${index + 1}순위`}</div>
                        {candidate.imageUrl && <a href={`/products/${candidate.slug}`}><img src={candidate.imageUrl} alt={`${candidate.title} 제품사진`} loading="lazy" /></a>}
                        <div className="consult-product-body">
                          <span className="category-chip">{candidate.category}</span>
                          <h3><a href={`/products/${candidate.slug}`}>{candidate.title}</a></h3>
                          <p>{candidate.manufacturer} · {candidate.model} · {candidate.benefitCode}</p>
                          <div className="consult-price-main"><span>일반 15%</span><strong>{formatter.format(c15)}원{candidate.priceSuffix}</strong></div>
                          <small>감경 9% {formatter.format(c9)}원{candidate.priceSuffix} · 감경 6% {formatter.format(c6)}원{candidate.priceSuffix}</small>
                          <div className="candidate-actions">
                            <AddToConsultCart item={{ slug: candidate.slug, title: candidate.title, manufacturer: candidate.manufacturer, benefitCode: candidate.benefitCode, benefitPrice: candidate.benefitPrice, category: candidate.category, benefitMode: candidate.benefitMode, priceSuffix: candidate.priceSuffix, imageUrl: candidate.imageUrl }} compact />
                            <AddToCompare item={compareItem} compact />
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      <div className="consult-card consult-disclaimer">
        <strong>중요 안내</strong>
        <p>이 기능은 수급자의 입력 상태와 사이트에 공개된 검증 제품 정보를 조합해 상담 우선순위를 제안합니다. 질병을 진단하거나 장기요양등급·급여 자격을 판정하지 않습니다. 설치형 안전손잡이, 경사로, 이동·목욕 보조용품은 실제 주거환경을 확인한 뒤 최종 선택해야 합니다.</p>
      </div>
    </section>
  );
}
