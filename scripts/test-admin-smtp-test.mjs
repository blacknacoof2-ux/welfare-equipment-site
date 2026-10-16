import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const lib = fs.readFileSync('lib/admin-smtp-test.ts', 'utf8');
const route = fs.readFileSync('app/api/admin/smtp-test/route.ts', 'utf8');
for (const [filename, source] of [['SMTP library', lib], ['admin route', route]]) {
  test(filename + ' transpiles', () => {
    const result = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      reportDiagnostics: true,
    });
    assert.equal(result.diagnostics?.length || 0, 0);
  });
}
test('SMTP test is separately gated and sends no customer data', () => {
  assert.match(lib, /ADMIN_SMTP_TEST_ENABLED !== 'true'/);
  assert.match(lib, /smtp\.naver\.com/);
  assert.match(lib, /requireTLS: true/);
  assert.match(lib, /SMTP_TEST_CONFIG_INVALID/);
  assert.ok(!lib.includes('createIntake('));
  assert.ok(!lib.includes('CONSULTATION_SMTP_ENABLED'));
  assert.ok(!lib.includes('careNumber'));
  assert.ok(!lib.includes('applicantName'));
});
test('admin route authenticates and requires explicit origin, confirmation and persistent quota', () => {
  assert.match(route, /getCurrentAdminSession/);
  assert.match(route, /https:\/\/welfare\.atomcare\.co\.kr/);
  assert.match(route, /SEND_ONE_ADMIN_SMTP_TEST/);
  assert.match(route, /limit\.source !== 'distributed'/);
  assert.match(route, /limit\.allowed/);
  assert.ok(!route.includes('createIntake('));
  assert.ok(!route.includes('updateIntake('));
});
