import test from 'node:test';
import assert from 'node:assert/strict';
import { ingestPortalEvent } from '../../src/lib/client-portal-events-ingest';
import { parsePortalClientEvent, PORTAL_EVENT_MAX_BYTES } from '../../src/lib/client-portal-events';

const event = { event: 'tab_opened', sessionId: '513d9da0-12c0-4b00-8874-7a12d3a569ca', sequence: 1, section: 'documents' };
function request(body: unknown = event, headers: Record<string, string> = {}) {
    return new Request('https://example.test/api/user/events', { method: 'POST', headers: { origin: 'https://example.test', 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
}
function setup() {
    const writes: unknown[] = [];
    return { writes, dependencies: { authenticate: async () => 116 as number | null, rateLimit: async (_id: number) => true, store: async (id: number, value: unknown) => { writes.push({ id, value }); } } };
}

test('authenticated identity is server-derived; forged identities and arbitrary private fields are rejected', async () => {
    const { writes, dependencies } = setup();
    assert.equal(await ingestPortalEvent(request(), dependencies), 204);
    assert.equal((writes[0] as {id: number}).id, 116);
    for (const extra of [{ clientId: 117 }, { user_id: 117 }, { source: 'server' }, { url: '/voucher/secret' }, { note: 'private' }, { token: 'private' }]) {
        assert.equal(await ingestPortalEvent(request({ ...event, ...extra }), dependencies), 400);
    }
    assert.equal(writes.length, 1);
});
test('no auth, cross-origin, invalid content-type and exhausted rate limit cannot write', async () => {
    const { writes, dependencies } = setup();
    assert.equal(await ingestPortalEvent(request(), { ...dependencies, authenticate: async () => null }), 401);
    assert.equal(await ingestPortalEvent(request(event, { origin: 'https://attacker.test' }), dependencies), 403);
    assert.equal(await ingestPortalEvent(request(event, { origin: '' }), dependencies), 403);
    assert.equal(await ingestPortalEvent(request(event, { 'sec-fetch-site': 'cross-site' }), dependencies), 403);
    assert.equal(await ingestPortalEvent(request(event, { 'content-type': 'text/plain' }), dependencies), 415);
    assert.equal(await ingestPortalEvent(request(), { ...dependencies, rateLimit: async () => false }), 429);
    assert.equal(writes.length, 0);
});
test('real bytes, not declared length, bound streamed JSON payloads', async () => {
    const { dependencies, writes } = setup();
    assert.equal(await ingestPortalEvent(request('x'.repeat(PORTAL_EVENT_MAX_BYTES + 1), { 'content-length': '2' }), dependencies), 413);
    assert.equal(writes.length, 0);
});
test('enum, numeric and correlation validation rejects unsafe values', () => {
    for (const invalid of [{ sequence: -1 }, { section: 'private-url' }, { event: 'purchase_succeeded' }, { correlationId: 'token' }, { durationMs: 600001 }, { httpStatus: 999 }, { sequence: 1.5 }]) {
        assert.equal(parsePortalClientEvent({ ...event, ...invalid }), null);
    }
    assert.equal(parsePortalClientEvent({ ...event, event: 'module_load_failed' }), null);
    assert.equal(parsePortalClientEvent({ ...event, event: 'action_clicked' }), null);
});
test('limiter and storage errors return bounded diagnostic failure, never expose raw error', async () => {
    const { dependencies } = setup();
    assert.equal(await ingestPortalEvent(request(), { ...dependencies, rateLimit: async () => { throw new Error('private-db-uri'); } }), 503);
    assert.equal(await ingestPortalEvent(request(), { ...dependencies, store: async () => { throw new Error('private-db-uri'); } }), 503);
});
test('three independent journeys preserve visit and step evidence without claiming transaction success', async () => {
    const { dependencies, writes } = setup();
    for (let visit = 1; visit <= 3; visit++) {
        const sessionId = `513d9da0-12c0-4b00-8874-7a12d3a569c${visit}`;
        for (const [index, step] of [
            { event: 'portal_opened' }, { event: 'tab_opened', section: 'documents' },
            { event: 'module_load_started', module: 'account' }, { event: 'module_load_failed', module: 'account', httpStatus: 500 },
            { event: 'tab_opened', section: 'overview' }, { event: 'tab_opened', section: 'documents' },
            { event: 'retry_clicked', module: 'account' }, { event: 'module_load_succeeded', module: 'account', httpStatus: 200 },
            { event: 'action_clicked', action: 'offer_open' },
        ].entries()) assert.equal(await ingestPortalEvent(request({ ...step, sessionId, sequence: index + 1 }), dependencies), 204);
    }
    assert.equal(writes.length, 27);
});
