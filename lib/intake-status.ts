import type { IntakeStatus } from '@/lib/intake-store';

export const intakeStatusMeta: Record<IntakeStatus, { label: string; className: string }> = {
  NEW: { label: '신규접수', className: 'new' },
  REVIEWING: { label: '확인중', className: 'reviewing' },
  CONTACTED: { label: '상담완료', className: 'contacted' },
  COMPLETED: { label: '진행완료', className: 'completed' },
  HOLD: { label: '보류', className: 'hold' },
};
