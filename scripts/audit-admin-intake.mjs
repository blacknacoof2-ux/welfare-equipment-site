const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:5000';

async function fetchText(pathname, init = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, { redirect: 'manual', ...init });
  const text = await response.text();
  return { response, text };
}

const failures = [];

const login = await fetchText('/admin/login');
if (login.response.status !== 200) failures.push(`admin login returned ${login.response.status}`);
if (!login.text.includes('복지용구 접수관리')) failures.push('admin login heading missing');

const admin = await fetchText('/admin');
if (![302, 303, 307, 308].includes(admin.response.status)) failures.push(`unauthenticated admin returned ${admin.response.status}`);
const adminLocation = admin.response.headers.get('location') ?? '';
if (!adminLocation.includes('/admin/login')) failures.push(`admin redirect target invalid: ${adminLocation}`);

const application = await fetchText('/consult/cart', { redirect: 'follow' });
for (const requiredText of ['수급자 성명', '수급자 생년월일', '장기요양인정번호', '유효기간 시작일', '장기요양인정서', '선택', '복지용구 신청 접수하기']) {
  if (!application.text.includes(requiredText)) failures.push(`application field missing: ${requiredText}`);
}
if (!application.text.includes('인정서는 지금 없어도')) failures.push('optional certificate guidance missing');

const noStore = await fetchText('/api/consultations', {
  method: 'POST',
  body: new FormData(),
});
if (noStore.response.status !== 503) failures.push(`unconfigured intake endpoint must fail closed with 503, got ${noStore.response.status}`);

console.log(JSON.stringify({
  summary: {
    adminLoginStatus: login.response.status,
    unauthenticatedAdminStatus: admin.response.status,
    applicationStatus: application.response.status,
    unconfiguredIntakeStatus: noStore.response.status,
    failures: failures.length,
  },
  failures,
}, null, 2));

if (failures.length) process.exitCode = 1;
