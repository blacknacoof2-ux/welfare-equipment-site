'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  CONSULT_CART_EVENT,
  CONSULT_NEEDS_KEY,
  readConsultCart,
  removeConsultCartItem,
  writeConsultCart,
  type ConsultCartItem,
} from '@/lib/consult-cart';

const formatter = new Intl.NumberFormat('ko-KR');
const CARE_GRADE_OPTIONS = [
  { value: '1', label: '1등급' },
  { value: '2', label: '2등급' },
  { value: '3', label: '3등급' },
  { value: '4', label: '4등급' },
  { value: '5', label: '5등급' },
  { value: 'COGNITIVE', label: '인지지원등급' },
  { value: 'UNKNOWN', label: '잘 모름' },
] as const;

function copay(price: number, rate: number) {
  return Math.floor((price * rate) / 10) * 10;
}

export default function ConsultCart() {
  const [items, setItems] = useState<ConsultCartItem[]>([]);
  const [needs, setNeeds] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [careNumber, setCareNumber] = useState('');
  const [validityStartDate, setValidityStartDate] = useState('');
  const [careGrade, setCareGrade] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [relation, setRelation] = useState('수급자 본인');
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [requestId, setRequestId] = useState('');

  useEffect(() => {
    const sync = () => {
      setItems(readConsultCart());
      try {
        const stored = JSON.parse(window.localStorage.getItem(CONSULT_NEEDS_KEY) ?? '{}');
        if (typeof stored.needs === 'string') setNeeds(stored.needs);
      } catch {}
    };
    sync();
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

  function clearSubmittedData() {
    setApplicantName('');
    setBeneficiaryName('');
    setBirthDate('');
    setCareNumber('');
    setValidityStartDate('');
    setCareGrade('');
    setPhone('');
    setAddress('');
    setAddressDetail('');
    setRelation('수급자 본인');
    setNeeds('');
    setFile(null);
    setConsent(false);
    window.localStorage.removeItem(CONSULT_NEEDS_KEY);
    writeConsultCart([]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (!items.length) {
      setStatus('error');
      setMessage('신청할 제품을 먼저 신청목록에 담아주세요.');
      return;
    }
    if (!consent) {
      setStatus('error');
      setMessage('개인정보 수집·이용 동의가 필요합니다.');
      return;
    }

    setStatus('sending');
    const formData = new FormData();
    formData.set('applicantName', applicantName);
    formData.set('beneficiaryName', beneficiaryName);
    formData.set('birthDate', birthDate);
    formData.set('careNumber', careNumber.replace(/\D/g, ''));
    formData.set('validityStartDate', validityStartDate);
    formData.set('careGrade', careGrade);
    formData.set('phone', phone);
    formData.set('address', address);
    formData.set('addressDetail', addressDetail);
    formData.set('relation', relation);
    formData.set('needs', needs);
    formData.set('items', JSON.stringify(items));
    if (file) formData.set('certificate', file);

    try {
      const response = await fetch('/api/consultations', { method: 'POST', body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || '신청을 전송하지 못했습니다.');
      setRequestId(data.requestId || '');
      clearSubmittedData();
      setStatus('success');
      setMessage('신청이 접수되었습니다. 담당자가 장기요양 수급자 자격 및 급여 가능 품목을 확인한 후 연락드리겠습니다.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : '신청을 전송하지 못했습니다.');
    }
  }

  if (status === 'success') {
    return (
      <section className="consult-shell">
        <div className="consult-hero compact">
          <div>
            <p className="eyebrow">신청 접수 완료</p>
            <h1>복지용구 신청이 접수되었습니다</h1>
            <p>담당자가 수급자 자격과 급여 가능 품목을 확인한 후 연락드립니다.</p>
          </div>
        </div>

        <div className="consult-card consult-submit-form beneficiary-verify-panel">
          <div className="consult-submit-message success">
            <strong>{message}</strong>
            {requestId && <><br /><small>접수번호 {requestId}</small></>}
          </div>
          <p className="consult-security-note">접수가 완료되어 이 화면에 입력했던 수급자·연락처·주소·첨부파일 정보와 신청목록을 즉시 비웠습니다. 접수번호만 확인해 주세요.</p>
          <div className="consult-actions">
            <Link className="button primary" href="/">홈으로</Link>
            <Link className="button" href="/products">제품 더 보기</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="consult-shell">
      <div className="consult-hero compact">
        <div>
          <p className="eyebrow">복지용구 신청목록</p>
          <h1>신청 정보를 입력하고 먼저 접수하세요</h1>
          <p>신청 접수 후 아톰케어 담당자가 수급자 자격·본인부담률·급여 가능품목과 남은 수량을 확인해 연락드립니다.</p>
        </div>
      </div>

      <div className="consult-cart-layout">
        <div>
          <div className="consult-cart-list">
            {items.length === 0 ? (
              <div className="consult-card consult-empty">
                <h2>신청목록이 비어 있습니다</h2>
                <p>필요한 복지용구를 찾아 신청목록에 담아주세요.</p>
                <Link className="button primary" href="/products">제품 찾기</Link>
              </div>
            ) : items.map((item) => (
              <article className="consult-cart-item" key={item.benefitCode}>
                {item.imageUrl && <Link href={`/products/${item.slug}`}><img src={item.imageUrl} alt={`${item.title} 제품사진`} /></Link>}
                <div className="consult-cart-item-body">
                  <span className="category-chip">{item.category}</span>
                  <h2><Link href={`/products/${item.slug}`}>{item.title}</Link></h2>
                  <p>{item.manufacturer} · 급여코드 {item.benefitCode}</p>
                  <div className="consult-cart-prices">
                    <strong>일반 15% {formatter.format(copay(item.benefitPrice, 0.15))}원{item.priceSuffix}</strong>
                    <span>감경 9% {formatter.format(copay(item.benefitPrice, 0.09))}원{item.priceSuffix}</span>
                    <span>감경 6% {formatter.format(copay(item.benefitPrice, 0.06))}원{item.priceSuffix}</span>
                  </div>
                  <div className="consult-eligibility-badge waiting">
                    <strong>접수 후 자격 확인</strong>
                    <span>담당자가 수급자 시스템에서 실제 급여자격과 남은 수량을 확인합니다.</span>
                  </div>
                  <button type="button" className="text-button" onClick={() => removeConsultCartItem(item.benefitCode)}>삭제</button>
                </div>
              </article>
            ))}
          </div>

          {items.length > 0 && (
            <div className="consult-card consult-total">
              <span>신청 제품 {items.length}개</span>
              <strong>일반 15% {formatter.format(totals.c15)}원</strong>
              <small>감경 9% {formatter.format(totals.c9)}원 · 감경 6% {formatter.format(totals.c6)}원</small>
              <p>※ 표시 금액은 참고용이며, 최종 본인부담률과 급여 적용 여부는 접수 후 담당자가 확인합니다.</p>
            </div>
          )}
        </div>

        <div className="consult-card consult-submit-form beneficiary-verify-panel">
          <form className="beneficiary-final-form" onSubmit={submit} autoComplete="on">
            <div className="consult-step-section active">
              <div className="consult-step-heading">
                <span className="consult-step-number">1</span>
                <div>
                  <p className="eyebrow">신청 정보</p>
                  <h2>수급자 · 신청자 정보</h2>
                  <p className="muted">자격조회는 접수 후 담당자가 진행합니다. 조회 비밀번호는 입력하지 않습니다.</p>
                </div>
              </div>

              <label><span>수급자 이름</span><input required value={beneficiaryName} onChange={(event) => setBeneficiaryName(event.target.value)} autoComplete="off" /></label>
              <label><span>수급자 생년월일</span><input required type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} /></label>
              <label>
                <span>장기요양인정번호</span>
                <input
                  required
                  value={careNumber}
                  onChange={(event) => setCareNumber(event.target.value.replace(/\D/g, '').slice(0, 10))}
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  autoComplete="off"
                  placeholder="숫자 10자리"
                />
              </label>
              <label><span>유효기간 시작일</span><input required type="date" value={validityStartDate} onChange={(event) => setValidityStartDate(event.target.value)} /></label>
              <label>
                <span>장기요양 등급</span>
                <select required value={careGrade} onChange={(event) => setCareGrade(event.target.value)}>
                  <option value="">등급을 선택해 주세요</option>
                  {CARE_GRADE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label><span>신청자 이름 <small>(연락받을 분)</small></span><input required value={applicantName} onChange={(event) => setApplicantName(event.target.value)} autoComplete="name" /></label>
              <label><span>수급자와의 관계</span><select value={relation} onChange={(event) => setRelation(event.target.value)}><option>수급자 본인</option><option>배우자</option><option>자녀</option><option>보호자·기타 가족</option><option>기타</option></select></label>
            </div>

            <div className="consult-step-section active">
              <div className="consult-step-heading compact">
                <span className="consult-step-number">2</span>
                <div>
                  <h3>연락처 · 주소 및 신청</h3>
                  <p>상담과 배송에 필요한 정보를 입력해 주세요.</p>
                </div>
              </div>

              <label><span>휴대폰 번호</span><input required value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" pattern="01[016789]-?[0-9]{3,4}-?[0-9]{4}" placeholder="010-0000-0000" /></label>
              <label><span>주소</span><input required value={address} onChange={(event) => setAddress(event.target.value)} autoComplete="street-address" placeholder="예: 경기도 고양시 일산서구 ..." /></label>
              <label><span>상세주소</span><input value={addressDetail} onChange={(event) => setAddressDetail(event.target.value)} placeholder="동·호수, 건물명 등" /></label>
              <label><span>요청사항</span><textarea rows={4} value={needs} onChange={(event) => setNeeds(event.target.value)} placeholder="예: 방문 상담 희망시간, 배송 관련 요청사항" /></label>
              <label className="consult-file-field">
                <span>장기요양인정서 <b className="optional">선택</b></span>
                <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
                <small>선택사항입니다. 필요하면 JPG·PNG·WEBP·PDF, 최대 10MB로 첨부할 수 있습니다.</small>
              </label>
              <label className="consult-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>복지용구 신청 확인을 위한 수급자 정보·연락처·주소 및 제출서류의 수집·이용에 동의합니다.</span></label>

              <button className="button primary consult-submit-button" type="submit" disabled={status === 'sending' || items.length === 0}>
                {status === 'sending' ? '안전하게 접수 중…' : '복지용구 신청하기'}
              </button>

              {message && <div className={`consult-submit-message ${status}`}>{message}{requestId && <><br /><small>접수번호 {requestId}</small></>}</div>}
              <p className="consult-security-note">신청 단계에서는 자격검증을 하지 않습니다. 접수 후 관리자가 별도 수급자 시스템에서 확인한 결과를 접수건에 반영합니다.</p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
