'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  CONSULT_CART_EVENT,
  CONSULT_NEEDS_KEY,
  readConsultCart,
  removeConsultCartItem,
  type ConsultCartItem,
} from '@/lib/consult-cart';

const formatter = new Intl.NumberFormat('ko-KR');

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
    const sync = () => setItems(readConsultCart());
    sync();
    try {
      const stored = JSON.parse(window.localStorage.getItem(CONSULT_NEEDS_KEY) ?? '{}');
      if (typeof stored.needs === 'string') setNeeds(stored.needs);
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
      setMessage('신청할 제품을 먼저 신청목록에 담아주세요.');
      return;
    }
    if (!file) {
      setStatus('error');
      setMessage('수급자 정보 대조를 위해 장기요양인정서 사진 또는 PDF를 첨부해 주세요.');
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
    formData.set('careNumber', careNumber);
    formData.set('phone', phone);
    formData.set('address', address);
    formData.set('addressDetail', addressDetail);
    formData.set('relation', relation);
    formData.set('needs', needs);
    formData.set('items', JSON.stringify(items));
    formData.set('certificate', file);

    try {
      const response = await fetch('/api/consultations', { method: 'POST', body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || '신청을 전송하지 못했습니다.');
      setRequestId(data.requestId || '');
      setStatus('success');
      setMessage('접수가 완료되었습니다. 아톰케어에서 수급자 정보와 장기요양인정서를 확인한 뒤 연락드리겠습니다.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : '신청을 전송하지 못했습니다.');
    }
  }

  return (
    <section className="consult-shell">
      <div className="consult-hero compact">
        <div>
          <p className="eyebrow">복지용구 신청목록</p>
          <h1>필요한 제품을 담고 한 번에 신청하세요</h1>
          <p>제품을 선택한 뒤 수급자 정보와 장기요양인정서를 보내주시면 아톰케어에서 확인 후 연락드립니다.</p>
        </div>
      </div>

      <div className="consult-cart-layout">
        <div>
          <div className="consult-cart-list">
            {items.length === 0 ? (
              <div className="consult-card consult-empty">
                <h2>신청목록이 비어 있습니다</h2>
                <p>필요한 복지용구를 찾아 신청목록에 담아주세요.</p>
                <a className="button primary" href="/products">제품 찾기</a>
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
              <span>신청 제품 {items.length}개 · 단순 합산 참고금액</span>
              <strong>일반 15% {formatter.format(totals.c15)}원</strong>
              <small>감경 9% {formatter.format(totals.c9)}원 · 감경 6% {formatter.format(totals.c6)}원</small>
              <p>※ 실제 급여 가능 여부와 본인부담률은 아톰케어에서 별도로 확인합니다.</p>
            </div>
          )}
        </div>

        <form className="consult-card consult-submit-form" onSubmit={submit}>
          <div>
            <p className="eyebrow">수급자 신청</p>
            <h2>수급자 정보와 인정서 보내기</h2>
            <p className="muted">입력정보가 잘못될 수 있으므로 장기요양인정서를 반드시 함께 받습니다. 이후 공단 조회와 급여 확인은 아톰케어에서 별도로 진행합니다.</p>
          </div>

          <label><span>수급자 성명</span><input required value={beneficiaryName} onChange={(event) => setBeneficiaryName(event.target.value)} autoComplete="off" /></label>
          <label><span>수급자 생년월일</span><input required type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} /></label>
          <label><span>장기요양인정번호</span><input required value={careNumber} onChange={(event) => setCareNumber(event.target.value)} autoCapitalize="characters" autoComplete="off" placeholder="인정서에 표시된 번호를 입력해 주세요" /></label>
          <label><span>신청자 이름 <small>(연락받을 분)</small></span><input required value={applicantName} onChange={(event) => setApplicantName(event.target.value)} autoComplete="name" /></label>
          <label><span>휴대폰 번호</span><input required value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" pattern="01[016789]-?[0-9]{3,4}-?[0-9]{4}" placeholder="010-0000-0000" /></label>
          <label><span>수급자와의 관계</span><select value={relation} onChange={(event) => setRelation(event.target.value)}><option>수급자 본인</option><option>배우자</option><option>자녀</option><option>보호자·기타 가족</option><option>기타</option></select></label>
          <label><span>주소</span><input required value={address} onChange={(event) => setAddress(event.target.value)} autoComplete="street-address" placeholder="예: 경기도 고양시 일산서구 ..." /></label>
          <label><span>상세주소</span><input value={addressDetail} onChange={(event) => setAddressDetail(event.target.value)} placeholder="동·호수, 건물명 등" /></label>
          <label><span>요청사항</span><textarea rows={4} value={needs} onChange={(event) => setNeeds(event.target.value)} placeholder="예: 목욕의자와 보행기를 같이 신청하고 싶습니다." /></label>
          <label className="consult-file-field">
            <span>장기요양인정서 <b>필수</b></span>
            <input type="file" required accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            <small>JPG·PNG·WEBP·PDF, 최대 10MB. 입력한 수급자 정보와 인정서 내용을 아톰케어 담당자가 대조합니다.</small>
          </label>
          <label className="consult-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>복지용구 신청 확인을 위한 수급자 성명·생년월일·장기요양인정번호·연락처·주소 및 제출서류의 수집·이용에 동의합니다.</span></label>

          <button className="button primary consult-submit-button" type="submit" disabled={status === 'sending' || !items.length}>{status === 'sending' ? '안전하게 접수 중…' : '수급자 정보·인정서 제출하기'}</button>

          {message && <div className={`consult-submit-message ${status}`}>{message}{requestId && <><br /><small>접수번호 {requestId}</small></>}</div>}
          <p className="consult-security-note">수급자 개인정보와 인정서 파일은 브라우저 장바구니나 GitHub에 저장하지 않습니다. 운영 서버에 연결된 비공개 접수 저장소로만 전송합니다.</p>
        </form>
      </div>
    </section>
  );
}
