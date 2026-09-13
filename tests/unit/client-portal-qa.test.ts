import assert from 'node:assert/strict';
import test from 'node:test';
import { parsePortalClientEvent, PORTAL_EVENT_MAX_BYTES } from '../../src/lib/client-portal-events';
import { ingestPortalEvent } from '../../src/lib/client-portal-events-ingest';
import { createPortalEventReporter, portalResponseDiagnostics } from '../../src/lib/client-portal-events-client';

const SESSION = '69896238-e4b2-46b9-8369-bffcf60d50c0';
const event = () => ({ event: 'tab_opened', section: 'gift_cards', sessionId: SESSION, sequence: 1 });
const request = (body: unknown = event(), headers: Record<string, string> = {}) => new Request('https://portal.test/api/user/events', {
    method: 'POST', headers: { origin: 'https://portal.test', 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
});

function dependencies(clientId: number | null = 116) {
    const saved: Array<{ clientId: number; event: unknown }> = [];
    return {
        saved,
        authenticate: async () => clientId,
        rateLimit: async () => true,
        store: async (id: number, observation: unknown) => { saved.push({ clientId: id, event: observation }); },
    };
}

test('QA: only closed event schema is accepted; actor/source/free text cannot be forged', () => {
    assert.deepEqual(parsePortalClientEvent(event()), event());
    for (const field of ['clientId', 'client_id', 'user_id', 'source', 'email', 'url', 'href', 'token', 'message', 'details', 'metadata']) {
        assert.equal(parsePortalClientEvent({ ...event(), [field]: 'sensitive-or-forged' }), null, field);
    }
    for (const field of ['event', 'section', 'module', 'action', 'sessionId', 'correlationId']) {
        assert.equal(parsePortalClientEvent({ ...event(), [field]: 'https://private.example/voucher/secret?token=sensitive' }), null, field);
    }
    assert.equal(parsePortalClientEvent({ ...event(), event: 'request_succeeded' }), null, 'server-only event');
    assert.equal(parsePortalClientEvent({ ...event(), sequence: 1.2 }), null);
    assert.equal(parsePortalClientEvent({ ...event(), sequence: 0 }), null);
    assert.equal(parsePortalClientEvent({ ...event(), sequence: 1_000_001 }), null);
    assert.equal(parsePortalClientEvent({ ...event(), durationMs: 600_001 }), null);
    assert.equal(parsePortalClientEvent({ ...event(), httpStatus: 600 }), null);
    assert.equal(parsePortalClientEvent({ ...event(), event: 'module_load_failed' }), null);
    assert.equal(parsePortalClientEvent({ ...event(), event: 'action_clicked' }), null);
});

test('QA: ingest derives client identity only from successful server authentication', async () => {
    const deps = dependencies(116);
    assert.equal(await ingestPortalEvent(request(), deps), 204);
    assert.deepEqual(deps.saved, [{ clientId: 116, event: event() }]);
    assert.equal(await ingestPortalEvent(request({ ...event(), clientId: 117 }), deps), 400);
    assert.equal(deps.saved.length, 1);
    const unauthenticated = dependencies(null);
    assert.equal(await ingestPortalEvent(request(), unauthenticated), 401);
    assert.equal(unauthenticated.saved.length, 0);
});

test('QA: cross-origin and non-JSON observations cannot reach authentication/storage', async () => {
    let authCalls = 0;
    const deps = { ...dependencies(), authenticate: async () => { authCalls++; return 116; } };
    assert.equal(await ingestPortalEvent(request(event(), { origin: 'https://attacker.test' }), deps), 403);
    assert.equal(await ingestPortalEvent(request(event(), { origin: 'null' }), deps), 403);
    assert.equal(await ingestPortalEvent(request(event(), { origin: '' }), deps), 403);
    assert.equal(await ingestPortalEvent(request(event(), { 'sec-fetch-site': 'cross-site' }), deps), 403);
    assert.equal(await ingestPortalEvent(request(event(), { 'content-type': 'text/plain' }), deps), 415);
    assert.equal(authCalls, 0);
});

test('QA: malformed and oversized bodies are bounded even with forged Content-Length', async () => {
    const deps = dependencies();
    assert.equal(await ingestPortalEvent(request('{'), deps), 400);
    assert.equal(await ingestPortalEvent(request('null'), deps), 400);
    assert.equal(await ingestPortalEvent(request('[]'), deps), 400);
    assert.equal(await ingestPortalEvent(request('x'.repeat(PORTAL_EVENT_MAX_BYTES + 1), { 'content-length': '1' }), deps), 413);
    assert.equal(await ingestPortalEvent(request(event(), { 'content-length': String(PORTAL_EVENT_MAX_BYTES + 1) }), deps), 413);
    assert.equal(await ingestPortalEvent(request('ł'.repeat(PORTAL_EVENT_MAX_BYTES)), deps), 413, 'UTF-8 byte length, not JS character count');
    assert.equal(deps.saved.length, 0);
});

test('QA: endpoint drops rate-limited events and storage failure stays a sanitized diagnostic response', async () => {
    const deps = dependencies();
    assert.equal(await ingestPortalEvent(request(), { ...deps, rateLimit: async () => false }), 429);
    assert.equal(deps.saved.length, 0);
    const messages: unknown[][] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => { messages.push(args); };
    try {
        assert.equal(await ingestPortalEvent(request(), { ...deps, store: async () => { throw new Error('SECRET_DATABASE_URL'); } }), 503);
        assert.equal(await ingestPortalEvent(request(), { ...deps, authenticate: async () => { throw new Error('SECRET_TOKEN'); } }), 503);
    } finally { console.warn = originalWarn; }
    assert.equal(messages.length, 2);
    assert.doesNotMatch(JSON.stringify(messages), /SECRET/);
});

test('QA: reporter sends no caller-supplied actor/URL/text; session and sequence are per instance', async () => {
    const sent: Array<{ url: string; body: any; init: RequestInit }> = [];
    const fetcher = (async (url: any, init: any) => {
        sent.push({ url: String(url), body: JSON.parse(init.body), init });
        return new Response(null, { status: 204 });
    }) as typeof fetch;
    const reporter = createPortalEventReporter({ token: 'test-auth-token', fetcher, createSessionId: () => SESSION });
    reporter.track({ event: 'tab_opened', section: 'gift_cards', href: '/private/token', clientId: 999, message: 'PRIVATE_NOTE' } as any);
    reporter.track({ event: 'action_clicked', action: 'voucher_open', section: 'gift_cards' });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(sent.length, 2);
    assert.equal(sent[0].url, '/api/user/events');
    assert.deepEqual(sent[0].body, { event: 'tab_opened', sessionId: SESSION, sequence: 1, section: 'gift_cards' });
    assert.equal(sent[1].body.sequence, 2);
    assert.equal(sent[0].init.credentials, 'omit');
    assert.doesNotMatch(JSON.stringify(sent.map(item => item.body)), /test-auth-token|PRIVATE_NOTE|private\/token|999/);
    const other = createPortalEventReporter({ token: 'other', fetcher, createSessionId: () => '425cd862-061d-49d7-ad6e-04c412c8941b' });
    other.track({ event: 'portal_opened', section: 'overview' });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(sent[2].body.sequence, 1);
    assert.notEqual(sent[2].body.sessionId, sent[0].body.sessionId);
});

test('QA: reporter rate limit is bounded and logging failure never throws/retries', async () => {
    let calls = 0;
    let now = 10_000;
    const reporter = createPortalEventReporter({ token: 'x', now: () => now, createSessionId: () => SESSION, fetcher: (async () => {
        calls++;
        throw new Error('logger offline');
    }) as typeof fetch });
    for (let index = 0; index < 100; index++) {
        assert.doesNotThrow(() => reporter.track({ event: 'tab_opened', section: 'overview' }));
        await new Promise(resolve => setImmediate(resolve));
    }
    assert.equal(calls, 90);
    now += 60_000;
    reporter.track({ event: 'tab_opened', section: 'overview' });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(calls, 91);
    const throwing = createPortalEventReporter({ token: 'x', createSessionId: () => { throw new Error('crypto unavailable'); } });
    assert.doesNotThrow(() => throwing.track({ event: 'portal_opened' }));
    const syncThrow = createPortalEventReporter({ token: 'x', createSessionId: () => SESSION, fetcher: (() => { throw new Error('fetch unavailable'); }) as typeof fetch });
    assert.doesNotThrow(() => syncThrow.track({ event: 'portal_opened' }));
});

test('QA: diagnostics accept only HTTP status and UUID, never raw error/token', () => {
    assert.deepEqual(portalResponseDiagnostics(new Response(null, { status: 500 }), { correlationId: SESSION, error: 'PRIVATE_DB_ERROR' }), { httpStatus: 500, correlationId: SESSION });
    assert.deepEqual(portalResponseDiagnostics(new Response(null, { status: 500 }), { caseCode: '/voucher/private-token', error: 'PRIVATE_DB_ERROR' }), { httpStatus: 500, correlationId: undefined });
});

test('QA: real clientJson wire contract correlates via response header, not short public caseCode', () => {
    const response = new Response(null, { status: 500, headers: { 'X-Correlation-ID': SESSION } });
    assert.deepEqual(portalResponseDiagnostics(response, { error: 'Server unavailable', caseCode: '69896238' }), { httpStatus: 500, correlationId: SESSION });
    assert.deepEqual(portalResponseDiagnostics(new Response(null, { status: 200, headers: { 'X-Correlation-ID': SESSION } }), { success: true }), { httpStatus: 200, correlationId: SESSION });
    assert.deepEqual(portalResponseDiagnostics(new Response(null, { status: 500, headers: { 'X-Correlation-ID': 'PRIVATE_TOKEN' } }), { caseCode: 'PRIVATE_TOKEN' }), { httpStatus: 500, correlationId: undefined });
});
