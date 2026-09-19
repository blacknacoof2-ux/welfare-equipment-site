# 2026-09-19 Security & Error Hardening Checkpoints

기준선
- Production main before hardening: `42908d843850e0dd58409c0a70352e3ff23ddce0`
- 작업 브랜치: `hardening/security-audit-20260919`
- 원칙: 체크는 실제 코드/CI/운영 검증 완료 후에만 `[x]`로 변경한다.

## P0 — 운영 화면·배포 게이트
- [ ] P0-01 관리자(`/admin`)에서 공개 Header/Footer/전화/신청목록/제품비교 UI 완전 분리
- [ ] P0-02 관리자 목록 시간대 `Asia/Seoul` 명시 및 상세 화면과 일치
- [ ] P0-03 관리자 비로그인·로그인·상세 화면 회귀 테스트
- [ ] P0-04 CI: dependency audit / lint / image audits / typecheck / build / rendered audits PASS
- [ ] P0-05 Vercel Preview 또는 Production 후보 배포 READY 확인
- [ ] P0-06 GitHub `main` 보호 규칙 적용(PR + CI 필수, force-push/삭제 금지) — 저장소 관리자 설정 필요
- [ ] P0-07 `CONSULTATION_WEBHOOK_URL` 사용 여부 확인; 미사용이면 Production/Preview에서 제거

## P1 — 애플리케이션 보안 강화
- [ ] P1-01 Equipment 로그인/접수 Rate Limit을 분산 환경에서도 지속되는 방식으로 전환
- [ ] P1-02 수급자 연동 fetch에 5~8초 timeout 및 안전한 `NEEDS_REVIEW` 처리
- [ ] P1-03 인정서 업로드 magic-byte 검사(JPEG/PNG/WEBP/PDF)
- [ ] P1-04 Supabase `consultations`의 `anon`,`authenticated` 테이블 권한 명시적 revoke 검증
- [ ] P1-05 관리자/접수 API `private, no-store` 및 비인증 401/리다이렉트 회귀 테스트

## P2 — 구조·데이터 무결성
- [ ] P2-01 수급자 승인 저장을 PostgreSQL transaction/RPC 단위로 원자화 검토·구현
- [ ] P2-02 미사용 구형 integration API 제거 여부 결정 후 공격면 축소
- [ ] P2-03 수급자 시스템 CSP 강화
- [ ] P2-04 최종 운영 E2E: 고객접수 → 관리자조회 → 수급자 연동 → 저장/새로고침 → 로그 점검

## 완료 조건
- 치명/높음 보안 이슈 0건
- GitHub CI 전 단계 PASS
- Vercel Runtime Error 신규 클러스터 0건
- 운영 관리자/수급자 연동 E2E PASS
- 롤백 가능한 직전 Production 배포 유지
