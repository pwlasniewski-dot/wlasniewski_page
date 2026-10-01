const h = require('./gallery-shop-dom.cjs');
const { assert, check, mount, reset, field, set, button, click, act, flush } = h;
const Module = require('node:module');
const { NextRequest, NextResponse } = require('next/server');
let allowed = true, limited = false, providerCalls = 0;
const original = Module._load;
Module._load = function(name, ...args) {
  if (name === '@/lib/auth/middleware') return { withAuth: async (_req, fn) => allowed ? fn() : NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (name === '@/lib/rate-limit') return { getClientIp: () => 'qa', rateLimit: () => ({ ok: !limited }) };
  return original.call(this, name, ...args);
};
const route = require('../../src/app/api/admin/gallery-shop/prodigi/route.ts');
const { ProdigiSandboxDiagnostics: Panel, default: CollapsedPanel } = require('../../src/components/admin/ProdigiSandboxPanel.tsx');
const product = { sku: 'GLOBAL-CAN-10X10', description: 'Canvas', attributes: { wrap: ['Black'] }, printAreas: { default: { required: true } }, variants: [{ attributes: { wrap: 'Black' }, shipsTo: ['PL'], printAreaSizes: { default: { horizontalResolution: 1500, verticalResolution: 1500 } } }] };
const quote = { shipmentMethod: 'Standard', costSummary: { items: { amount: '120.00', currency: 'PLN' }, shipping: { amount: '20.00', currency: 'PLN' } }, shipments: [{ carrier: { name: 'Test', service: 'Tracked' }, fulfillmentLocation: { countryCode: 'DE', labCode: 'test' } }] };
const body = { action: 'product', sku: product.sku };
function request(value = body, options = {}) { return new NextRequest('http://localhost/api/admin/gallery-shop/prodigi', { method: 'POST', headers: { origin: 'http://localhost', 'content-type': 'application/json', ...options.headers }, body: typeof value === 'string' ? value : JSON.stringify(value) }); }
(async () => {
  process.env.PRODIGI_SANDBOX_API_KEY = 'qa-never-return';
  global.fetch = async () => { providerCalls++; return new Response(JSON.stringify({ outcome: 'Ok', product })); };
  await check('POD-A01 auth before config or provider', async () => { allowed = false; assert.equal((await route.GET(request())).status, 401); assert.equal((await route.POST(request())).status, 401); assert.equal(providerCalls, 0); allowed = true; });
  await check('POD-A02 config says configured, not connected, no secret', async () => { const response = await route.GET(request()); const data = await response.json(); assert.equal(data.configured, true); assert.equal(data.ordersEnabled, false); assert.equal(data.connected, undefined); assert.equal(JSON.stringify(data).includes('qa-never-return'), false); assert.match(response.headers.get('cache-control'), /no-store/); });
  await check('POD-A03 Origin and JSON checks before network', async () => { assert.equal((await route.POST(request(body, { headers: { origin: 'https://evil.test' } }))).status, 403); assert.equal((await route.POST(request(body, { headers: { 'content-type': 'text/plain' } }))).status, 415); assert.equal(providerCalls, 0); });
  await check('POD-A04 malformed and streamed oversized body', async () => { assert.equal((await route.POST(request('{'))).status, 400); assert.equal((await route.POST(request(' '.repeat(16385)))).status, 413); assert.equal(providerCalls, 0); });
  await check('POD-A05 rate limit and missing key', async () => { limited = true; assert.equal((await route.POST(request())).status, 429); limited = false; delete process.env.PRODIGI_SANDBOX_API_KEY; assert.equal((await route.POST(request())).status, 503); assert.equal(providerCalls, 0); process.env.PRODIGI_SANDBOX_API_KEY = 'qa-never-return'; });
  await check('POD-A06 actual handler -> adapter -> sanitized provider result', async () => { const response = await route.POST(request()); assert.equal(response.status, 200); assert.equal(providerCalls, 1); assert.equal((await response.json()).product.sku, product.sku); });
  let configured = false, failQuote = false, missingArea = false, posts = [];
  global.fetch = async (_url, init) => {
    if (init?.method !== 'POST') return new Response(JSON.stringify({ configured }));
    const payload = JSON.parse(init.body); posts.push(payload);
    if (payload.action === 'product') return new Response(JSON.stringify({ success: true, checkedAt: '2026-09-24T12:00:00Z', product: missingArea ? { ...product, printAreas: { ...product.printAreas, back: { required: true } } } : product }));
    return new Response(JSON.stringify(failQuote ? { error: 'Awaria testowa' } : { success: true, quotes: [quote], checkedAt: '2026-09-24T12:00:00Z' }), { status: failQuote ? 502 : 200 });
  };
  await check('POD-U00 diagnostics stays idle until opened', async () => { await mount(CollapsedPanel); assert.equal(document.querySelector('input'), null); assert.equal(document.querySelector('[role="alert"]'), null); await reset(); });
  await check('POD-U01 unconfigured blocks queries', async () => { await mount(Panel); assert.equal(button('Sprawdź produkt').disabled, true); assert.match(document.body.textContent, /PRODIGI_SANDBOX_API_KEY/); await reset(); });
  await check('POD-U02 lookup -> quantity -> quote uses full variant and displays sandbox costs', async () => { configured = true; await mount(Panel); await click(button('Sprawdź produkt')); await set(field('Ilość'), '3'); await click(button('Pobierz wycenę testową')); assert.equal(posts.at(-1).items[0].copies, 3); assert.deepEqual(posts.at(-1).items[0].attributes, { wrap: 'Black' }); assert.match(document.body.textContent, /120.00 PLN/); assert.match(document.body.textContent, /nie potwierdzony pełny koszt|nie jest|a nie potwierdzony/); });
  await check('POD-U03 failure clears old quote and allows retry', async () => { failQuote = true; await click(button('Pobierz wycenę testową')); assert.equal(document.body.textContent.includes('120.00 PLN'), false); assert.match(document.querySelector('[role="alert"]').textContent, /Awaria/); failQuote = false; await click(button('Pobierz wycenę testową')); assert.match(document.body.textContent, /120.00 PLN/); });
  await check('POD-U04 changing SKU invalidates product and quote', async () => { await set(field('SKU z katalogu Prodigi'), 'GLOBAL-FAP-10X10'); assert.equal(document.body.textContent.includes('120.00 PLN'), false); assert.equal([...document.querySelectorAll('button')].some(b => b.textContent === 'Pobierz wycenę testową'), false); await reset(); });
  await check('POD-U05 QA correction: incomplete required print areas block quote', async () => { missingArea = true; await mount(Panel); await click(button('Sprawdź produkt')); const before = posts.length; await click(button('Pobierz wycenę testową')); assert.equal(posts.length, before); assert.match(document.querySelector('[role="alert"]').textContent, /kompletu/); await reset(); });
  await check('POD-U06 QA correction: stalled initial config has timeout', async () => {
    const nativeTimeout = global.setTimeout;
    global.setTimeout = (fn, delay, ...args) => nativeTimeout(fn, delay === 20000 ? 1 : delay, ...args);
    global.fetch = async (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(Error('abort')), { once: true }));
    try { await mount(Panel); await flush(); assert.match(document.querySelector('[role="alert"]').textContent, /odczytać konfiguracji/); await reset(); }
    finally { global.setTimeout = nativeTimeout; }
  });
  console.log(`${h.log.length} sandbox route/DOM scenarios PASS; auth and transport simulated, no external call.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
