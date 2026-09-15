import { notFound } from 'next/navigation';
import AdminIntakeActions from '@/components/AdminIntakeActions';
import { requireAdminSession } from '@/lib/admin-auth';
import { intakeStatusMeta } from '@/lib/intake-status';
import { createCertificateSignedUrl, getIntake, isIntakeStoreConfigured } from '@/lib/intake-store';

export const dynamic = 'force-dynamic';

const dateTime = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export default async function AdminIntakeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  if (!isIntakeStoreConfigured()) notFound();

  const { id } = await params;
  const intake = await getIntake(id).catch(() => null);
  if (!intake) notFound();

  const certificateUrl = await createCertificateSignedUrl(intake.certificate_path).catch(() => null);
  const statusMeta = intakeStatusMeta[intake.status];
  const fullAddress = `${intake.address}${intake.address_detail ? ` ${intake.address_detail}` : ''}`;

  return (
    <>
      <div className="admin-detail-heading">
        <div>
          <a className="admin-back-link" href="/admin">← 접수목록</a>
          <p className="admin-kicker">{intake.request_id}</p>
          <h1>{intake.beneficiary_name} 수급자 접수</h1>
          <p>{dateTime.format(new Date(intake.submitted_at))} 접수 · 신청자 {intake.applicant_name}</p>
        </div>
        <span className={`admin-status large ${statusMeta.className}`}>{statusMeta.label}</span>
      </div>

      <div className="admin-detail-grid">
        <div className="admin-detail-main">
          <section className="admin-panel">
            <div className="admin-panel-heading"><div><p className="admin-kicker">BENEFICIARY</p><h2>수급자 정보</h2></div></div>
            <dl className="admin-info-grid">
              <div><dt>수급자명</dt><dd>{intake.beneficiary_name}</dd></div>
              <div><dt>생년월일</dt><dd>{intake.birth_date}</dd></div>
              <div><dt>장기요양인정번호</dt><dd><code>{intake.care_number}</code></dd></div>
              <div><dt>유효기간 시작일</dt><dd>{intake.validity_start_date || '-'}</dd></div>
              <div><dt>신청자와의 관계</dt><dd>{intake.relation || '-'}</dd></div>
              <div><dt>신청자명</dt><dd>{intake.applicant_name}</dd></div>
              <div><dt>휴대폰</dt><dd><a href={`tel:${intake.phone}`}>{intake.phone}</a></dd></div>
              <div className="wide"><dt>주소</dt><dd>{fullAddress}</dd></div>
              <div className="wide"><dt>요청사항</dt><dd>{intake.needs || '별도 요청사항 없음'}</dd></div>
            </dl>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-heading"><div><p className="admin-kicker">PRODUCTS</p><h2>신청 제품 {intake.items.length}개</h2></div></div>
            <div className="admin-product-list">
              {intake.items.map((item) => (
                <article key={item.benefitCode}>
                  <div><span>{item.category}</span><strong>{item.title}</strong><small>{item.manufacturer}</small></div>
                  <div><span>급여코드</span><code>{item.benefitCode}</code></div>
                  <a href={`/products/${item.slug}`} target="_blank" rel="noreferrer">제품 보기</a>
                </article>
              ))}
            </div>
          </section>

          <AdminIntakeActions intakeId={intake.id} initialStatus={intake.status} initialNote={intake.staff_note} />
        </div>

        <aside className="admin-certificate-panel admin-panel">
          <div className="admin-panel-heading">
            <div><p className="admin-kicker">CERTIFICATE</p><h2>장기요양인정서</h2></div>
            {certificateUrl && <a href={certificateUrl} target="_blank" rel="noreferrer">새창으로 보기</a>}
          </div>
          {intake.certificate_path ? (
            <>
              <p className="admin-file-meta">{intake.certificate_name || '제출 파일'}</p>
              {certificateUrl ? (
                intake.certificate_type === 'application/pdf' ? (
                  <iframe title="장기요양인정서 PDF" src={certificateUrl} className="admin-certificate-frame" />
                ) : (
                  <img src={certificateUrl} alt={`${intake.beneficiary_name} 장기요양인정서`} className="admin-certificate-image" />
                )
              ) : (
                <div className="admin-empty"><strong>인정서 미리보기를 열 수 없습니다.</strong><p>저장소 연결 또는 서명 URL 생성을 확인해 주세요.</p></div>
              )}
              <p className="admin-security-copy">인정서는 비공개 Storage에 저장되며, 이 화면에서는 짧은 유효시간의 임시 링크로만 표시합니다.</p>
            </>
          ) : (
            <div className="admin-empty">
              <strong>인정서 미제출 접수</strong>
              <p>수급자 정보와 인정번호, 유효기간 시작일로 먼저 접수되었습니다. 필요하면 상담 과정에서 인정서를 추가로 요청하세요.</p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
