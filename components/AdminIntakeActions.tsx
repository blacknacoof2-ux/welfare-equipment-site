'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ELIGIBILITY_STATUSES, eligibilityStatusLabel, type EligibilityStatus } from '@/lib/intake-eligibility';
import { INTAKE_STATUSES, type IntakeStatus } from '@/lib/intake-store';
import { intakeStatusMeta } from '@/lib/intake-status';

export default function AdminIntakeActions({
  intakeId,
  initialStatus,
  initialNote,
  initialEligibilityStatus,
  initialVerifiedCareGrade,
  initialVerifiedCopayRate,
  initialEligibilityMessage,
  initialCheckedAt,
}: {
  intakeId: string;
  initialStatus: IntakeStatus;
  initialNote: string;
  initialEligibilityStatus: EligibilityStatus;
  initialVerifiedCareGrade: string | null;
  initialVerifiedCopayRate: number | null;
  initialEligibilityMessage: string;
  initialCheckedAt: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<IntakeStatus>(initialStatus);
  const [staffNote, setStaffNote] = useState(initialNote);
  const [eligibilityStatus, setEligibilityStatus] = useState<EligibilityStatus>(initialEligibilityStatus);
  const [verifiedCareGrade, setVerifiedCareGrade] = useState(initialVerifiedCareGrade ?? '');
  const [verifiedCopayRate, setVerifiedCopayRate] = useState(initialVerifiedCopayRate == null ? '' : String(initialVerifiedCopayRate));
  const [eligibilityMessage, setEligibilityMessage] = useState(initialEligibilityMessage);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');

  async function verifyEligibility() {
    setChecking(true);
    setMessage('');
    try {
      const response = await fetch(`/api/admin/intakes/${encodeURIComponent(intakeId)}/verify-eligibility`, {
        method: 'POST',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || '자격조회를 완료하지 못했습니다.');
      setMessage(data.message || '자격조회 결과를 반영했습니다.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '자격조회를 완료하지 못했습니다.');
    } finally {
      setChecking(false);
    }
  }

  async function save() {
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch(`/api/admin/intakes/${encodeURIComponent(intakeId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          staffNote,
          eligibilityStatus,
          verifiedCareGrade,
          verifiedCopayRate,
          eligibilityMessage,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || '저장하지 못했습니다.');
      setMessage('변경사항을 저장했습니다.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '저장하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-panel admin-action-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="admin-kicker">ELIGIBILITY · PROCESS</p>
          <h2>자격조회 · 처리상태</h2>
          <p>고객 신청 후 수급자 시스템에서 조회하고, 필요하면 확인 결과를 수동으로 보정할 수 있습니다.</p>
        </div>
      </div>

      <div className="admin-action-row">
        <button type="button" className="admin-primary-button" onClick={verifyEligibility} disabled={checking}>
          {checking ? '수급자 시스템 조회 중…' : '수급자 시스템에서 자격조회'}
        </button>
        {initialCheckedAt && <span className="admin-save-message">최근 조회 {new Date(initialCheckedAt).toLocaleString('ko-KR')}</span>}
      </div>

      <label className="admin-field">
        <span>자격상태</span>
        <select value={eligibilityStatus} onChange={(event) => setEligibilityStatus(event.target.value as EligibilityStatus)}>
          {ELIGIBILITY_STATUSES.map((value) => <option key={value} value={value}>{eligibilityStatusLabel[value]}</option>)}
        </select>
      </label>
      <label className="admin-field">
        <span>관리자 확인 등급</span>
        <input value={verifiedCareGrade} onChange={(event) => setVerifiedCareGrade(event.target.value)} placeholder="예: 3등급, 인지지원등급" />
      </label>
      <label className="admin-field">
        <span>관리자 확인 본인부담률 (%)</span>
        <input type="number" min="0" max="100" step="0.01" value={verifiedCopayRate} onChange={(event) => setVerifiedCopayRate(event.target.value)} placeholder="예: 15" />
      </label>
      <label className="admin-field">
        <span>자격확인 결과 메모</span>
        <textarea rows={4} maxLength={2000} value={eligibilityMessage} onChange={(event) => setEligibilityMessage(event.target.value)} placeholder="자동 조회 결과 또는 수동 확인 내용을 기록하세요." />
      </label>

      <label className="admin-field">
        <span>처리상태</span>
        <select value={status} onChange={(event) => setStatus(event.target.value as IntakeStatus)}>
          {INTAKE_STATUSES.map((value) => <option key={value} value={value}>{intakeStatusMeta[value].label}</option>)}
        </select>
      </label>
      <label className="admin-field">
        <span>담당자 메모</span>
        <textarea rows={8} maxLength={5000} value={staffNote} onChange={(event) => setStaffNote(event.target.value)} placeholder="고객 통화 내용, 후속 처리사항 등을 기록하세요." />
      </label>
      <div className="admin-action-row">
        <button type="button" className="admin-primary-button" onClick={save} disabled={saving}>{saving ? '저장 중…' : '변경사항 저장'}</button>
        {message && <span className="admin-save-message">{message}</span>}
      </div>
    </section>
  );
}
