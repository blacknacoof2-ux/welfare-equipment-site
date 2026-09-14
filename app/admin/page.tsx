import { requireAdminSession } from '@/lib/admin-auth';
import { intakeStatusMeta } from '@/lib/intake-status';
import { isIntakeStoreConfigured, listIntakes, type IntakeStatus } from '@/lib/intake-store';

export const dynamic = 'force-dynamic';

const dateTime = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export default async function AdminDashboardPage() {
  await requireAdminSession();
  const configured = isIntakeStoreConfigured();

  let intakes = [] as Awaited<ReturnType<typeof listIntakes>>;
  let loadError = '';
  if (configured) {
    try {
      intakes = await listIntakes();
    } catch {
      loadError = '접수 저장소에서 목록을 불러오지 못했습니다. Supabase 연결과 schema.sql 적용 여부를 확인해 주세요.';
    }
  }

  const counts = intakes.reduce<Record<IntakeStatus, number>>((acc, intake) => {
    acc[intake.status] += 1;
    return acc;
  }, { NEW: 0, REVIEWING: 0, CONTACTED: 0, COMPLETED: 0, HOLD: 0 });

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="admin-kicker">DASHBOARD</p>
          <h1>수급자 신청 접수</h1>
          <p>고객이 제출한 수급자 정보·신청제품·장기요양인정서를 확인합니다. 공단 조회는 아톰케어 내부 업무에서 별도로 진행합니다.</p>
        </div>
      </div>

      {!configured && (
        <section className="admin-setup-card">
          <strong>운영 접수 저장소가 아직 연결되지 않았습니다.</strong>
          <p>Supabase 프로젝트에 <code>supabase/schema.sql</code>을 적용하고, <code>SUPABASE_URL</code>과 <code>SUPABASE_SERVICE_ROLE_KEY</code>를 설정하면 실제 접수가 이 화면에 표시됩니다.</p>
        </section>
      )}
      {loadError && <section className="admin-setup-card error"><strong>접수목록 로드 실패</strong><p>{loadError}</p></section>}

      <section className="admin-stat-grid" aria-label="접수 상태 요약">
        {(Object.keys(intakeStatusMeta) as IntakeStatus[]).map((status) => (
          <div className="admin-stat-card" key={status}>
            <span>{intakeStatusMeta[status].label}</span>
            <strong>{counts[status]}</strong>
          </div>
        ))}
        <div className="admin-stat-card total"><span>전체 접수</span><strong>{intakes.length}</strong></div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-kicker">INTAKES</p>
            <h2>최근 접수</h2>
          </div>
          <span className="admin-count">{intakes.length}건</span>
        </div>

        {intakes.length === 0 ? (
          <div className="admin-empty">
            <strong>아직 표시할 접수가 없습니다.</strong>
            <p>{configured ? '고객이 신청을 완료하면 이곳에 접수건이 생성됩니다.' : '저장소 연결을 완료하면 고객 접수를 받을 수 있습니다.'}</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>접수일시</th>
                  <th>수급자</th>
                  <th>연락처</th>
                  <th>지역</th>
                  <th>신청제품</th>
                  <th>상태</th>
                  <th>접수번호</th>
                </tr>
              </thead>
              <tbody>
                {intakes.map((intake) => {
                  const meta = intakeStatusMeta[intake.status];
                  return (
                    <tr key={intake.id}>
                      <td><a href={`/admin/intakes/${intake.id}`}>{dateTime.format(new Date(intake.submitted_at))}</a></td>
                      <td><a href={`/admin/intakes/${intake.id}`}><strong>{intake.beneficiary_name}</strong></a><small>{intake.relation} · 신청자 {intake.applicant_name}</small></td>
                      <td><a href={`tel:${intake.phone}`}>{intake.phone}</a></td>
                      <td>{intake.address}</td>
                      <td><strong>{intake.items.length}개</strong><small>{intake.items.slice(0, 2).map((item) => item.title).join(', ')}{intake.items.length > 2 ? ' 외' : ''}</small></td>
                      <td><span className={`admin-status ${meta.className}`}>{meta.label}</span></td>
                      <td><code>{intake.request_id}</code></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
