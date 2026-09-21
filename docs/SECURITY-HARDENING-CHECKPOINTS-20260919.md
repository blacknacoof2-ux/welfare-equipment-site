# 2026-09-19 Equipment Security Hardening Checkpoints

기준선
- Production main: `9e21c943a7dfc9fb8a16c415176ffa5ff1323267`
- 작업 브랜치: `hardening/security-audit-20260919`
- 원칙: 실제 코드/CI/운영 검증 완료 후에만 `[x]`로 변경한다.

## P0
- [x] P0-01 `/admin` 공개 Header/Footer/전화/비교/신청 플로팅 분리 — Preview 실로그인 `/admin` 화면 및 rendered audit PASS
- [x] P0-02 관리자 목록/상세 한국시간 표시 실제 브라우저 검증 — 목록/상세 모두 `2026. 09. 18. 09:47`; 운영 Supabase `submitted_at=2026-09-18 00:47:23.258+00`, Asia/Seoul 변환 `09:47:23.258`와 일치
- [ ] P0-03 관리자 로그인/상세 실제 브라우저 회귀 — Preview 로그인/목록/상세 진입 PASS; F5 새로고침 및 DevTools Console React `#418` 재발 여부 최종 확인 대기
- [x] P0-04 CI dependency audit / lint / image audit / typecheck / build / rendered audits PASS — CI #362, head `e055242`
- [x] P0-05 Vercel Preview READY — 최신 보안 브랜치 Preview READY; error/warning/fatal runtime 로그 0건
- [ ] P0-06 GitHub `main` 보호 규칙 적용(PR + CI 필수, force-push/삭제 금지) — 저장소 관리자 설정 필요
- [ ] P0-07 `CONSULTATION_WEBHOOK_URL` 사용 여부 확인 — 미사용이면 제거
- [ ] P0-08 GitHub 저장소 공개 여부 결정 — 현재 `welfare-equipment-site`는 Public. `.env`, `.env.local`, `.env.production`, `.env.development`, `.env.preview` 커밋 이력은 조회 결과 0건이고 현재 `.env.example`의 관리자 아이디 예시도 제거함. 운영/내부 코드 비공개가 원칙이면 Private 전환 검토; 전환 전 Vercel/GitHub 연동 영향 확인 필요

## P1
- [x] P1-01 Equipment 지속형 분산 Rate Limit — Supabase RPC 적용 및 실제 제한 동작 검증; Vercel 제공 client IP 헤더 우선 사용
- [x] P1-02 수급자 연동 8초 timeout + 실패 시 안전한 `NEEDS_REVIEW` fallback — CI/build PASS
- [x] P1-03 인정서 magic-byte 검사 — JPEG/PNG/WEBP/PDF signature 검사
- [x] P1-04 `consultations` anon/authenticated 권한 revoke — 운영 Supabase 적용 및 재확인
- [x] P1-05 보호된 관리자 API `private, no-store` + 비인증 401 감사 PASS
- [x] P1-06 신청 생년월일/유효기간 날짜 검증 강화 — 존재하지 않는 달력 날짜 거부, 생년월일 미래 날짜 거부

## P2
- [ ] P2-01 수급자 시스템 승인 transaction/RPC 원자화 — 별도 수급자 Supabase 직접 검증 후 진행
- [x] P2-02 구형 beneficiary `/api/integration/eligibility/verify` 제거 — 수급자 Preview build/runtime audit 404 PASS
- [x] P2-03 Beneficiary CSP 후보 배포 검증 — Preview 헤더 확인
- [ ] P2-04 최종 Production E2E 및 Runtime Error 재검증

## 완료 조건
- 치명/높음 보안 이슈 0건
- CI PASS
- 관리자/공개조회/서버간연동 E2E PASS
- Runtime Error 신규 클러스터 0건
