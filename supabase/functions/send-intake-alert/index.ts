// Supabase Edge Function: notification worker (NOT deployed by this PR).
// Secret env required: INTAKE_EMAIL_WORKER_SECRET, RESEND_API_KEY,
// INTAKE_EMAIL_FROM, INTAKE_EMAIL_TO, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// Never put recipient addresses, eligibility numbers, phone or uploaded files in logs.
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
});

function getConfig() {
  return {
    workerSecret: Deno.env.get('INTAKE_EMAIL_WORKER_SECRET')?.trim() ?? '',
    resendKey: Deno.env.get('RESEND_API_KEY')?.trim() ?? '',
    from: Deno.env.get('INTAKE_EMAIL_FROM')?.trim() ?? '',
    to: Deno.env.get('INTAKE_EMAIL_TO')?.trim() ?? '',
    supabaseUrl: Deno.env.get('SUPABASE_URL')?.replace(/\/$/, '') ?? '',
    serviceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim() ?? '',
  };
}
type Job = {
  id: string;
  request_id: string;
  submitted_at: string;
  product_count: number;
  lease_token: string;
};
function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c] ?? c);
}
function requestIdValid(value: string) {
  return /^AC-\d{8}-[A-F0-9]{8}$/.test(value);
}
async function rpc<T>(config: ReturnType<typeof getConfig>, method: string, body: object): Promise<T> {
  const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/${method}`, {
    method: 'POST',
    headers: {
      apikey: config.serviceKey,
      Authorization: `Bearer ${config.serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`RPC_${method}_${response.status}`);
  return await response.json() as T;
}
async function processJob(config: ReturnType<typeof getConfig>, job: Job): Promise<'sent'|'failed'> {
  if (!requestIdValid(job.request_id)) {
    await rpc(config, 'fail_intake_email', {
      p_job_id: job.id, p_lease_token: job.lease_token, p_error_code: 'INVALID_REQUEST_ID',
    });
    return 'failed';
  }
  const safeId = escapeHtml(job.request_id);
  const at = Number.isFinite(Date.parse(job.submitted_at))
    ? new Intl.DateTimeFormat('ko-KR', { timeZone:'Asia/Seoul',dateStyle:'medium',timeStyle:'short' }).format(new Date(job.submitted_at))
    : '관리자 페이지에서 확인';
  const subject = '[아톰케어] 신규 복지용구 신청 접수';
  const html = `<div lang="ko" style="font-family:sans-serif;line-height:1.7">
    <h2>신규 복지용구 접수가 등록되었습니다.</h2>
    <p>접수번호: <strong>${safeId}</strong></p>
    <p>접수일시: ${escapeHtml(at)}</p>
    <p>신청제품: ${Math.max(0, Math.floor(job.product_count))}개</p>
    <p><a href="https://welfare.atomcare.co.kr/admin">관리자 접수 확인</a></p>
    <p>고객 개인정보·인정번호·첨부서류는 메일에 포함하지 않습니다.</p>
  </div>`;
  try {
    const send = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resendKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `intake-email/${job.request_id}`,
      },
      body: JSON.stringify({
        from: config.from, to: [config.to], subject, html,
        text: `신규 복지용구 접수\n접수번호: ${job.request_id}\n접수일시: ${at}\n신청제품: ${job.product_count}개\n관리자: https://welfare.atomcare.co.kr/admin`,
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!send.ok) {
      await rpc(config, 'fail_intake_email', {
        p_job_id: job.id, p_lease_token: job.lease_token, p_error_code: `RESEND_HTTP_${send.status}`,
      });
      return 'failed';
    }
    const result = await send.json().catch(() => ({})) as {id?: string};
    await rpc(config, 'complete_intake_email', {
      p_job_id: job.id, p_lease_token: job.lease_token, p_provider_id: result.id || 'accepted_without_id',
    });
    return 'sent';
  } catch {
    // A timeout can be an uncertain delivery, so the same idempotency key is retried.
    await rpc(config, 'fail_intake_email', {
      p_job_id: job.id, p_lease_token: job.lease_token, p_error_code: 'PROVIDER_OR_NETWORK_ERROR',
    });
    return 'failed';
  }
}
Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return json({ok:false}, 405);
  const c = getConfig();
  // Fail closed: no outbound email until all configuration is explicitly installed.
  if (!c.workerSecret || c.workerSecret.length < 32 || !c.resendKey || !c.from ||
      !c.to || !c.supabaseUrl || !c.serviceKey) return json({ok:false, reason:'NOT_CONFIGURED'}, 503);
  if (request.headers.get('x-atomcare-worker-secret') !== c.workerSecret) return json({ok:false}, 401);
  let jobs: Job[];
  try { jobs = await rpc<Job[]>(c, 'claim_intake_email_batch', {p_limit:5}); }
  catch { return json({ok:false, reason:'CLAIM_ERROR'}, 503); }
  let sent=0, failed=0;
  for (const job of jobs) {
    try { if (await processJob(c,job)==='sent') sent++; else failed++; }
    catch { failed++; } // The lease expires; no customer information is logged.
  }
  return json({ok:true, claimed:jobs.length, sent, failed});
});
