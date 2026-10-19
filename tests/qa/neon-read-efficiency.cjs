// Real handlers with an in-memory DB/cache; no production connection or writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (id, parent, ...rest) {
  return resolve.call(this, id.startsWith('@/') ? path.join(process.cwd(), 'src', id.slice(2)) : id, parent, ...rest);
};
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText, file);
const { NextRequest, NextResponse } = require('next/server');
let menuReads = 0, settingsReads = 0, failMenu = false, authorized = true, title = 'Before', promo = true;
const caches = [];
const db = {
  page: { findUnique: async () => null, findMany: async () => [{ id: 1, slug: 'test', title, menu_title: title, children: [] }], update: async ({ data }) => { title = data.menu_title; } },
  menuItem: { findMany: async () => { menuReads++; if (failMenu) throw new Error('offline'); return []; } },
  setting: {
    findFirst: async () => { settingsReads++; return { split_payment_deposit_percent: 50 }; },
    findMany: async ({ select }) => { settingsReads++; assert.deepEqual(select, { setting_key: true, setting_value: true }); return [{ setting_key: 'footer_config', setting_value: '{"hello":1}' }]; },
  },
  challengeSetting: { findMany: async () => { settingsReads++; return [{ setting_key: 'module_enabled', setting_value: 'true' }]; } },
  promoCode: { findMany: async () => { settingsReads++; return promo ? [{ code: 'NOW', show_in_banner: true, max_usage: null, discount_value: 10 }] : []; } },
  $transaction: async items => Promise.all(items),
};
const load = Module._load;
Module._load = function (id) {
  if (id === '@/lib/db/prisma') return { __esModule: true, default: db };
  if (id === '@/lib/auth/middleware') return { requireAdminAuth: async () => authorized ? null : NextResponse.json({}, { status: 401 }) };
  if (id === 'next/cache') return {
    unstable_cache: (fn, keys, config) => {
      assert.equal(config.revalidate, 60); const cache = new Map(); caches.push(cache);
      return async (...args) => { const key = JSON.stringify(args); if (cache.has(key)) return cache.get(key); const result = await fn(...args); cache.set(key, result); return result; };
    },
    revalidateTag: tag => { assert.equal(tag, 'public-menu'); caches.forEach(cache => cache.clear()); },
  };
  return load.apply(this, arguments);
};
const menu = require('../../src/app/api/menu/route.ts');
const settings = require('../../src/app/api/settings/public/route.ts');
const req = type => new NextRequest(`https://test.local/api/menu?type=${type}`);
(async () => {
  let result = await (await menu.GET(req('b2c'))).json();
  assert.ok(Array.isArray(result)); assert.ok(result.some(item => item.title === 'Before'));
  await menu.GET(req('b2c')); assert.equal(menuReads, 1);
  await menu.GET(req('b2b')); assert.equal(menuReads, 2); // separate cache key
  const body = { items: [{ id: 1, menu_title: 'After', menu_order: 1, is_in_menu: true }] };
  const put = () => new NextRequest('https://test.local/api/menu', { method: 'PUT', body: JSON.stringify(body) });
  authorized = false; assert.equal((await menu.PUT(put())).status, 401); assert.equal(title, 'Before');
  authorized = true; assert.equal((await menu.PUT(put())).status, 200);
  result = await (await menu.GET(req('b2c'))).json(); assert.ok(result.some(item => item.title === 'After'));
  caches.forEach(c => c.clear()); failMenu = true; await menu.GET(req('b2b')); failMenu = false;
  const before = menuReads; await menu.GET(req('b2b')); assert.equal(menuReads, before + 1); // errors not cached
  const a = await (await settings.GET(req('b2c'))).json(); assert.equal(settingsReads, 4);
  assert.equal(a.settings.footer_config, '{"hello":1}'); assert.equal(a.settings.challenge.module_enabled, true); assert.equal(a.settings.challenge.fomo_hours, 24);
  assert.equal(a.settings.promo_code, 'NOW'); promo = false;
  const b = await (await settings.GET(req('b2c'))).json(); assert.equal(b.settings.promo_code, null); assert.equal(settingsReads, 8);
  let count = 0, finish;
  global.fetch = () => { count++; return new Promise(resolve => { finish = resolve; }); };
  const { fetchPublicSettings } = require('../../src/lib/public-settings-client.ts');
  const controller = new AbortController();
  const p1 = fetchPublicSettings(); const p2 = fetchPublicSettings();
  const cancelled = fetchPublicSettings({ signal: controller.signal }).catch(e => e.name); controller.abort();
  assert.equal(count, 1); finish(new Response('{"value":1}'));
  const [r1, r2] = await Promise.all([p1, p2]); assert.deepEqual(await r1.json(), await r2.json()); assert.equal(await cancelled, 'AbortError');
  const p3 = fetchPublicSettings(); assert.equal(count, 2); finish(new Response('{}')); await p3;
  global.fetch = async () => { throw new Error('network'); }; await assert.rejects(fetchPublicSettings());
  global.fetch = async () => new Response('{}'); assert.equal((await fetchPublicSettings()).status, 200);
  console.log('PASS: menu cache, isolation, invalidation, auth, outage recovery; live promotions and batched settings; concurrent clients, cancellation and retry.');
})().catch(error => { console.error(error); process.exitCode = 1; });
