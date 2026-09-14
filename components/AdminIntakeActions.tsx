'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { INTAKE_STATUSES, type IntakeStatus } from '@/lib/intake-store';
import { intakeStatusMeta } from '@/lib/intake-status';

export default function AdminIntakeActions({
  intakeId,
  initialStatus,
  initialNote,
}: {
  intakeId: string;
  initialStatus: IntakeStatus;
  initialNote: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<IntakeStatus>(initialStatus);
  const [staffNote, setStaffNote] = useState(initialNote);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function save() {
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch(`/api/admin/intakes/${encodeURIComponent(intakeId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, staffNote }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || '저장하지 못했습니다.');
      setMessage('저장했습니다.');
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
          <p className="admin-kicker">PROCESS</p>
          <h2>처리상태 · 담당자 메모</h2>
        </div>
      </div>
      <label className="admin-field">
        <span>처리상태</span>
        <select value={status} onChange={(event) => setStatus(event.target.value as IntakeStatus)}>
          {INTAKE_STATUSES.map((value) => <option key={value} value={value}>{intakeStatusMeta[value].label}</option>)}
        </select>
      </label>
      <label className="admin-field">
        <span>담당자 메모</span>
        <textarea
          rows={8}
          maxLength={5000}
          value={staffNote}
          onChange={(event) => setStaffNote(event.target.value)}
          placeholder="공단 조회 결과, 고객 통화 내용, 후속 처리사항 등을 기록하세요."
        />
      </label>
      <div className="admin-action-row">
        <button type="button" className="admin-primary-button" onClick={save} disabled={saving}>{saving ? '저장 중…' : '변경사항 저장'}</button>
        {message && <span className="admin-save-message">{message}</span>}
      </div>
    </section>
  );
}
