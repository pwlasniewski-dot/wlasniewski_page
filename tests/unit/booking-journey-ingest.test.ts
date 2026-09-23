import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { NextRequest } from 'next/server';

const require = createRequire(import.meta.url);
const rows: Array<{ event_type: string; metadata: string }> = [];
const loadRoute = build({
  entryPoints: ['src/app/api/analytics/v2/track/route.ts'], bundle: true, write: false,
  platform: 'node', format: 'cjs', packages: 'external',
  plugins: [{ name: 'only-storage-and-limiter-boundaries', setup(builder) {
    builder.onResolve({ filter: /^@\/lib\/(db\/prisma|analytics\/ingestGuard)$/ }, args => ({ path: args.path, namespace: 'qa-boundary' }));
    builder.onLoad({ filter: /.*/, namespace: 'qa-boundary' }, args => ({ loader: 'js', contents: args.path.endsWith('prisma')
      ? 'export default {analyticsEvent:{createMany: async ({data}) => globalThis.__qaJourneyRows.push(...data)}};'
      : 'export const consumeAnalyticsRateLimit=async()=>true; export const recordAnalyticsIngestMetric=async()=>{}; export const trustedClientSignal=()=>"203.0.113.9";' }));
  } }],
}).then(output => {
  const module = { exports: {} as { POST: (req: NextRequest) => Promise<Response> } };
  new Function('require', 'module', 'exports', output.outputFiles[0].text)(require, module, module.exports);
  return module.exports.POST;
});

const input = (event_type: string, metadata: Record<string, unknown>) => ({
  event_type, metadata: { consent: true, ...metadata }, page_url: '/rezerwacja',
  session_id: 'cf3c8ad4-8c3f-425c-93de-c67c7c800ec5', user_id: '1ccdc7bf-d9f2-4fe8-8a32-0f2893ef7cc1',
});
async function ingest(events: ReturnType<typeof input>[]) {
  (globalThis as any).__qaJourneyRows = rows;
  return (await loadRoute)(new NextRequest('https://wlasniewski.pl/api/analytics/v2/track', {
    method: 'POST', headers: { origin: 'https://wlasniewski.pl', 'user-agent': 'Mozilla/5.0 iPhone Safari/605', 'content-type': 'application/json' },
    body: JSON.stringify({ events }),
  }));
}

test('real POST handler persists semantic choices and fields, including promoted packages', async () => {
  rows.length = 0;
  const response = await ingest([
    input('v2_service_selected', { service_id: 2, service_name: 'Sesja', package_name: 'must not leak across events' }),
    input('v2_promotion_package_selected', { service_id: 2, package_id: 3, package_name: 'Rodzinna', promotion_id: 4 }),
    input('v2_date_selected', { booking_date: '2026-12-10' }),
    input('v2_time_selected', { booking_date: '2026-12-10', booking_time: '18:00' }),
    input('v2_booking_field_state', { field: 'email', state: 'filled', email: 'private@example.test', value: 'private@example.test' }),
    input('v2_booking_code_result', { code_type: 'promo', status: 'ok', reason_code: 'accepted', code: 'SECRET-VOUCHER' }),
  ]);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).saved, 6);
  assert.equal(JSON.parse(rows[0].metadata).service_name, 'Sesja');
  assert.equal(JSON.parse(rows[0].metadata).package_name, undefined);
  assert.equal(JSON.parse(rows[1].metadata).promotion_id, 4);
  assert.equal(JSON.parse(rows[3].metadata).booking_time, '18:00');
  assert.equal(JSON.parse(rows[4].metadata).field, 'email');
  assert.doesNotMatch(JSON.stringify(rows), /private@example|SECRET-VOUCHER/);
});

test('real ingest rejects missing consent and malformed field snapshots', async () => {
  rows.length = 0;
  const response = await ingest([
    input('v2_booking_field_state', { consent: false, field: 'email', state: 'filled' }),
    input('v2_booking_field_state', { field: 'password', state: 'filled' }),
    input('v2_booking_field_state', { field: 'email', state: 'private@example.test' }),
  ]);
  assert.equal(response.status, 400);
  assert.equal(rows.length, 0);
});

test('real ingest drops malformed metadata and private click labels without altering trusted context', async () => {
  rows.length = 0;
  const response = await ingest([
    input('v2_click', { analytics_id: 'private@example.test', tag: 'button', textContent: 'Private Person' }),
    input('v2_package_selected', { package_name: 'https://secret.test/token', package_id: '2', booking_time: '12:00', notes: 'private-note' }),
    input('v2_date_selected', { booking_date: '2026-02-30', booking_time: '18:00' }),
    input('v2_time_selected', { booking_time: '24:99', site_host: 'spoof.example' }),
  ]);
  assert.equal(response.status, 200);
  assert.equal(JSON.parse(rows[0].metadata).analytics_id, undefined);
  assert.equal(JSON.parse(rows[1].metadata).package_name, undefined);
  assert.equal(JSON.parse(rows[2].metadata).booking_date, undefined);
  assert.equal(JSON.parse(rows[3].metadata).booking_time, undefined);
  assert.equal(JSON.parse(rows[3].metadata).site_host, 'wlasniewski.pl');
  assert.doesNotMatch(JSON.stringify(rows), /private@example|secret\.test|Private Person|private-note|spoof\.example/);
});
