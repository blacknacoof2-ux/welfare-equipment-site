# 신규 접수 이메일 알림 — 사전 준비 / 아직 비활성

이 변경은 접수 저장과 별개로 **최소 개인정보 이메일 알림**을 준비합니다.

## 수신 주소
- 관리자 수신: `atomcare@naver.com` (실제 주소는 Edge Function 환경변수 `INTAKE_EMAIL_TO`에만 설정)
- 발신: 검증된 Atomcare 발신 도메인 주소(예: `alerts@notify.atomcare.co.kr`). DNS 및 Resend 인증 전에는 메일 발송을 활성화하지 않습니다.

## 정확한 적용 조건 (운영 이전 확인 필요)
1. Vercel의 `SUPABASE_URL` 값이 **어느** Supabase 프로젝트인지 비밀을 드러내지 않고 확인하세요.
2. Production에 존재하는 `CONSULTATION_WEBHOOK_URL`의 **실제 활성 여부/수신 용도**를 확인하세요. 설정값의 원문은 기록하거나 외부로 전송하지 않습니다. 기존 웹훅 코드는 변동 없습니다.
3. 기존 `consultations` 데이터와 관리 화면을 백업·조회 검증하세요.
4. 실제 대상 Supabase DB에 대해 `supabase/sql/intake-email-outbox.sql`을 검토한 다음 명시적으로 승인받아 적용하세요. 이 SQL은 기존 행을 소급 통지하지 않습니다.
5. `supabase/functions/send-intake-alert/index.ts`를 배포하되, 호출 가능 경로의 인증 정책을 별도로 검증하세요. 사용자 브라우저는 호출할 수 없어야 합니다.
6. Supabase Edge Function Secret 설정:
   - `INTAKE_EMAIL_ENABLED`: 기본 미설정/false. 테스트 통과 및 별도 활성화 승인 시에만 `true` 설정
   - `INTAKE_EMAIL_WORKER_SECRET`: 최소 32자리 고엔트로피 랜덤, 비공개 (스케줄러 헤더와 동일)
   - `RESEND_API_KEY`: Resend 서버 API 키
   - `INTAKE_EMAIL_FROM`: Resend에서 인증된 발신주소
   - `INTAKE_EMAIL_TO`: `atomcare@naver.com`
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: 실제 프로젝트에 연결된 서버 전용 키
7. 별도로 승인된 Supabase Cron/Edge Function 호출을 연결합니다. 예: 1분마다 POST, `x-atomcare-worker-secret` 헤더로 인증. 시크릿은 SQL 문자열·공개 코드에 하드코딩하지 말고 Vault 등의 안전한 설정 저장소로 관리하세요.
8. 테스트는 가상 접수와 **실제 Production과 분리된** 개발 DB·테스트 메일로 먼저 수행합니다. 승인 없는 실데이터·실제 고객 메일 발송 금지.

## 설계 보증과 한계
- 접수 신규 INSERT 트리거가 동일 DB 트랜잭션에서 알림 작업을 생성합니다.
- 원본 개인정보(수급자, 연락처, 인정번호, 주소, 첨부파일)는 이메일·아웃박스에 넣지 않습니다. 이메일에는 접수번호/일시/상품 개수/로그인 필요 관리자 URL만 있습니다.
- 작업 선점은 DB의 `FOR UPDATE SKIP LOCKED`와 2분 lease로 중복 동시 처리를 줄입니다. Resend Idempotency-Key 재사용으로 공급자 중복 방지도 시도합니다. 완전한 종단 간 exactly-once 보장은 불가하므로 공급자 결과 불확실 시 관리자 점검 절차가 필요합니다.
- 지연된 작업과 4회 이상 실패한 작업은 `needs_review`에 유지하고 자동 발송을 중단합니다.
- 23시간 경과한 작업은 자동 재시도를 중단합니다(Resend idempotency 보존기간 경계 대비).
- `INTAKE_EMAIL_ENABLED=true`가 없는 한 어떠한 이메일도 발송하지 않습니다. 이중 안전장치로 수신처는 `atomcare@naver.com` 일치 여부를 검사합니다.
- Resend 성공 응답에서 메시지 ID를 확인하지 못하면 발송 완료로 표시하지 않고 재검토 대상으로 관리합니다.
- 사전 SQL 승인·Edge Function 배포·비밀값 설정·스케줄러 연결 전에는 어떤 메일도 발송하지 않습니다.
- 기존 고객 접수 API, Admin, 기존 웹훅, 상품·SEO·Production 설정은 이 PR에서 변경하지 않습니다.

## 배포 전 테스트 게이트
- SQL을 별도 테스트 DB에 적용하고 실제로 접수 INSERT 후 outbox 한 건, 중복 없는지 검사
- anon/authenticated의 SELECT/INSERT/UPDATE/EXECUTE 거부 확인
- 서비스 역할로 claim/complete/fail 및 lease 만료 후 재시도 점검
- 빈 RESEND 키·잘못된 작업 인증 헤더로는 반드시 발송 금지
- 가짜 이메일 API 응답 202/429/500/timeout 검증
- 기존 5건(점검 당시) 접수에 과거분 이메일이 생성되지 않는지 확인
- 기존 `npm run lint`, `npm run typecheck`, `npm run build`, `npm run audit:admin-intake` 통과
- 명시적 배포·발송 승인 후에만 Production 변경
