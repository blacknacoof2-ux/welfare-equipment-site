# 수급자 자격확인 × 복지용구 신청 운영 체크리스트

## 최종 운영 흐름

`고객 제품 선택 → 고객 신청 접수(PENDING) → 신청화면 개인정보 초기화 → 관리자 로그인 → 관리자 접수건 확인 → 별도 수급자 시스템 서버간 조회 → 등급/본인부담률/급여가능품목/남은수량 반영 → 상담 처리 → 완료`

## 고정 원칙

- `welfare-equipment-site`와 `welfare-beneficiary-system`의 Supabase는 **2개로 분리 유지**한다.
- 두 DB를 직접 합치거나 브라우저에서 서로의 service/secret key를 사용하지 않는다.
- 두 시스템은 `BENEFICIARY_INTEGRATION_SECRET`으로 보호된 서버간 API만 사용한다.
- 고객 신청 단계에서는 자격검증 비밀번호를 요구하지 않는다.
- 고객이 입력한 장기요양 등급은 `self-reported` 값으로 보존하고, 관리자 조회 결과와 구분한다.
- Supabase service role/secret, 관리자 비밀번호, integration secret은 저장소에 커밋하지 않는다.

## 체크리스트

### A. 고객 신청
- [x] A-01 신청목록에서 고객 정보 입력 후 먼저 접수하는 흐름으로 변경
- [x] A-02 고객 자격조회/PIN 입력 제거
- [x] A-03 장기요양 등급 선택: 1~5등급, 인지지원등급, 잘 모름
- [x] A-04 신청 접수 시 `eligibility_status=PENDING` 저장 구조 적용
- [x] A-05 `welfare-equipment-site` Supabase 접수 저장 연결 및 실제 접수 확인
- [x] A-06 신청 성공 후 이름/생년월일/인정번호/연락처/주소/첨부/신청목록 화면에서 즉시 초기화
- [x] A-07 접수 완료 화면에는 접수번호 중심으로 표시
- [x] A-08 다음/카카오 주소검색 실기 PASS
  - 주소 클릭 또는 `주소 찾기` 버튼 → 주소검색 레이어 정상 표시
  - 주소 선택 → 우편번호 + 기본주소 자동입력 PASS
  - 상세주소 입력 흐름 PASS

### B. 복지용구 관리자
- [x] B-01 관리자 인증 코드 적용
- [x] B-02 접수 상세 화면에 고객 자가입력 등급과 자격상태 표시
- [x] B-03 관리자 상세 화면에 `수급자 시스템에서 자격조회` 기능 코드 적용
- [x] B-04 조회 결과 저장 필드 적용: 검증성명/등급/본인부담률/유효기간/가능품목/남은수량/확인시각
- [x] B-05 신청품목과 조회 결과 비교 후 `ELIGIBLE / INELIGIBLE / NEEDS_REVIEW` 판정 코드 적용
- [x] B-06 관리자가 자격상태/검증등급/본인부담률을 수동 보정할 수 있는 코드 적용
- [x] B-07 로컬 관리자 로그인 PASS
  - `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET` 설정 확인
  - 포트 5000 서버 재시작 후 `/admin` 로그인 실기 PASS
- [x] B-08 실제 접수건 관리자 화면 표시 PASS
  - 접수건 상세 열림
  - 수급자/신청자/연락처/주소/인정번호/자가입력등급/자격상태/신청제품 표시 확인
- [ ] B-09 실제 접수건에서 자격조회 버튼 PASS
- [ ] B-10 실제 조회 후 등급/부담률/가능품목/남은수량 반영 PASS

### C. 수급자 시스템 연동
- [x] C-01 `welfare-beneficiary-system` 별도 Supabase 유지
- [x] C-02 서버간 `/api/integration/eligibility/revalidate` 코드 구현
- [x] C-03 인정번호 + 생년월일 + 유효기간 시작일 기준 조회 구조 적용
- [x] C-04 관리자 체크된 급여가능품목과 남은수량 반환 구조 적용
- [x] C-04A 판매 급여품목 / 대여 급여품목 `전체 체크` UX 실기 PASS
- [x] C-05 두 프로젝트의 `BENEFICIARY_INTEGRATION_SECRET`을 동일한 비밀값으로 로컬 설정
  - 양쪽 `.env.local` 설정 존재 확인 PASS
  - 동일값 비교 `SAME=True` PASS
  - secret length 64 확인 PASS
- [x] C-06 포트 2000 수급자 시스템 + 포트 5000 복지용구 사이트 동시 실행
  - `http://localhost:2000/admin` 접속 PASS
  - `http://localhost:5000/admin` 접속 PASS
- [ ] C-07 서버간 실제 조회 E2E PASS

### D. 데이터/보안
- [x] D-01 복지용구 Supabase에 deferred eligibility 필드 마이그레이션 적용
- [x] D-02 고객 신청 첨부 버킷 `consultation-certificates` 확인
- [x] D-03 첨부 최대 10MB 정책 확인
- [x] D-04 관리자 세션은 서버 환경변수 기반으로만 검증
- [x] D-05 브라우저에 Supabase service role / integration secret 미노출 구조
- [ ] D-06 실기 기준 개인정보/서버로그/오류응답 노출 재점검
- [ ] D-07 관리자 로그인 rate limit 및 접수 rate limit 회귀확인

### E. 코드 품질/CI
- [x] E-01 deferred intake 변경 CI PASS 이력 확보
- [x] E-02 신청 성공 후 개인정보 초기화 변경 반영
- [ ] E-03 주소검색 변경 lint/typecheck/build/렌더링 감사 PASS
- [ ] E-04 두 저장소 최신 상태 build/lint PASS
- [ ] E-05 PR #11 최종 diff 검토 및 ready 전환
- [ ] E-06 main 병합

### F. 운영 배포
- [ ] F-01 `welfare-equipment-site` Vercel 운영 환경변수 설정
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_CERTIFICATE_BUCKET`
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD`
  - `ADMIN_SESSION_SECRET`
  - `BENEFICIARY_API_BASE_URL`
  - `BENEFICIARY_INTEGRATION_SECRET`
- [ ] F-02 `welfare-beneficiary-system` 운영 배포 주소 확보
- [ ] F-03 수급자 시스템 운영 환경변수 설정
- [ ] F-04 운영 `BENEFICIARY_API_BASE_URL`에서 `localhost:2000` 제거
- [ ] F-05 실제 도메인에서 고객신청 → 관리자조회 → 완료 전체 PASS

## 현재 작업 위치

현재 **B-07 관리자 로그인 PASS + A-08 주소검색 실기 PASS + B-08 실제 접수건 관리자 표시 PASS + C-04A 판매/대여 전체 체크 PASS + C-05 연동 Secret 동일값 설정 PASS + C-06 포트 2000/5000 동시 실행 PASS 완료**. 다음 게이트는 **2000에서 확인 완료 및 정보 반영 → 5000에서 재조회 → B-09/B-10/C-07 판정**이다.

## 실기 PASS 순서

1. [x] `welfare-equipment-site` 관리자 환경변수 설정 및 5000 서버 재시작
2. [x] `/admin` 로그인
3. [x] `/consult/cart` 주소검색 확인
4. [x] 테스트 신청 1건 접수
5. [x] 관리자에서 접수건 열기
6. [x] 두 프로젝트에 동일한 `BENEFICIARY_INTEGRATION_SECRET` 설정
7. [x] 포트 2000/5000 동시 실행
8. [ ] 2000 수급자 시스템에서 등급/본인부담률/급여가능품목 저장
9. [ ] 5000 관리자 `수급자 시스템에서 자격조회` 실행
10. [ ] 등급/본인부담률/가능품목/남은수량 확인
11. [ ] 상담상태 저장 후 전체 E2E PASS 처리

## 비밀값 주의

실제 `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `BENEFICIARY_INTEGRATION_SECRET` 값은 채팅/스크린샷/저장소에 올리지 않는다.
