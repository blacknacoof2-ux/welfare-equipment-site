import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const root = path.resolve(import.meta.dirname, '..');
const source = fs.readFileSync(path.join(root, 'supabase/functions/send-intake-alert/index.ts'), 'utf8');
const sql = fs.readFileSync(path.join(root, 'supabase/sql/intake-email-outbox.sql'), 'utf8');
const config = fs.readFileSync(path.join(root, 'supabase/config.toml'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;
const id = 'AC-20261015-AABBCCDD';
const job = { id:'job-uuid', request_id:id, submitted_at:'2026-10-15T00:00:00Z', product_count:2, lease_token:'lease-uuid' };
function fixture(overrides={}, provider={status:200, id:'msg_sample_12345678'}) {
  const env = { INTAKE_EMAIL_ENABLED:'true', INTAKE_EMAIL_WORKER_SECRET:'s'.repeat(32),
    RESEND_API_KEY:'test_key', INTAKE_EMAIL_FROM:'alerts@example.com',
    INTAKE_EMAIL_TO:'atomcare@naver.com', SUPABASE_URL:'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY:'test_role', ...overrides };
  let handler; const calls=[]; let claimed=false;
  const fetch = async (url, opts) => {
    const body = JSON.parse(opts.body);
    calls.push({url,headers:opts.headers,body});
    if (url.endsWith('/rpc/claim_intake_email_batch')) {if (claimed) return Response.json([]); claimed=true; return Response.json([job]);}
    if (url.includes('/rpc/')) return Response.json(true);
    if (url==='https://api.resend.com/emails') {
      return Response.json(provider.body ?? {id:provider.id}, {status:provider.status});
    }
    throw Error('Unexpected URL');
  };
  const context=vm.createContext({Request,Response,AbortSignal,Date,Intl,JSON,Math,Number,String,Error,fetch,
    Deno:{env:{get:(key)=>env[key]},serve:(h)=>{handler=h;}}});
  vm.runInContext(compiled,context,{filename:'send-intake-alert.js'});
  return {calls, invoke:(secret=env.INTAKE_EMAIL_WORKER_SECRET)=>handler(new Request('https://example.com/',{
    method:'POST', headers:secret?{'x-atomcare-worker-secret':secret}:{}}))};
}
test('SQL contract: trigger only inserts, RLS and EXECUTE grants restricted',()=>{
  assert.match(sql,/AFTER INSERT ON public\.consultations/);
  assert.match(sql,/UNIQUE \(intake_id, event_type\)/);
  assert.match(sql,/FOR UPDATE SKIP LOCKED/);
  assert.match(sql,/ENABLE ROW LEVEL SECURITY/);
  for(const method of ['claim_intake_email_batch','complete_intake_email','fail_intake_email']){
    assert.match(sql,new RegExp('REVOKE ALL ON FUNCTION public\\.'+method));
    assert.match(sql,new RegExp('GRANT EXECUTE ON FUNCTION public\\.'+method+'.* TO service_role'));
  }
  assert.match(config,/\[functions\.send-intake-alert\][\s\S]*verify_jwt = false/);
  assert.doesNotMatch(sql,/\b(INSERT INTO|UPDATE) public\.consultations\b/i);
});
test('Missing enable flag fails closed without any RPC or email',async()=>{
  const f=fixture({INTAKE_EMAIL_ENABLED:'false'});
  const res=await f.invoke();assert.equal(res.status,503);assert.equal(f.calls.length,0);
});
test('Wrong recipient fails closed without any RPC or email',async()=>{
  const f=fixture({INTAKE_EMAIL_TO:'other@example.com'});
  const res=await f.invoke();assert.equal(res.status,503);assert.equal(f.calls.length,0);
});
test('Bad worker token rejects before database and provider',async()=>{
  const f=fixture();const res=await f.invoke('incorrect');
  assert.equal(res.status,401);assert.equal(f.calls.length,0);
});
test('Valid request sends minimal metadata and records provider id',async()=>{
  const f=fixture();const res=await f.invoke();
  assert.equal(res.status,200);
  const result=await res.json(); assert.equal(result.sent,1);
  assert.equal(f.calls.filter(x=>x.url==='https://api.resend.com/emails').length,1);
  const email=f.calls.find(x=>x.url==='https://api.resend.com/emails');
  assert.deepEqual(Array.from(email.body.to),['atomcare@naver.com']);
  assert.equal(email.headers['Idempotency-Key'],'intake-email/'+id);
  const payload=JSON.stringify(email.body);
  for (const forbidden of ['care_number','birth_date','phone','address','certificate','beneficiary_name','applicant_name']){
    assert.ok(!payload.includes(forbidden),'Private field leaked: '+forbidden);
  }
  assert.ok(f.calls.some(x=>x.url.endsWith('/rpc/complete_intake_email') && x.body.p_provider_id==='msg_sample_12345678'));
});
test('Resend 429 retries with same lease and no completion',async()=>{
  const f=fixture({}, {status:429});
  const res=await f.invoke();assert.equal((await res.json()).failed,1);
  assert.ok(f.calls.some(x=>x.url.endsWith('/rpc/fail_intake_email') && x.body.p_error_code==='RESEND_HTTP_429'));
  assert.ok(!f.calls.some(x=>x.url.endsWith('/rpc/complete_intake_email')));
});
test('Missing provider message id is not recorded as sent',async()=>{
  const f=fixture({}, {status:200,body:{}});
  const res=await f.invoke();assert.equal((await res.json()).failed,1);
  assert.ok(f.calls.some(x=>x.url.endsWith('/rpc/fail_intake_email') && x.body.p_error_code==='RESEND_NO_MESSAGE_ID'));
});
test('Claim once -> second invocation does not send twice',async()=>{
  const f=fixture(); await f.invoke();const second=await f.invoke();
  assert.equal((await second.json()).claimed,0);
  assert.equal(f.calls.filter(x=>x.url==='https://api.resend.com/emails').length,1);
});
