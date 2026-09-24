import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectSandbox, boundedJson, sandboxConfigured } from '../../src/lib/fulfillment/prodigi-sandbox';

const item = { sku: 'GLOBAL-CAN-10X10', copies: 2, attributes: { wrap: 'Black' }, assets: [{ printArea: 'default' }] };
const product = { sku: item.sku, description: 'Canvas', attributes: { wrap: ['Black'] }, printAreas: { default: { required: true } }, variants: [{ attributes: { wrap: 'Black' }, shipsTo: ['PL'], printAreaSizes: { default: { horizontalResolution: 1500, verticalResolution: 1500 } } }] };
const quote = { shipmentMethod: 'Standard', costSummary: { items: { amount: '120.00', currency: 'PLN' }, shipping: { amount: '20.00', currency: 'PLN' } }, shipments: [{ carrier: { name: 'Test carrier', service: 'Tracked' }, fulfillmentLocation: { countryCode: 'DE', labCode: 'test' } }] };
const key = 'qa-secret-never-return';
const transport = (body: unknown, status = 200) => (async () => new Response(JSON.stringify(body), { status })) as typeof fetch;

test('POD-S01: no key means no network, flag is configuration not connection', async () => {
  delete process.env.PRODIGI_SANDBOX_API_KEY; assert.equal(sandboxConfigured(), false);
  await assert.rejects(inspectSandbox({ action: 'product', sku: item.sku }, async () => { throw Error('must not call'); }), { code: 'NOT_CONFIGURED' });
  process.env.PRODIGI_SANDBOX_API_KEY = key; assert.equal(sandboxConfigured(), true);
});
test('POD-S02: rejects host, URL, order action, unsafe SKU and invalid quantities before network', async () => {
  for (const request of [{ action: 'orders' }, { action: 'product', sku: '../orders' }, { action: 'product', sku: item.sku, host: 'https://api.prodigi.com' }, { action: 'quote', items: [{ ...item, copies: -1 }] }, { action: 'quote', items: [{ ...item, copies: 1.5 }] }, { action: 'quote', items: [{ ...item, assets: [{ printArea: 'default', url: 'http://127.0.0.1' }] }] }, { action: 'quote', items: Array(11).fill(item) }]) {
    await assert.rejects(inspectSandbox(request, async () => { throw Error('must not call'); }), { code: 'INVALID_INPUT' });
  }
});
test('POD-S03: SKU lookup uses fixed sandbox and server-only secret, sanitized response', async () => {
  const result = await inspectSandbox({ action: 'product', sku: item.sku }, (async (url, init) => {
    assert.equal(url, `https://api.sandbox.prodigi.com/v4.0/products/${item.sku}`);
    assert.equal(init?.method, 'GET'); assert.equal(init?.redirect, 'error'); assert.equal(init?.cache, 'no-store');
    assert.equal((init?.headers as Record<string, string>)['X-API-Key'], key);
    return new Response(JSON.stringify({ outcome: 'Ok', product: { ...product, secret: key }, secret: key }));
  }) as typeof fetch);
  assert.equal(result.action, 'product'); assert.equal(JSON.stringify(result).includes(key), false);
});
test('POD-S04: multi-product quote has PL/PLN, no recipient, photo URL or orders request', async () => {
  const result = await inspectSandbox({ action: 'quote', items: [item, { ...item, copies: 3 }] }, (async (url, init) => {
    assert.equal(url, 'https://api.sandbox.prodigi.com/v4.0/quotes'); assert.equal(init?.method, 'POST');
    const body = JSON.parse(String(init?.body)); assert.equal(body.items.length, 2);
    assert.deepEqual(Object.keys(body).sort(), ['currencyCode', 'destinationCountryCode', 'items']);
    assert.equal(body.currencyCode, 'PLN'); assert.equal(body.destinationCountryCode, 'PL');
    return new Response(JSON.stringify({ outcome: 'Created', quotes: [quote, { ...quote, shipmentMethod: 'Express' }] }));
  }) as typeof fetch);
  assert.equal(result.action, 'quote'); if (result.action === 'quote') assert.equal(result.quotes.length, 2);
});
test('POD-S05: warnings block acceptance even on HTTP 200', async () => {
  for (const body of [{ outcome: 'CreatedWithIssues', quotes: [quote] }, { outcome: 'Created', quotes: [quote], issues: [{ description: key }] }]) {
    await assert.rejects(inspectSandbox({ action: 'quote', items: [item] }, transport(body)), { code: 'PROVIDER_ISSUES' });
  }
});
test('POD-S06: invalid, empty, foreign-currency and missing costs do not become zero', async () => {
  for (const quotes of [[], [null], [{ ...quote, costSummary: {} }], [{ ...quote, costSummary: { ...quote.costSummary, items: { amount: '5.00', currency: 'EUR' } } }], [{ ...quote, costSummary: { ...quote.costSummary, items: { amount: '-5', currency: 'PLN' } } }]]) {
    await assert.rejects(inspectSandbox({ action: 'quote', items: [item] }, transport({ outcome: 'Ok', quotes })), { code: 'INVALID_RESPONSE' });
  }
});
test('POD-S07: mismatched SKU is not shown as requested product', async () => {
  await assert.rejects(inspectSandbox({ action: 'product', sku: item.sku }, transport({ outcome: 'Ok', product: { ...product, sku: 'OTHER' } })), { code: 'INVALID_RESPONSE' });
});
test('POD-S08: provider credentials, rate limits, failures never expose body or key', async () => {
  for (const [status, code] of [[401, 'CREDENTIALS'], [403, 'CREDENTIALS'], [429, 'RATE_LIMIT'], [500, 'PROVIDER_ERROR']] as const) {
    await assert.rejects(inspectSandbox({ action: 'product', sku: item.sku }, transport({ error: key }, status)), (error: any) => error.code === code && !error.message.includes(key));
  }
});
test('POD-S09: transport failure gives controlled error without retry or secret', async () => {
  let calls = 0;
  await assert.rejects(inspectSandbox({ action: 'product', sku: item.sku }, async () => { calls++; throw Error(key); }), { code: 'TRANSPORT' });
  assert.equal(calls, 1);
});
test('POD-S10: JSON byte limit handles chunked bodies and invalid UTF8', async () => {
  assert.deepEqual(await boundedJson(new Response('{"x":1}').body, 7), { x: 1 });
  await assert.rejects(boundedJson(new Response('{"x":1}').body, 6), { code: 'BODY_LIMIT' });
  await assert.rejects(boundedJson(new Response(new Uint8Array([255])).body, 20), { code: 'INVALID_JSON' });
});
test('POD-S11: malformed provider JSON is a provider failure, not a user 400', async () => {
  await assert.rejects(inspectSandbox({ action: 'product', sku: item.sku }, (async () => new Response('not-json')) as typeof fetch), { code: 'INVALID_RESPONSE', status: 502 });
});
test('POD-S12: QA correction — missing shipping, zero product cost and nested issues rejected', async () => {
  for (const invalid of [{ ...quote, shipments: [] }, { ...quote, issues: [{}] }, { ...quote, costSummary: { ...quote.costSummary, items: { amount: '0', currency: 'PLN' } } }]) {
    await assert.rejects(inspectSandbox({ action: 'quote', items: [item] }, transport({ outcome: 'Created', quotes: [invalid] })), { code: 'INVALID_RESPONSE' });
  }
});
test('POD-S13: QA correction — books and additional print areas need separate qualification', async () => {
  for (const invalid of [{ ...item, sku: 'BOOK-FE-A4-P-HARD-G' }, { ...item, assets: [{ printArea: 'default' }, { printArea: 'back' }] }]) {
    await assert.rejects(inspectSandbox({ action: 'quote', items: [invalid] }, async () => { throw Error('must not call'); }), { code: 'NOT_IN_PILOT' });
  }
});
