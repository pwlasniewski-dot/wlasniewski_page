import test from 'node:test';
import assert from 'node:assert/strict';
import { isTrustedAdminOrigin } from '../../src/lib/auth/admin-origin';

const prod = { nodeEnv: 'production', context: 'production' };
const internal = 'http://localhost:3000';
function request(origin: string | null, target = internal, extra: Record<string, string> = {}) {
  return { headers: new Headers({ ...(origin === null ? {} : { origin }), ...extra }), nextUrl: { origin: target } };
}
test('canonical HTTPS admin origin works with an internal Netlify Next URL', () => {
  for (const origin of ['https://wlasniewski.pl', 'https://www.wlasniewski.pl']) {
    assert.equal(isTrustedAdminOrigin(request(origin), prod), true);
    assert.equal(isTrustedAdminOrigin(request(origin, 'https://internal.netlify.app'), prod), true);
  }
});
test('missing, opaque, foreign, malformed, path, userinfo and protocol/port changes fail closed', () => {
  for (const origin of [null, 'null', '', 'https://evil.test', 'http://wlasniewski.pl', 'https://wlasniewski.pl:444', 'https://wlasniewski.pl/', 'https://wlasniewski.pl/path', 'https://wlasniewski.pl?x=1', 'https://wlasniewski.pl#x', 'https://user@wlasniewski.pl', 'https://wlasniewski.pl.evil.test', 'https://admin.wlasniewski.pl', 'https://wlasniewski.pl, https://evil.test']) {
    assert.equal(isTrustedAdminOrigin(request(origin), prod), false, String(origin));
  }
});
test('Host and forwarded headers cannot add a trusted origin, even when the Next URL matches', () => {
  assert.equal(isTrustedAdminOrigin(request('https://evil.test', 'https://evil.test', {
    host: 'wlasniewski.pl', 'x-forwarded-host': 'wlasniewski.pl', 'x-forwarded-proto': 'https', forwarded: 'host=wlasniewski.pl;proto=https',
  }), prod), false);
  assert.equal(isTrustedAdminOrigin(request('https://evil.test', internal, { host: 'evil.test', 'x-forwarded-host': 'evil.test' }), prod), false);
});
test('production does not trust previews, branches, other Netlify sites or local origins', () => {
  for (const origin of ['https://deploy-preview-91--helpful-axolotl-cc1cbb.netlify.app', 'https://main--helpful-axolotl-cc1cbb.netlify.app', 'https://deploy-preview-91--other.netlify.app', 'http://localhost:3000', 'http://127.0.0.1:3000']) assert.equal(isTrustedAdminOrigin(request(origin, origin), prod), false);
});
test('preview context trusts only this project, narrowed to the exact deploy URL when supplied', () => {
  const origin = 'https://deploy-preview-91--helpful-axolotl-cc1cbb.netlify.app';
  const env = { nodeEnv: 'production', context: 'deploy-preview' };
  assert.equal(isTrustedAdminOrigin(request(origin), env), true);
  for (const foreign of ['https://deploy-preview-91--other.netlify.app', `${origin}.evil.test`, 'https://wlasniewski.pl', 'https://feature--helpful-axolotl-cc1cbb.netlify.app']) assert.equal(isTrustedAdminOrigin(request(foreign), env), false);
  assert.equal(isTrustedAdminOrigin(request(origin), { ...env, deployPrimeUrl: origin }), true);
  assert.equal(isTrustedAdminOrigin(request(origin), { ...env, deployPrimeUrl: 'https://deploy-preview-92--helpful-axolotl-cc1cbb.netlify.app' }), false);
});
test('branch context allows only the verified main alias, not arbitrary branch names', () => {
  const env = { nodeEnv: 'production', context: 'branch-deploy' };
  assert.equal(isTrustedAdminOrigin(request('https://main--helpful-axolotl-cc1cbb.netlify.app'), env), true);
  assert.equal(isTrustedAdminOrigin(request('https://evil--helpful-axolotl-cc1cbb.netlify.app'), env), false);
});
test('local development/test require exact loopback origin and port; absent NODE_ENV is not development', () => {
  for (const nodeEnv of ['development', 'test']) {
    for (const origin of ['http://localhost:3000', 'http://127.0.0.1:3001', 'http://[::1]:3002']) assert.equal(isTrustedAdminOrigin(request(origin, origin), { nodeEnv }), true);
    assert.equal(isTrustedAdminOrigin(request('http://localhost:3001', 'http://localhost:3000'), { nodeEnv }), false);
    assert.equal(isTrustedAdminOrigin(request('https://evil.test', 'https://evil.test'), { nodeEnv }), false);
    assert.equal(isTrustedAdminOrigin(request('https://wlasniewski.pl'), { nodeEnv }), false);
  }
  assert.equal(isTrustedAdminOrigin(request('http://localhost:3000'), {}), false);
});
