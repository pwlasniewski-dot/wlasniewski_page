const h = require('./gallery-shop-dom.cjs');
const { assert, check, mount, reset, field, set, button, click, act, flush } = h;
const Module = require('node:module');
const { NextRequest, NextResponse } = require('next/server');
process.env.NODE_ENV = 'test';
let allowed = true, limited = false, providerCalls = 0, convertedQuoteResponse;
const original = Module._load;
Module._load = function(name, ...args) {
  if (name === '@/lib/auth/middleware') return { withAuth: async (_req, fn) => allowed ? fn() : NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (name === '@/lib/rate-limit') return { getClientIp: () => 'qa', rateLimit: () => ({ ok: !limited }) };
  return original.call(this, name, ...args);
};
const route = require('../../src/app/api/admin/gallery-shop/prodigi/route.ts');
const { ProdigiSandboxDiagnostics: Panel, default: CollapsedPanel } = require('../../src/components/admin/ProdigiSandboxPanel.tsx');
const product = { sku: 'GLOBAL-CAN-10X10', description: 'Canvas', attributes: { wrap: ['Black'] }, printAreas: { default: { required: true } }, variants: [{ attributes: { wrap: 'Black' }, shipsTo: ['PL'], printAreaSizes: { default: { horizontalResolution: 1500, verticalResolution: 1500 } } }] };
const quote = { shipmentMethod: 'Standard', costSummary: { items: { amount: '120.00', currency: 'EUR' }, shipping: { amount: '20.00', currency: 'EUR' }, branding: { amount: '0', currency: 'EUR' }, totalTax: { amount: '28.00', currency: 'EUR' }, totalCost: { amount: '168.00', currency: 'EUR' } }, shipments: [{ carrier: { name: 'Test', service: 'Tracked' }, fulfillmentLocation: { countryCode: 'DE', labCode: 'test' } }] };
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
  await check('POD-A07 external production origin works behind Netlify while foreign forwarded origin is rejected', async () => {
    const previousContext = process.env.CONTEXT;
    process.env.NODE_ENV = 'production'; process.env.CONTEXT = 'production';
    try {
      assert.equal((await route.POST(request(body, { headers: { origin: 'https://wlasniewski.pl' } }))).status, 200);
      const before = providerCalls;
      assert.equal((await route.POST(request(body, { headers: { origin: 'https://evil.test', host: 'wlasniewski.pl', 'x-forwarded-host': 'wlasniewski.pl' } }))).status, 403);
      assert.equal(providerCalls, before);
    } finally { process.env.NODE_ENV = 'test'; if (previousContext === undefined) delete process.env.CONTEXT; else process.env.CONTEXT = previousContext; }
  });
  await check('POD-A08 provider HTTP status reaches the UI error field without the raw body', async () => {
    global.fetch = async () => new Response(JSON.stringify({ error: 'qa-never-return' }), { status: 404 });
    const response = await route.POST(request()); const data = await response.json();
    assert.equal(response.status, 502); assert.equal(data.providerStatus, 404);
    assert.equal(data.code, 'PROVIDER_NOT_FOUND'); assert.match(data.error, /HTTP 404/);
    assert.equal(JSON.stringify(data).includes('qa-never-return'), false);
  });
  await check('POD-A09 quote adds server PLN estimates from credential-free NBP request', async () => {
    const calls = [];
    global.fetch = async (url, init) => {
      calls.push(url);
      if (String(url).startsWith('https://api.sandbox.prodigi.com/')) return new Response(JSON.stringify({ outcome: 'Created', quotes: [quote] }));
      assert.equal(url, 'https://api.nbp.pl/api/exchangerates/rates/a/eur/?format=json');
      assert.deepEqual(init.headers, { Accept: 'application/json' });
      return new Response(JSON.stringify({ table: 'A', code: 'EUR', rates: [{ no: '190/A/NBP/2026', effectiveDate: new Date().toISOString().slice(0, 10), mid: 4.25 }] }));
    };
    const response = await route.POST(request({ action: 'quote', items: [{ sku: product.sku, copies: 1, attributes: { wrap: 'Black' }, assets: [{ printArea: 'default' }] }] }));
    assert.equal(response.status, 200); convertedQuoteResponse = await response.json();
    assert.equal(calls.length, 2); assert.equal(convertedQuoteResponse.fx.available, true);
    assert.equal(convertedQuoteResponse.quotes[0].costSummary.items.amount, '120.00');
    assert.equal(convertedQuoteResponse.quotes[0].costSummary.items.currency, 'EUR');
    assert.equal(convertedQuoteResponse.plnEstimates[0].items.amount, '510.00');
    assert.equal(convertedQuoteResponse.plnEstimates[0].totalCost.amount, '714.00');
  });
  await check('POD-A10 NBP outage preserves successful original quote', async () => {
    global.fetch = async url => String(url).startsWith('https://api.sandbox.prodigi.com/') ? new Response(JSON.stringify({ outcome: 'Created', quotes: [quote] })) : new Response('unavailable', { status: 503 });
    const response = await route.POST(request({ action: 'quote', items: [{ sku: product.sku, copies: 1, attributes: { wrap: 'Black' }, assets: [{ printArea: 'default' }] }] }));
    const data = await response.json(); assert.equal(response.status, 200); assert.equal(data.success, true);
    assert.equal(data.fx.available, false); assert.equal(data.plnEstimates, undefined); assert.equal(data.quotes[0].costSummary.items.currency, 'EUR');
  });
  let configured = false, failQuote = false, missingArea = false, posts = [], fxResponse;

  global.fetch = async (_url, init) => {
    if (init?.method !== 'POST') return new Response(JSON.stringify({ configured }));
    const payload = JSON.parse(init.body); posts.push(payload);
    if (payload.action === 'product') return new Response(JSON.stringify({ success: true, checkedAt: '2026-09-24T12:00:00Z', product: missingArea ? { ...product, printAreas: { ...product.printAreas, back: { required: true } } } : product }));
    return new Response(JSON.stringify(failQuote ? { error: 'Awaria testowa' } : { success: true, quotes: [quote], checkedAt: '2026-09-24T12:00:00Z', ...fxResponse }), { status: failQuote ? 502 : 200 });
  };
  await check('POD-U00 diagnostics stays idle until opened', async () => { await mount(CollapsedPanel); assert.equal(document.querySelector('input'), null); assert.equal(document.querySelector('[role="alert"]'), null); await reset(); });
  await check('POD-U01 unconfigured blocks queries', async () => { await mount(Panel); assert.equal(button('Sprawdź produkt').disabled, true); assert.match(document.body.textContent, /PRODIGI_SANDBOX_API_KEY/); await reset(); });
  await check('POD-U02 lookup -> quantity -> quote uses full variant and displays sandbox costs', async () => { configured = true; await mount(Panel); await click(button('Sprawdź produkt')); await set(field('Ilość'), '3'); await click(button('Pobierz wycenę testową')); assert.equal(posts.at(-1).items[0].copies, 3); assert.deepEqual(posts.at(-1).items[0].attributes, { wrap: 'Black' }); assert.match(document.body.textContent, /120.00 EUR/); assert.match(document.body.textContent, /dostawa: 20.00 EUR/); assert.match(document.body.textContent, /Podatek według API: 28.00 EUR/); assert.match(document.body.textContent, /Suma według API: 168.00 EUR/); assert.equal(/(?:120.00|20.00|28.00|168.00) PLN/.test(document.body.textContent), false); assert.match(document.body.textContent, /nie potwierdzony pełny koszt|nie jest|a nie potwierdzony/); });
  await check('POD-U03 failure clears old quote and allows retry', async () => { failQuote = true; await click(button('Pobierz wycenę testową')); assert.equal(document.body.textContent.includes('120.00 EUR'), false); assert.match(document.querySelector('[role="alert"]').textContent, /Awaria/); failQuote = false; await click(button('Pobierz wycenę testową')); assert.match(document.body.textContent, /120.00 EUR/); });
  await check('POD-U04 changing SKU invalidates product and quote', async () => { await set(field('SKU z katalogu Prodigi'), 'GLOBAL-FAP-10X10'); assert.equal(document.body.textContent.includes('120.00 EUR'), false); assert.equal([...document.querySelectorAll('button')].some(b => b.textContent === 'Pobierz wycenę testową'), false); await reset(); });
  await check('POD-U07 estimates retain EUR and show PLN with rate provenance, not store prices', async () => {
    fxResponse = convertedQuoteResponse;
    await mount(Panel); await click(button('Sprawdź produkt')); await click(button('Pobierz wycenę testową'));
    assert.match(document.body.textContent, /120.00 EUR/); assert.match(document.body.textContent, /Produkty: 510.00 PLN/);
    assert.match(document.body.textContent, /Suma według API: 714.00 PLN/); assert.match(document.body.textContent, /1 EUR = 4.25 PLN/);
    assert.match(document.body.textContent, /190\/A\/NBP\/2026/); assert.match(document.body.textContent, /Nie zmienia cen sklepu/);
  });
  await check('POD-U08 unavailable FX clears PLN while retaining original quote', async () => {
    fxResponse = { fx: { available: false, source: 'NBP', currency: 'EUR', reason: 'stale' } };
    await click(button('Pobierz wycenę testową'));
    assert.match(document.body.textContent, /120.00 EUR/); assert.equal(document.body.textContent.includes('510.00 PLN'), false);
    assert.match(document.body.textContent, /starszy niż 7 dni/); fxResponse = undefined; await reset();
  });
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
