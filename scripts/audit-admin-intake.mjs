const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:5000';

async function fetchText(pathname, init = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, { redirect: 'manual', ...init });
  const text = await response.text();
  return { response, text };
}

const failures = [];

const home = await fetchText('/');
const expectedSecurityHeaders = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
};
for (const [name, expected] of Object.entries(expectedSecurityHeaders)) {
  const actual = home.response.headers.get(name) ?? '';
  if (actual !== expected) failures.push(`security header ${name} expected ${expected}, got ${actual || '(missing)'}`);
}
if (home.response.headers.has('x-powered-by')) failures.push('x-powered-by header must be disabled');

const login = await fetchText('/admin/login');
if (login.response.status !== 200) failures.push(`admin login returned ${login.response.status}`);
if (!login.text.includes('복지용구 접수관리')) failures.push('admin login heading missing');

const admin = await fetchText('/admin');
if (![302, 303, 307, 308].includes(admin.response.status)) failures.push(`unauthenticated admin returned ${admin.response.status}`);
const adminLocation = admin.response.headers.get('location') ?? '';
if (!adminLocation.includes('/admin/login')) failures.push(`admin redirect target invalid: ${adminLocation}`);

const internalCatalogAudit = await fetchText('/internal/catalog-audit');
if (![302, 303, 307, 308].includes(internalCatalogAudit.response.status)) {
  failures.push(`unauthenticated internal catalog audit returned ${internalCatalogAudit.response.status}`);
}
const internalCatalogLocation = internalCatalogAudit.response.headers.get('location') ?? '';
if (!internalCatalogLocation.includes('/admin/login')) {
  failures.push(`internal catalog audit redirect target invalid: ${internalCatalogLocation}`);
}

const application = await fetchText('/consult/cart', { redirect: 'follow' });
for (const requiredText of [
  '수급자 이름',
  '수급자 생년월일',
  '장기요양인정번호',
  '유효기간 시작일',
  '장기요양 등급',
  '휴대폰 번호',
  '주소',
  '장기요양인정서',
  '선택',
  '복지용구 신청하기',
]) {
  if (!application.text.includes(requiredText)) failures.push(`application field missing: ${requiredText}`);
}
if (!application.text.includes('선택사항입니다.')) failures.push('optional certificate guidance missing');
if (!application.text.includes('접수 후 관리자가')) failures.push('post-submission eligibility guidance missing');
if (application.text.includes('급여자격 확인</button>')) failures.push('customer eligibility verification button must not be rendered');

const noStore = await fetchText('/api/consultations', {
  method: 'POST',
  body: new FormData(),
});
if (noStore.response.status !== 503) failures.push(`unconfigured intake endpoint must fail closed with 503, got ${noStore.response.status}`);

console.log(JSON.stringify({
  summary: {
    homeStatus: home.response.status,
    securityHeadersChecked: Object.keys(expectedSecurityHeaders).length,
    poweredByHeaderPresent: home.response.headers.has('x-powered-by'),
    adminLoginStatus: login.response.status,
    unauthenticatedAdminStatus: admin.response.status,
    unauthenticatedInternalCatalogStatus: internalCatalogAudit.response.status,
    applicationStatus: application.response.status,
    unconfiguredIntakeStatus: noStore.response.status,
    failures: failures.length,
  },
  failures,
}, null, 2));

if (failures.length) process.exitCode = 1;
