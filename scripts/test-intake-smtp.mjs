import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const root = path.resolve(import.meta.dirname, '..');
const code = fs.readFileSync(path.join(root, 'lib/intake-email-smtp.ts'),'utf8');
const compiled = ts.transpileModule(code,{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}
}).outputText;
const sample={requestId:'AC-20261015-ABCDEF12',submittedAt:'2026-10-15T06:00:00Z',productCount:2};
function createHarness(config={}) {
  const sent=[];let closed=0;
  const smtp={
    createTransport(options){assert.equal(options.host,'smtp.naver.com');assert.equal(options.port,587);
      assert.equal(options.requireTLS,true);assert.equal(options.tls.rejectUnauthorized,true);
      return {async sendMail(message){sent.push(message);return {accepted:['atomcare@naver.com']};},close(){closed++;}};
    },
  };
  const env={CONSULTATION_SMTP_ENABLED:'true',SMTP_HOST:'smtp.naver.com',SMTP_PORT:'587',
    SMTP_USER:'atomcare@naver.com',SMTP_PASS:'fake-password-123',INQUIRY_TO_EMAIL:'atomcare@naver.com',...config};
  const exports={};
  const context=vm.createContext({exports,process:{env},require:(name)=>{assert.equal(name,'nodemailer');return {__esModule:true,default:smtp};},Intl,Date,Number,Error,console});
  vm.runInContext(compiled,context);
  return {api:exports,sent,get closed(){return closed;}};
}

test('SMTP feature is disabled unless explicitly enabled',async()=>{
  const h=createHarness({CONSULTATION_SMTP_ENABLED:''});
  assert.equal(await h.api.sendIntakeEmailNotification(sample),'disabled');
  assert.equal(h.sent.length,0);
});
test('SMTP authentication and recipient must be the approved Naver account',async()=>{
  for(const x of [
    {SMTP_HOST:'smtp.attacker.net'}, {SMTP_PORT:'25'}, {SMTP_USER:'attacker@naver.com'},
    {INQUIRY_TO_EMAIL:'someone@example.com'}, {SMTP_PASS:''}
  ]) {
    const h=createHarness(x);
    await assert.rejects(()=>h.api.sendIntakeEmailNotification(sample),/SMTP_CONFIGURATION_INVALID/);
    assert.equal(h.sent.length,0);
  }
});
test('Valid SMTP alert only has request metadata, not applicant personal data',async()=>{
  const h=createHarness();
  assert.equal(await h.api.sendIntakeEmailNotification(sample),'sent');
  assert.equal(h.sent.length,1); assert.equal(h.closed,1);
  const message=h.sent[0];
  assert.equal(message.to,'atomcare@naver.com');
  assert.equal(message.from.address,'atomcare@naver.com');
  assert.match(message.text,/AC-20261015-ABCDEF12/);
  for(const word of ['care_number','birth_date','address','phone','certificate','beneficiaryName']) {
    assert.ok(!message.text.includes(word));
  }
});
test('Invalid request metadata is rejected before any SMTP send',async()=>{
  const h=createHarness();
  await assert.rejects(()=>h.api.sendIntakeEmailNotification({...sample,requestId:'\nCc: attacker@example.com'}),/SMTP_NOTIFICATION_DATA_INVALID/);
  assert.equal(h.sent.length,0);
});
test('Intake POST stores before SMTP attempt, and never sends care number via SMTP',()=>{
  const route=fs.readFileSync(path.join(root,'app/api/consultations/route.ts'),'utf8');
  assert.ok(route.indexOf('await createIntake(')<route.indexOf('await sendIntakeEmailNotification('));
  const call=route.split('await sendIntakeEmailNotification(')[1].split(');')[0];
  assert.ok(!/careNumber|phone|certificate|applicantName|beneficiaryName/.test(call));
  assert.match(route,/SMTP_SEND_FAILED/);
});
