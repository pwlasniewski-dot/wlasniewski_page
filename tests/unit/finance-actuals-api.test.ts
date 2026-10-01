import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { NextRequest } from 'next/server';
import { generateToken } from '../../src/lib/auth/jwt';

const require = createRequire(import.meta.url);
let financeReads = 0; let ledgerQueries: any[] = []; let fail = false; let adminExists = true;
const ledgerRow = { id: 1, provider: 'PAYU', provider_payment_id: 'p-1', external_order_id: null, resource_type: 'BOOKING', resource_id: 1, payment_kind: 'FULL', amount: 10000, currency: 'PLN', status: 'COMPLETED', paid_at: new Date('2026-09-05T12:00:00Z'), refunded_amount: 0, refunded_at: null };
(globalThis as any).__qaFinanceDb = {
    adminUser: { findUnique: async () => adminExists ? { id: 7, email: 'admin@example.test', name: 'Admin', role: 'ADMIN' } : null },
    $transaction: async (fn: (tx: any) => Promise<unknown>, options: { isolationLevel: string }) => {
        financeReads++; if (fail) throw new Error('private database connection detail');
        assert.equal(options.isolationLevel, 'RepeatableRead');
        return fn({
            booking: { findMany: async (query: any) => query.select.price ? [{ price: 10000 }] : [] },
            photoOrder: { findMany: async () => [] }, giftCardOrder: { findMany: async () => [] },
            paymentLedger: { findMany: async (query: any) => { ledgerQueries.push(query); return [ledgerRow]; }, findFirst: async () => ({ paid_at: ledgerRow.paid_at }) },
        });
    },
};
const loadRoute = build({
    entryPoints: ['src/app/api/admin/analytics/finance/route.ts'], bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
    plugins: [{ name: 'fake-finance-db-only', setup(builder) {
        builder.onResolve({ filter: /^@\/lib\/db\/prisma$/ }, args => ({ path: args.path, namespace: 'qa-finance' }));
        builder.onLoad({ filter: /.*/, namespace: 'qa-finance' }, () => ({ loader: 'js', contents: 'export default globalThis.__qaFinanceDb;' }));
    } }],
}).then(output => {
    const module = { exports: {} as { GET: (request: NextRequest) => Promise<Response> } };
    new Function('require', 'module', 'exports', output.outputFiles[0].text)(require, module, module.exports);
    return module.exports.GET;
});
process.env.JWT_SECRET = 'qa-finance-only-secret-longer-than-thirty-two-characters';
const query = 'startDate=2026-09-01&endDate=2026-09-30';
async function request(token?: string, params = query) {
    return (await loadRoute)(new NextRequest(`https://wlasniewski.pl/api/admin/analytics/finance?${params}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }));
}
const adminToken = () => generateToken({ id: 7, email: 'admin@example.test', role: 'ADMIN', type: 'admin' });

test('anonymous request is denied without reading finance and cannot be cached', async () => {
    financeReads = 0;
    const response = await request();
    assert.equal(response.status, 401); assert.equal(financeReads, 0); assert.match(response.headers.get('cache-control')!, /private, no-store/);
});

test('valid client token and nonexistent admin cannot access finance', async () => {
    financeReads = 0;
    const client = await generateToken({ id: 7, email: 'admin@example.test', role: 'CLIENT', type: 'client' });
    assert.equal((await request(client)).status, 403);
    adminExists = false;
    assert.equal((await request(await adminToken())).status, 401);
    adminExists = true;
    assert.equal(financeReads, 0);
});

test('authorized handler returns actual minor PLN amounts and Warsaw date filter only', async () => {
    financeReads = 0; ledgerQueries = [];
    const response = await request(await adminToken());
    assert.equal(response.status, 200); const body = await response.json();
    assert.equal(body.data.receivedPaymentsGross, 10000); assert.equal(body.data.income, null); assert.equal(body.data.currency, 'PLN');
    assert.equal(body.range.timeZone, 'Europe/Warsaw'); assert.equal(financeReads, 1);
    assert.equal(ledgerQueries[0].where.OR[0].paid_at.gte.toISOString(), '2026-08-31T22:00:00.000Z');
    assert.equal(ledgerQueries[0].where.OR[0].paid_at.lt.toISOString(), '2026-09-30T22:00:00.000Z');
    assert.match(response.headers.get('cache-control')!, /no-store/); assert.equal(response.headers.get('vary'), 'Cookie, Authorization');
});

test('authorized invalid dates fail before finance reads, including invalid end dates and unsupported timestamps', async () => {
    financeReads = 0;
    for (const params of ['startDate=2026-02-01&endDate=2026-02-31', 'startDate=2026-09-01', 'start=2026-09-01', 'startDate=2026-09-02&endDate=2026-09-01']) {
        const response = await request(await adminToken(), params);
        assert.equal(response.status, 400); assert.equal((await response.json()).data, null);
    }
    assert.equal(financeReads, 0);
});

test('database failure exposes unavailable data, never zeros or connection details', async () => {
    fail = true;
    const response = await request(await adminToken());
    fail = false;
    assert.equal(response.status, 503); const body = await response.json();
    assert.equal(body.success, false); assert.equal(body.data, null); assert.doesNotMatch(JSON.stringify(body), /connection|receivedPaymentsGross/);
    assert.match(response.headers.get('cache-control')!, /no-store/);
});
