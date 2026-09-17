'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  CONSULT_CART_EVENT,
  CONSULT_NEEDS_KEY,
  readConsultCart,
  removeConsultCartItem,
  type ConsultCartItem,
} from '@/lib/consult-cart';

const formatter = new Intl.NumberFormat('ko-KR');

type VerificationStatus = 'idle' | 'checking' | 'verified' | 'pending' | 'rejected' | 'error';

type EligibleItem = {
  itemCode: string;
  itemName: string;
  benefitType: 'purchase' | 'rental';
  unit: string;
  limitQuantity: number;
  limitYears: number | null;
  contractedQuantity: number;
  availableQuantity: number;
};

type VerificationResult = {
  ok: boolean;
  status?: 'verified' | 'pending' | 'rejected';
  code?: string;
  message: string;
  beneficiary?: {
    name: string;
    recognitionNumber: string;
    careGrade?: string | null;
    validFrom: string;
    validTo?: string | null;
    copayRate?: number | null;
    copayType?: string | null;
  };
  eligibleItems?: EligibleItem[];
};

type CartAssessment = {
  product: ConsultCartItem;
  eligibleItem: EligibleItem | null;
  requestedInSameBenefitItem: number;
  allowed: boolean;
  message: string;
};

function copay(price: number, rate: number) {
  return Math.floor((price * rate) / 10) * 10;
}

function benefitModeMatches(product: ConsultCartItem, eligibleItem: EligibleItem) {
  if (product.benefitMode === 'PURCHASE') return eligibleItem.benefitType === 'purchase';
  if (product.benefitMode === 'RENTAL') return eligibleItem.benefitType === 'rental';
  return true;
}

function matchEligibleItem(product: ConsultCartItem, eligibleItems: EligibleItem[]) {
  const candidates = eligibleItems
    .filter((item) => item.itemName === product.category && benefitModeMatches(product, item))
    .sort((a, b) => b.availableQuantity - a.availableQuantity);
  return candidates[0] ?? null;
}

export default function ConsultCart() {
  const [items, setItems] = useState<ConsultCartItem[]>([]);
  const [needs, setNeeds] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [careNumber, setCareNumber] = useState('');
  const [validityStartDate, setValidityStartDate] = useState('');
  const [lookupPin, setLookupPin] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [relation, setRelation] = useState('수급자 본인');
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [requestId, setRequestId] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

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

  const verifiedCopayRate = verificationStatus === 'verified'
    ? verificationResult?.beneficiary?.copayRate ?? null
    : null;

  const verifiedTotal = useMemo(() => {
    if (verifiedCopayRate == null) return null;
    return items.reduce((sum, item) => sum + copay(item.benefitPrice, verifiedCopayRate / 100), 0);
  }, [items, verifiedCopayRate]);

  const cartAssessments = useMemo<CartAssessment[]>(() => {
    if (verificationStatus !== 'verified') return [];
    const eligibleItems = verificationResult?.eligibleItems ?? [];
    const matches = items.map((product) => ({
      product,
      eligibleItem: matchEligibleItem(product, eligibleItems),
    }));
    const counts = new Map<string, number>();
    for (const match of matches) {
      if (!match.eligibleItem) continue;
      counts.set(match.eligibleItem.itemCode, (counts.get(match.eligibleItem.itemCode) ?? 0) + 1);
    }

    return matches.map(({ product, eligibleItem }) => {
      if (!eligibleItem) {
        return {
          product,
          eligibleItem: null,
          requestedInSameBenefitItem: 0,
          allowed: false,
          message: '현재 확인된 급여 가능품목에 포함되지 않습니다.',
        };
      }
      const requested = counts.get(eligibleItem.itemCode) ?? 1;
      const allowed = requested <= eligibleItem.availableQuantity;
      return {
        product,
        eligibleItem,
        requestedInSameBenefitItem: requested,
        allowed,
        message: allowed
          ? `${eligibleItem.itemName} ${eligibleItem.availableQuantity}${eligibleItem.unit} 가능`
          : `${eligibleItem.itemName} 남은 ${eligibleItem.availableQuantity}${eligibleItem.unit}보다 신청 제품 수가 많습니다.`,
      };
    });
  }, [items, verificationResult, verificationStatus]);

  const assessmentByCode = useMemo(
    () => new Map(cartAssessments.map((assessment) => [assessment.product.benefitCode, assessment])),
    [cartAssessments],
  );

  const allCartEligible = verificationStatus === 'verified'
    && items.length > 0
    && cartAssessments.length === items.length
    && cartAssessments.every((assessment) => assessment.allowed);

  function resetVerification() {
    if (verificationStatus === 'idle') return;
    setVerificationStatus('idle');
    setVerificationMessage('수급자 정보가 변경되었습니다. 자격을 다시 확인해 주세요.');
    setVerificationResult(null);
    setBeneficiaryName('');
  }

  async function verifyBeneficiary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVerificationStatus('checking');
    setVerificationMessage('장기요양 급여자격을 확인하고 있습니다.');
    setVerificationResult(null);
    setBeneficiaryName('');

    try {
      const response = await fetch('/api/beneficiary/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          recognitionNumber: careNumber,
          birthDate,
          validFrom: validityStartDate,
          pin: lookupPin,
        }),
      });
      const data = await response.json().catch(() => null) as VerificationResult | null;
      if (!data) throw new Error('자격 확인 결과를 불러오지 못했습니다.');

      setVerificationResult(data);
      setVerificationMessage(data.message || '자격 확인 결과를 확인해 주세요.');

      if (!response.ok || !data.ok) {
        setVerificationStatus('error');
        return;
      }

      if (data.beneficiary?.name) setBeneficiaryName(data.beneficiary.name);
      if (data.status === 'verified') setVerificationStatus('verified');
      else if (data.status === 'pending') setVerificationStatus('pending');
      else if (data.status === 'rejected') setVerificationStatus('rejected');
      else setVerificationStatus('error');
    } catch (error) {
      setVerificationStatus('error');
      setVerificationMessage(error instanceof Error ? error.message : '자격 확인 중 오류가 발생했습니다.');
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    if (!items.length) {
      setStatus('error');
      setMessage('신청할 제품을 먼저 신청목록에 담아주세요.');
      return;
    }
    if (verificationStatus !== 'verified' || !verificationResult?.beneficiary) {
      setStatus('error');
      setMessage('수급자 급여자격을 먼저 확인해 주세요.');
      return;
    }
    if (!allCartEligible) {
      setStatus('error');
      setMessage('급여 가능품목 또는 남은 수량을 초과한 제품이 있습니다. 신청목록을 확인해 주세요.');
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
      setStatus('success');
      setMessage('접수가 완료되었습니다. 담당자가 신청제품과 급여정보를 최종 확인한 뒤 연락드리겠습니다.');
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
          <h1>제품을 담고 수급자 자격을 확인해 신청하세요</h1>
          <p>왼쪽에서 신청제품을 확인하고, 오른쪽에서 장기요양 급여자격과 남은 수량을 검증한 뒤 최종 접수합니다.</p>
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
            ) : items.map((item) => {
              const assessment = assessmentByCode.get(item.benefitCode);
              return (
                <article className="consult-cart-item" key={item.benefitCode}>
                  {item.imageUrl && <Link href={`/products/${item.slug}`}><img src={item.imageUrl} alt={`${item.title} 제품사진`} /></Link>}
                  <div className="consult-cart-item-body">
                    <span className="category-chip">{item.category}</span>
                    <h2><Link href={`/products/${item.slug}`}>{item.title}</Link></h2>
                    <p>{item.manufacturer} · 급여코드 {item.benefitCode}</p>
                    <div className="consult-cart-prices">
                      {verifiedCopayRate != null ? (
                        <strong>확인 본인부담 {verifiedCopayRate}% · {formatter.format(copay(item.benefitPrice, verifiedCopayRate / 100))}원{item.priceSuffix}</strong>
                      ) : (
                        <>
                          <strong>일반 15% {formatter.format(copay(item.benefitPrice, 0.15))}원{item.priceSuffix}</strong>
                          <span>감경 9% {formatter.format(copay(item.benefitPrice, 0.09))}원{item.priceSuffix}</span>
                          <span>감경 6% {formatter.format(copay(item.benefitPrice, 0.06))}원{item.priceSuffix}</span>
                        </>
                      )}
                    </div>

                    {verificationStatus === 'verified' ? (
                      <div className={`consult-eligibility-badge ${assessment?.allowed ? 'allowed' : 'blocked'}`}>
                        <strong>{assessment?.allowed ? '✓ 급여 신청 가능' : '⚠ 급여 신청 확인 필요'}</strong>
                        <span>{assessment?.message ?? '가능품목을 확인하지 못했습니다.'}</span>
                        {assessment?.eligibleItem ? (
                          <small>
                            사용한도 {assessment.eligibleItem.limitQuantity}{assessment.eligibleItem.unit}
                            {assessment.eligibleItem.limitYears ? `/${assessment.eligibleItem.limitYears}년` : ''}
                            {' · '}계약완료 {assessment.eligibleItem.contractedQuantity}{assessment.eligibleItem.unit}
                            {' · '}남은수량 {assessment.eligibleItem.availableQuantity}{assessment.eligibleItem.unit}
                          </small>
                        ) : null}
                      </div>
                    ) : (
                      <div className="consult-eligibility-badge waiting">
                        <strong>자격 확인 전</strong>
                        <span>오른쪽에서 수급자 급여자격을 먼저 확인해 주세요.</span>
                      </div>
                    )}

                    <button type="button" className="text-button" onClick={() => removeConsultCartItem(item.benefitCode)}>삭제</button>
                  </div>
                </article>
              );
            })}
          </div>

          {items.length > 0 && (
            <div className="consult-card consult-total">
              <span>신청 제품 {items.length}개</span>
              {verifiedTotal != null && verifiedCopayRate != null ? (
                <>
                  <strong>확인 본인부담률 {verifiedCopayRate}% · 예상 {formatter.format(verifiedTotal)}원</strong>
                  <small>관리자가 확인한 본인부담률을 현재 신청목록에 적용한 참고금액입니다.</small>
                </>
              ) : (
                <>
                  <strong>일반 15% {formatter.format(totals.c15)}원</strong>
                  <small>감경 9% {formatter.format(totals.c9)}원 · 감경 6% {formatter.format(totals.c6)}원</small>
                </>
              )}
              <p>※ 최종 급여 적용 및 계약 가능 여부는 접수 후 담당자가 다시 확인합니다.</p>
            </div>
          )}
        </div>

        <div className="consult-card consult-submit-form beneficiary-verify-panel">
          <div className="consult-step-heading">
            <span className="consult-step-number">1</span>
            <div>
              <p className="eyebrow">수급자 자격 확인</p>
              <h2>장기요양 급여정보 확인</h2>
              <p className="muted">등록된 수급자의 인정정보와 조회 비밀번호로 등급·본인부담률·가능품목을 확인합니다.</p>
            </div>
          </div>

          <form className="beneficiary-verify-form" onSubmit={verifyBeneficiary} autoComplete="off">
            <label>
              <span>장기요양인정번호</span>
              <input
                required
                value={careNumber}
                onChange={(event) => { setCareNumber(event.target.value.replace(/\D/g, '').slice(0, 10)); resetVerification(); }}
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                autoComplete="off"
                placeholder="숫자 10자리"
              />
            </label>
            <label>
              <span>수급자 생년월일</span>
              <input required type="date" value={birthDate} onChange={(event) => { setBirthDate(event.target.value); resetVerification(); }} />
            </label>
            <label>
              <span>유효기간 시작일</span>
              <input required type="date" value={validityStartDate} onChange={(event) => { setValidityStartDate(event.target.value); resetVerification(); }} />
            </label>
            <label>
              <span>조회 비밀번호 <small>(숫자 6자리)</small></span>
              <input
                required
                type="password"
                value={lookupPin}
                onChange={(event) => { setLookupPin(event.target.value.replace(/\D/g, '').slice(0, 6)); resetVerification(); }}
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoComplete="off"
                placeholder="숫자 6자리"
              />
            </label>
            <button className="button primary beneficiary-verify-button" type="submit" disabled={verificationStatus === 'checking'}>
              {verificationStatus === 'checking' ? '자격 확인 중…' : '급여자격 확인'}
            </button>
          </form>

          {verificationMessage ? (
            <div className={`beneficiary-verification-message ${verificationStatus}`}>
              {verificationMessage}
            </div>
          ) : null}

          <div className={`consult-step-section ${verificationStatus === 'verified' ? 'active' : ''}`}>
            <div className="consult-step-heading compact">
              <span className="consult-step-number">2</span>
              <div>
                <h3>자격 검증 결과</h3>
                <p>등급·본인부담률과 현재 남은 급여품목을 확인합니다.</p>
              </div>
            </div>

            {verificationStatus === 'verified' && verificationResult?.beneficiary ? (
              <div className="beneficiary-result-card">
                <div className="beneficiary-result-top">
                  <div>
                    <strong>{verificationResult.beneficiary.name}</strong>
                    <span>{verificationResult.beneficiary.careGrade ? `${verificationResult.beneficiary.careGrade}등급` : '등급 확인완료'}</span>
                  </div>
                  <b>확인완료</b>
                </div>
                <dl>
                  <div><dt>본인부담률</dt><dd>{verificationResult.beneficiary.copayRate != null ? `${verificationResult.beneficiary.copayRate}%` : '-'}</dd></div>
                  <div><dt>유효기간</dt><dd>{verificationResult.beneficiary.validFrom} ~ {verificationResult.beneficiary.validTo ?? '-'}</dd></div>
                </dl>
                <div className="beneficiary-eligible-list">
                  {(verificationResult.eligibleItems ?? []).length ? (verificationResult.eligibleItems ?? []).map((item) => (
                    <div key={item.itemCode}>
                      <span>{item.itemName}</span>
                      <strong>{item.availableQuantity}{item.unit} 가능</strong>
                    </div>
                  )) : <p>현재 표시할 수 있는 급여 가능품목이 없습니다.</p>}
                </div>
                <div className={`beneficiary-cart-check ${allCartEligible ? 'allowed' : 'blocked'}`}>
                  {allCartEligible
                    ? '✓ 현재 신청목록의 모든 제품이 확인된 급여 가능범위 안에 있습니다.'
                    : '⚠ 신청목록에 급여 가능품목이 아니거나 남은 수량을 초과한 제품이 있습니다.'}
                </div>
              </div>
            ) : verificationStatus === 'pending' ? (
              <div className="beneficiary-result-placeholder pending">담당자가 수급자 정보를 확인 중입니다. 확인완료 후 급여 신청을 진행할 수 있습니다.</div>
            ) : verificationStatus === 'rejected' ? (
              <div className="beneficiary-result-placeholder blocked">수급자 정보 재확인이 필요합니다. 담당자에게 문의해 주세요.</div>
            ) : (
              <div className="beneficiary-result-placeholder">1단계에서 수급자 급여자격을 확인하면 결과가 표시됩니다.</div>
            )}
          </div>

          <div className={`consult-step-section ${verificationStatus === 'verified' ? 'active' : ''}`}>
            <div className="consult-step-heading compact">
              <span className="consult-step-number">3</span>
              <div>
                <h3>배송·연락정보 및 최종 신청</h3>
                <p>자격 확인 후 실제 상담과 배송에 필요한 정보만 입력합니다.</p>
              </div>
            </div>

            <form className="beneficiary-final-form" onSubmit={submit}>
              <label><span>신청자 이름 <small>(연락받을 분)</small></span><input required disabled={verificationStatus !== 'verified'} value={applicantName} onChange={(event) => setApplicantName(event.target.value)} autoComplete="name" /></label>
              <label><span>휴대폰 번호</span><input required disabled={verificationStatus !== 'verified'} value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" pattern="01[016789]-?[0-9]{3,4}-?[0-9]{4}" placeholder="010-0000-0000" /></label>
              <label><span>수급자와의 관계</span><select disabled={verificationStatus !== 'verified'} value={relation} onChange={(event) => setRelation(event.target.value)}><option>수급자 본인</option><option>배우자</option><option>자녀</option><option>보호자·기타 가족</option><option>기타</option></select></label>
              <label><span>주소</span><input required disabled={verificationStatus !== 'verified'} value={address} onChange={(event) => setAddress(event.target.value)} autoComplete="street-address" placeholder="예: 경기도 고양시 일산서구 ..." /></label>
              <label><span>상세주소</span><input disabled={verificationStatus !== 'verified'} value={addressDetail} onChange={(event) => setAddressDetail(event.target.value)} placeholder="동·호수, 건물명 등" /></label>
              <label><span>요청사항</span><textarea disabled={verificationStatus !== 'verified'} rows={4} value={needs} onChange={(event) => setNeeds(event.target.value)} placeholder="예: 방문 상담 희망시간, 배송 관련 요청사항" /></label>
              <label className="consult-file-field">
                <span>장기요양인정서 <b className="optional">선택</b></span>
                <input disabled={verificationStatus !== 'verified'} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
                <small>자격 확인이 완료된 경우 필수는 아닙니다. 필요 시 JPG·PNG·WEBP·PDF, 최대 10MB로 첨부할 수 있습니다.</small>
              </label>
              <label className="consult-consent"><input disabled={verificationStatus !== 'verified'} type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>복지용구 신청 확인을 위한 수급자 급여정보·연락처·주소 및 제출서류의 수집·이용에 동의합니다.</span></label>

              <button className="button primary consult-submit-button" type="submit" disabled={status === 'sending' || !allCartEligible}>
                {status === 'sending' ? '안전하게 접수 중…' : allCartEligible ? '검증완료 · 복지용구 신청하기' : '자격·신청제품 확인 필요'}
              </button>

              {message && <div className={`consult-submit-message ${status}`}>{message}{requestId && <><br /><small>접수번호 {requestId}</small></>}</div>}
              <p className="consult-security-note">조회 비밀번호는 최종 신청정보에 저장하지 않습니다. 최종 접수 시 서버에서도 급여자격과 신청수량을 다시 검증하도록 연결됩니다.</p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
