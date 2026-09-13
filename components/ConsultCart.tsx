'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  CONSULT_CART_EVENT,
  CONSULT_NEEDS_KEY,
  readConsultationDraft,
  readConsultCart,
  removeConsultCartItem,
  type ConsultationDraft,
  type ConsultCartItem,
} from '@/lib/consult-cart';

const formatter = new Intl.NumberFormat('ko-KR');

function copay(price: number, rate: number) {
  return Math.floor((price * rate) / 10) * 10;
}

export default function ConsultCart() {
  const [items, setItems] = useState<ConsultCartItem[]>([]);
  const [draft, setDraft] = useState<ConsultationDraft | null>(null);
  const [needs, setNeeds] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('수급자 본인');
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [requestId, setRequestId] = useState('');

  useEffect(() => {
    const sync = () => setItems(readConsultCart());
    sync();
    const consultationDraft = readConsultationDraft();
    setDraft(consultationDraft);
    if (consultationDraft?.needs) setNeeds(consultationDraft.needs);
    if (consultationDraft?.recipient.recipientName) setName(consultationDraft.recipient.recipientName);
    try {
      const stored = JSON.parse(window.localStorage.getItem(CONSULT_NEEDS_KEY) ?? '{}');
      if (!consultationDraft?.needs && typeof stored.needs === 'string') setNeeds(stored.needs);
    } catch {}
    window.addEventListener(CONSULT_CART_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CONSULT_CART_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const totals = useMemo(() => items.reduce((acc, item) => {
    acc.c15 += copay(item.benefitPrice, 0.15);
    acc.c9 += copay(item.benefitPrice, 0.09);
    acc.c6 += copay(item.benefitPrice, 0.06);
    return acc;
  }, { c15: 0, c9: 0, c6: 0 }), [items]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    if (!items.length) {
      setStatus('error');
      setMessage('상담할 제품을 먼저 장바구니에 담아주세요.');
      return;
    }
    if (!draft?.recipient) {
      setStatus('error');
      setMessage('수급자 기본정보를 먼저 입력해 주세요. 맞춤 추천 화면에서 입력한 뒤 다시 진행할 수 있습니다.');
      return;
    }
    if (!file) {
      setStatus('error');
      setMessage('등급·급여 확인을 위해 장기요양인정서 사진 또는 PDF를 첨부해 주세요.');
      return;
    }
    if (!consent) {
      setStatus('error');
      setMessage('개인정보 수집·이용 동의가 필요합니다.');
      return;
    }

    setStatus('sending');
    const formData = new FormData();
    formData.set('name', name);
    formData.set('phone', phone);
    formData.set('relation', relation);
    formData.set('needs', needs);
    formData.set('items', JSON.stringify(items));
    formData.set('recipientData', JSON.stringify(draft.recipient));
    formData.set('conditionData', JSON.stringify(draft.conditions));
    formData.set('recommendationData', JSON.stringify({
      recommendedSetTitle: draft.recommendedSetTitle ?? '',
      recommendedCategories: draft.recommendedCategories ?? [],
    }));
    formData.set('certificate', file);

    try {
      const response = await fetch('/api/consultations', { method: 'POST', body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || '상담 요청을 전송하지 못했습니다.');
      setRequestId(data.requestId || '');
      setStatus('success');
      setMessage('상담 요청이 접수되었습니다. 아톰케어 담당자가 수급자 정보와 인정서를 확인한 뒤 실제 적용 본인부담금과 가능한 제품을 안내합니다.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : '상담 요청을 전송하지 못했습니다.');
    }
  }

  return (
    <section className="consult-shell">
      <div className="consult-hero compact">
        <div>
          <p className="eyebrow">상담 장바구니</p>
          <h1>AI 추천 세트를 실제 계약 상담으로 연결합니다</h1>
          <p>표시 금액은 우선 일반 15% 기준입니다. 실제 등급·감경 여부·급여 가능 여부는 수급자 정보와 장기요양인정서 확인 후 확정합니다.</p>
        </div>
      </div>

      {draft?.recipient ? (
        <div className="consult-card recipient-summary-card">
          <div className="consult-section-title"><div><p className="eyebrow">수급자 정보</p><h2>{draft.recipient.recipientName} 수급자</h2></div><a className="button secondary" href="/consult">정보·상태 수정</a></div>
          <div className="recipient-summary-grid">
            <span><small>장기요양인정번호</small><strong>L{draft.recipient.recognitionNumber}</strong></span>
            <span><small>생년월일</small><strong>{draft.recipient.birthDate}</strong></span>
            <span><small>장기요양인정등급</small><strong>{draft.recipient.careGrade}</strong></span>
            <span><small>유효기간 시작일</small><strong>{draft.recipient.validityStartDate}</strong></span>
            {draft.recommendedSetTitle && <span><small>AI 추천 셋업</small><strong>{draft.recommendedSetTitle}</strong></span>}
          </div>
        </div>
      ) : (
        <div className="consult-card consult-submit-message error">수급자 정보가 없습니다. <a href="/consult"><strong>맞춤 추천에서 수급자 정보를 먼저 입력해 주세요.</strong></a></div>
      )}

      <div className="consult-cart-layout">
        <div>
          <div className="consult-cart-list">
            {items.length === 0 ? (
              <div className="consult-card consult-empty">
                <h2>상담 장바구니가 비어 있습니다</h2>
                <p>맞춤 추천을 받아 필요한 제품을 세트로 담아주세요.</p>
                <a className="button primary" href="/consult">AI 맞춤 추천 시작하기</a>
              </div>
            ) : items.map((item) => (
              <article className="consult-cart-item" key={item.benefitCode}>
                {item.imageUrl && <a href={`/products/${item.slug}`}><img src={item.imageUrl} alt={`${item.title} 제품사진`} /></a>}
                <div className="consult-cart-item-body">
                  <span className="category-chip">{item.category}</span>
                  <h2><a href={`/products/${item.slug}`}>{item.title}</a></h2>
                  <p>{item.manufacturer} · 급여코드 {item.benefitCode}</p>
                  <div className="consult-cart-prices">
                    <strong>일반 15% {formatter.format(copay(item.benefitPrice, 0.15))}원{item.priceSuffix}</strong>
                    <span>감경 9% {formatter.format(copay(item.benefitPrice, 0.09))}원{item.priceSuffix}</span>
                    <span>감경 6% {formatter.format(copay(item.benefitPrice, 0.06))}원{item.priceSuffix}</span>
                  </div>
                  <button type="button" className="text-button" onClick={() => removeConsultCartItem(item.benefitCode)}>삭제</button>
                </div>
              </article>
            ))}
          </div>

          {items.length > 0 && (
            <div className="consult-card consult-total">
              <span>선택 제품 {items.length}개 · 단순 합산 참고금액</span>
              <strong>일반 15% {formatter.format(totals.c15)}원</strong>
              <small>감경 9% {formatter.format(totals.c9)}원 · 감경 6% {formatter.format(totals.c6)}원</small>
              <p>※ 품목별 급여한도·구입 가능 여부·대여 여부에 따라 실제 적용금액은 달라질 수 있습니다.</p>
            </div>
          )}
        </div>

        <form className="consult-card consult-submit-form" onSubmit={submit}>
          <div>
            <p className="eyebrow">등급·급여 확인 요청</p>
            <h2>장기요양인정서 보내기</h2>
            <p className="muted">담당자가 직접 확인합니다. AI가 장기요양등급이나 급여 가능 여부를 판정하지 않습니다.</p>
          </div>

          <label><span>신청자 이름</span><input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></label>
          <label><span>연락처</span><input required value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" placeholder="010-0000-0000" /></label>
          <label><span>수급자와의 관계</span><select value={relation} onChange={(event) => setRelation(event.target.value)}><option>수급자 본인</option><option>배우자</option><option>자녀</option><option>보호자·기타 가족</option><option>기타</option></select></label>
          <label><span>추가 상담 내용</span><textarea rows={4} value={needs} onChange={(event) => setNeeds(event.target.value)} placeholder="예: 화장실 안전손잡이는 설치 위치도 같이 방문 상담받고 싶습니다." /></label>
          <label className="consult-file-field">
            <span>장기요양인정서 <b>필수</b></span>
            <input type="file" required accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            <small>JPG·PNG·WEBP·PDF, 최대 10MB. 주민등록번호 등 상담에 불필요한 정보는 가능하면 가린 뒤 제출해도 됩니다.</small>
          </label>
          <label className="consult-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>수급자 기본정보, 상태정보, 상담내용 및 제출서류를 복지용구 추천·급여 확인·계약 상담 목적으로 수집·이용하는 데 동의합니다.</span></label>

          <button className="button primary consult-submit-button" type="submit" disabled={status === 'sending' || !items.length || !draft}>{status === 'sending' ? '안전하게 전송 중…' : '수급자 정보와 인정서 보내기'}</button>

          {message && <div className={`consult-submit-message ${status}`}>{message}{requestId && <><br /><small>접수번호 {requestId}</small></>}</div>}
          <p className="consult-security-note">인정서 파일은 브라우저 장바구니에 저장하지 않습니다. 운영 서버의 보안 전송 대상이 설정된 경우에만 서버를 통해 전달됩니다.</p>
        </form>
      </div>
    </section>
  );
}
