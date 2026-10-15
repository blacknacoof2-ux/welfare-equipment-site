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

## 2026-10-15 읽기 전용 연결·DNS 사전점검

- GitHub PR #24 최신 격리 PostgreSQL 통합 테스트 및 CI: PASS. 단, 이것은 Production 적용의 승인이 아님.
- Vercel 프로젝트 `welfare-equipment-site`: Production에 `SUPABASE_URL`, `CONSULTATION_WEBHOOK_URL` 환경변수 항목 존재.
- **중요**: Vercel API는 위 Sensitive 값의 실제 내용을 반환하지 않음. 따라서 Supabase 프로젝트의 URL 일치와 웹훅 URL의 활성 여부는 **미확인**. 항목 존재만으로 활성화됐다고 주장하지 말 것.
- Supabase에서 조회 가능한 후보 프로젝트 `welfare-equipment-site`(`dafvwbrfiolccagymufz`)는 활성. Edge Functions 0개 확인. 실제 Production의 접수 DB와 동일한지는 연결값 확인 전까지 단정 금지.
- Production Vercel 배포는 PR #23의 커밋 `ff1125416ca5`, READY. PR #24는 Draft 상태로 **미병합**.
- Vercel 도메인 설정에서 `atomcare.co.kr`의 네임서버가 `ns.gabia.net`, `ns1.gabia.co.kr`, `ns.gabia.co.kr`로 확인됨. DNS의 실관리자는 **가비아**이며 Vercel DNS 레코드 목록이 비어 있다고 해서 가비아 DNS 레코드가 없다는 뜻은 아님.
- 현재 실행 환경에서는 가비아 권한 및 공용 DNS 실시간 조회가 불가능하므로 `notify.atomcare.co.kr` DNS 발신 인증 상태는 **미확인**.

### 발신 도메인 준비 — 관리자 수행·검증 필요

1. [Resend Domains](https://resend.com/domains)에서 `notify.atomcare.co.kr`을 발신용으로 추가한 다음, Resend에 표시되는 **정확한** DNS 레코드와 상태를 확인한다. 인증 완료 전 실제 이메일을 보내지 않는다.
2. 가비아 관리계정에서 **`atomcare.co.kr` DNS 관리**를 열고 Resend가 제공한 하위 도메인용 DKIM/SPF 및 필요한 MX/CNAME 레코드만 추가한다. 레코드 이름·값·우선순위는 반드시 해당 Resend 화면을 그대로 따른다. 이 문서에 임의 SPF/DKIM 값을 작성하거나 자동으로 생성하지 않는다.
3. `atomcare.co.kr` 루트의 MX, TXT(SPF), 기존 웹사이트 A/CNAME 등을 변경·삭제하지 않는다. `atomcare@naver.com`은 **알림 수신 주소**이며 `alerts@notify.atomcare.co.kr`은 **발신 주소**다.
4. Resend에 `Verified`가 표시되면, DNS 레코드값이나 API 키 대신 도메인 인증 완료 화면(민감 값 가림)만 공유한다.
5. 별도 승인 후 실제 서비스 비밀값은 Supabase Edge Function Secrets에 안전하게 등록한다. **API 키를 채팅, GitHub Issue/PR, Vercel 공개 설정 등에 붙여넣지 않는다.** 메일 발송 활성화 플래그는 계속 `false`로 유지한다.
6. Vercel Production의 `SUPABASE_URL` 항목을 사용자가 화면에서 확인하고, 실제 프로젝트 ref가 `dafvwbrfiolccagymufz`와 일치하는지 **일치/불일치만** 회신한다. 실제 URL이나 service role key는 공유하지 않는다.
7. Vercel Production의 `CONSULTATION_WEBHOOK_URL`이 빈 값인지/사용 중인지, 수신 서비스 관리자가 누구인지 확인한다. URL, 서명키, 고객 개인정보를 외부로 공개하지 않는다. 민감정보 외부 전송 경로에 대한 별도 승인 없이 기존 웹훅을 이메일 발송 시스템에 재사용하지 않는다.

**계속 차단되는 단계:** 실제 Production DB SQL 실행, Supabase Edge Function 배포, Cron 등록, DNS 레코드 변경, Resend 실발송은 별도 사용자의 구체적 승인 없이는 실행하지 않는다.
