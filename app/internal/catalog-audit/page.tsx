import type { Metadata } from 'next';
import { catalogProgress, catalogProgressSummary } from '@/lib/catalog-progress';
import {
  OFFICIAL_CATALOG_EFFECTIVE_DATE,
  OFFICIAL_CATALOG_NOTICE,
  OFFICIAL_CATALOG_SOURCE_URL,
} from '@/lib/catalog-targets';

export const metadata: Metadata = {
  title: '내부 상품 카탈로그 감사',
  robots: { index: false, follow: false },
};

export default function CatalogAuditPage() {
  const summary = catalogProgressSummary;
  const totalCoverage =
    summary.target === 0 ? 100 : Math.round((summary.accounted / summary.target) * 1000) / 10;

  return (
    <section className="section">
      <p className="eyebrow">INTERNAL CATALOG AUDIT</p>
      <h1>복지용구 전체 상품 업데이트 진행률</h1>
      <p className="muted">
        기준: {OFFICIAL_CATALOG_NOTICE} · 시행 {OFFICIAL_CATALOG_EFFECTIVE_DATE} · 공식 목표 {summary.target}개
      </p>

      <div className="content-card" style={{ marginTop: 24 }}>
        <h2>전체 현황</h2>
        <table className="price-table">
          <tbody>
            <tr><th>공식 급여제품</th><td>{summary.target}개</td></tr>
            <tr><th>ACTIVE</th><td>{summary.active}개</td></tr>
            <tr><th>이로움 확인 대기</th><td>{summary.pending}개</td></tr>
            <tr><th>단종·비유통·품절 제외</th><td>{summary.excluded}개</td></tr>
            <tr><th>현재 원장 반영</th><td>{summary.accounted}개 ({totalCoverage}%)</td></tr>
            <tr><th>아직 미등록</th><td><strong>{summary.missing}개</strong></td></tr>
          </tbody>
        </table>
        <p className="muted" style={{ marginTop: 16 }}>
          ACTIVE는 이로움 현재 유통 확인과 급여코드·급여가격 교차검증을 모두 통과한 제품만 포함합니다.
        </p>
        <p><a href={OFFICIAL_CATALOG_SOURCE_URL} rel="noreferrer" target="_blank">공단 공식 고시 확인 →</a></p>
      </div>

      <div className="content-card" style={{ marginTop: 24, overflowX: 'auto' }}>
        <h2>품목별 진행률</h2>
        <table className="price-table">
          <thead>
            <tr>
              <th>품목</th>
              <th>공식</th>
              <th>ACTIVE</th>
              <th>대기</th>
              <th>제외</th>
              <th>미등록</th>
              <th>반영률</th>
            </tr>
          </thead>
          <tbody>
            {catalogProgress.map((item) => (
              <tr key={item.category}>
                <td>{item.category}</td>
                <td>{item.target}</td>
                <td>{item.active}</td>
                <td>{item.pending}</td>
                <td>{item.excluded}</td>
                <td><strong>{item.missing}</strong></td>
                <td>{item.coverage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
