import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { build } from 'esbuild';
import { cleanupPortalDiagnostics, expiredPortalDiagnosticsWhere, PORTAL_CLEANUP_BATCH_SIZE } from '../../src/lib/client-portal-retention';

test('QA: retention removes only expired portal diagnostics; legacy evidence and recent records survive', async () => {
    const now = new Date('2026-09-13T12:00:00.000Z');
    const where = expiredPortalDiagnosticsWhere(now);
    assert.equal(where.action, 'portal_event');
    assert.equal(where.created_at.lt.toISOString(), '2026-08-14T12:00:00.000Z');
    assert.throws(() => expiredPortalDiagnosticsWhere(new Date('invalid')));
    const rows = [
        { id: 1, action: 'portal_event', created_at: new Date('2026-08-01') },
        { id: 2, action: 'portal_event', created_at: new Date('2026-09-12') },
        { id: 3, action: 'login', created_at: new Date('2026-08-01') },
        { id: 4, action: 'offer_viewed', created_at: new Date('2026-08-01') },
        { id: 5, action: 'portal_event', created_at: new Date('2026-08-14T12:00:00.000Z') },
    ];
    let deleted: number[] = [];
    const result = await cleanupPortalDiagnostics({
        findMany: async args => {
            assert.deepEqual(args, { where, select: { id: true }, take: PORTAL_CLEANUP_BATCH_SIZE, orderBy: { created_at: 'asc' } });
            // Include stale/misbehaving read candidates to ensure delete still rechecks action/date.
            return rows.map(({ id }) => ({ id }));
        },
        deleteMany: async args => {
            assert.equal(args.where.action, 'portal_event');
            assert.equal(args.where.created_at.lt.toISOString(), where.created_at.lt.toISOString());
            deleted = rows.filter(row => args.where.id.in.includes(row.id) && row.action === args.where.action && row.created_at < args.where.created_at.lt).map(row => row.id);
            return { count: deleted.length };
        },
    }, now);
    assert.deepEqual(deleted, [1]);
    assert.deepEqual(result, { count: 1, batchFull: false });
    assert.deepEqual(await cleanupPortalDiagnostics({ findMany: async () => [], deleteMany: async () => assert.fail('no broad delete for empty selection') }, now), { count: 0, batchFull: false });
});

test('QA: retention batch remains bounded and exposes a full backlog instead of recursive deletion', async () => {
    let deletes = 0;
    const result = await cleanupPortalDiagnostics({
        findMany: async args => Array.from({ length: args.take }, (_, index) => ({ id: index + 1 })),
        deleteMany: async args => { deletes++; assert.equal(args.where.id.in.length, PORTAL_CLEANUP_BATCH_SIZE); return { count: PORTAL_CLEANUP_BATCH_SIZE }; },
    }, new Date('2026-09-13'));
    assert.equal(deletes, 1);
    assert.deepEqual(result, { count: PORTAL_CLEANUP_BATCH_SIZE, batchFull: true });
});

test('QA: real admin activity route gates auth, validates pagination, and uses authoritative client identity', async () => {
    const mocks: Record<string, string> = {
        'next/server': `export class NextResponse extends Response { static json(data,init={}) {return new NextResponse(JSON.stringify(data),init);} }`,
        '@/lib/db/prisma': `export default globalThis.__qaPrisma;`,
        '@/lib/auth/middleware': `import {NextResponse} from 'next/server'; export async function requireAuth() {return globalThis.__qaAuthStatus ? NextResponse.json({error:'denied'},{status:globalThis.__qaAuthStatus}) : null;}`,
    };
    const result = await build({
        entryPoints: ['src/app/api/admin/crm-activity/route.ts'], absWorkingDir: process.cwd(), bundle: true, write: false, platform: 'node', format: 'cjs',
        plugins: [{ name: 'qa-admin-boundaries', setup(builder) {
            builder.onResolve({ filter: /.*/ }, args => args.path in mocks ? { path: args.path, namespace: 'qa-mock' } : undefined);
            builder.onLoad({ filter: /.*/, namespace: 'qa-mock' }, args => ({ contents: mocks[args.path], loader: 'ts' }));
        } }],
    });
    const calls: Array<{ method: string; args: any }> = [];
    const context: any = { module: { exports: {} }, exports: {}, Response, URL, console: { error: () => {} }, __qaAuthStatus: 401, __qaPrisma: {
        user: { findUnique: async (args: any) => { calls.push({ method: 'user', args }); return args.where.id === 116 ? { email: 'verified@example.test' } : null; } },
        crmActivity: {
            findMany: async (args: any) => { calls.push({ method: 'list', args }); return [{ id: 1, action: 'portal_event', details: '{"source":"browser","event":"tab_opened"}' }]; },
            count: async (args: any) => { calls.push({ method: 'count', args }); return 1; },
        },
    } };
    vm.runInNewContext(result.outputFiles[0].text, context);
    const get = (query: string) => context.module.exports.GET(new Request(`https://portal.test/api/admin/crm-activity?${query}`));
    assert.equal((await get('client_id=116')).status, 401);
    assert.equal(calls.length, 0, 'unauthorized requests never query history');
    context.__qaAuthStatus = 403;
    assert.equal((await get('client_id=116')).status, 403);
    context.__qaAuthStatus = null;
    for (const query of ['limit=501', 'offset=-1', 'offset=100001', 'limit=1.5', 'client_id=NaN', 'entity_id=0', 'date_from=invalid', 'date_from=2026-09-14&date_to=2026-09-13']) {
        assert.equal((await get(query)).status, 400, query);
    }
    assert.equal(calls.length, 0, 'bad filters never reach database');
    assert.equal((await get('client_id=999')).status, 404);
    calls.length = 0;
    const response = await get('client_id=116&client_email=forged@example.test&limit=100&offset=100');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    const list = calls.find(call => call.method === 'list')!.args;
    assert.deepEqual(JSON.parse(JSON.stringify(list.where.OR)), [{ client_id: 116 }, { client_id: null, client_email: 'verified@example.test' }]);
    assert.equal(list.skip, 100);
    assert.equal(list.take, 100);
    const data = await response.json();
    assert.equal(data.activities[0].details.source, 'browser');
    assert.equal(data.total, 1);
    assert.equal(data.offset, 100);
});
