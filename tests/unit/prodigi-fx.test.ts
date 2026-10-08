import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchProdigiFx, prodigiAmountToPln, estimateProdigiCostInPln } from '../../src/lib/fulfillment/prodigi-fx';

const now = new Date('2026-10-03T15:00:00Z');
const response = { table: 'A', code: 'EUR', rates: [{ no: '190/A/NBP/2026', effectiveDate: '2026-10-02', mid: 4.2755 }] };
const transport = (value: unknown, status = 200) => (async () => new Response(JSON.stringify(value), { status })) as typeof fetch;

test('FX01: fixed NBP GET has no Prodigi credential and keeps rate provenance', async () => {
  process.env.PRODIGI_SANDBOX_API_KEY = 'must-not-leave-server';
  const fx = await fetchProdigiFx('EUR', (async (url, init) => {
    assert.equal(url, 'https://api.nbp.pl/api/exchangerates/rates/a/eur/?format=json');
    assert.equal(init?.method, 'GET'); assert.equal(init?.redirect, 'error'); assert.equal(init?.cache, 'no-store');
    assert.deepEqual(init?.headers, { Accept: 'application/json' }); assert.equal(init?.body, undefined);
    return new Response(JSON.stringify(response));
  }) as typeof fetch, now);
  assert.deepEqual(fx, { available: true, source: 'NBP', currency: 'EUR', quoteCurrency: 'PLN', effectiveDate: '2026-10-02', tableNo: '190/A/NBP/2026', mid: '4.2755' });
  assert.deepEqual(estimateProdigiCostInPln({ amount: '37.99', currency: 'EUR' }, fx), {
    amount: '162.43', currency: 'PLN', indicative: true, originalAmount: '37.99', originalCurrency: 'EUR',
    source: 'NBP', effectiveDate: '2026-10-02', tableNo: '190/A/NBP/2026', mid: '4.2755',
  });
});
test('FX02: USD/GBP are allowed; wrong currency, future, invalid and stale dates have no fallback', async () => {
  for (const currency of ['USD', 'GBP'] as const) assert.equal((await fetchProdigiFx(currency, transport({ ...response, code: currency }), now)).available, true);
  for (const value of [
    { ...response, code: 'USD' },
    { ...response, rates: [{ ...response.rates[0], effectiveDate: '2026-10-04' }] },
    { ...response, rates: [{ ...response.rates[0], effectiveDate: '2026-02-30' }] },
    { ...response, rates: [{ ...response.rates[0], mid: 0 }] },
    { ...response, rates: [] },
  ]) assert.equal((await fetchProdigiFx('EUR', transport(value), now)).available, false);
  const stale = await fetchProdigiFx('EUR', transport({ ...response, rates: [{ ...response.rates[0], effectiveDate: '2026-09-25' }] }), now);
  assert.deepEqual(stale, { available: false, source: 'NBP', currency: 'EUR', reason: 'stale' });
  assert.equal(estimateProdigiCostInPln({ amount: '18', currency: 'EUR' }, stale), null);
  assert.equal((await fetchProdigiFx('EUR', transport({ ...response, rates: [{ ...response.rates[0], effectiveDate: '2026-09-26' }] }), now)).available, true);
});
test('FX03: HTTP, transport, malformed and oversized responses return unavailable', async () => {
  for (const fetcher of [transport({}, 404), transport({}, 500), (async () => { throw Error('private'); }) as typeof fetch, (async () => new Response('invalid')) as typeof fetch, (async () => new Response(' '.repeat(16_385))) as typeof fetch]) {
    const fx = await fetchProdigiFx('EUR', fetcher, now);
    assert.deepEqual(fx, { available: false, source: 'NBP', currency: 'EUR', reason: 'unavailable' });
  }
});
test('FX04: exact decimal half-up arithmetic, including boundary and large values', () => {
  for (const [amount, rate, expected] of [['1', '1.005', '1.01'], ['1', '1.0049', '1.00'], ['0', '4.2755', '0.00'], ['0.1', '0.2', '0.02'], ['999999999999.99', '4.2755', '4275499999999.96']]) assert.equal(prodigiAmountToPln(amount, rate), expected);
  for (const amount of ['-1', '1e3', 'NaN', '1,50', '']) assert.throws(() => prodigiAmountToPln(amount, '4'), RangeError);
  assert.throws(() => prodigiAmountToPln('1', '0'), RangeError);
});
test('FX05: rate currency mismatch never produces a PLN estimate', async () => {
  const fx = await fetchProdigiFx('EUR', transport(response), now);
  assert.equal(estimateProdigiCostInPln({ amount: '18', currency: 'USD' }, fx), null);
});
test('FX06: five-second timeout aborts NBP transport and returns unavailable', async () => {
  const nativeTimeout = global.setTimeout;
  let aborted = false;
  global.setTimeout = ((callback: (...args: any[]) => void, delay?: number, ...args: any[]) => {
    assert.equal(delay, 5_000);
    return nativeTimeout(callback, 1, ...args);
  }) as typeof setTimeout;
  try {
    const fx = await fetchProdigiFx('EUR', ((_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => { aborted = true; reject(Error('Aborted')); }, { once: true });
    })) as typeof fetch, now);
    assert.equal(aborted, true); assert.equal(fx.available, false);
  } finally { global.setTimeout = nativeTimeout; }
});
