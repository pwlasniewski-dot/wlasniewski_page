import assert from 'node:assert/strict';
import test from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { createPortalEventReporter, portalResponseDiagnostics, type PortalObservation } from '../../src/lib/client-portal-events-client';

const SESSION_ID = 'e9b42899-162b-4bdf-a19d-4a5ba6bf2146';
const CORRELATION_ID = 'b2580b80-cb9b-419b-83cb-d8bce90377d2';

test('three portal visits have separate ephemeral sessions and monotonic sequences', async () => {
    const payloads: Record<string, unknown>[] = [];
    for (let visit = 1; visit <= 3; visit++) {
        const reporter = createPortalEventReporter({
            token: `test-auth-${visit}`,
            createSessionId: () => SESSION_ID.replace(/.$/, String(visit)),
            fetcher: async (url, init) => {
                assert.equal(url, '/api/user/events');
                assert.equal(init?.credentials, 'omit');
                assert.equal(init?.keepalive, true);
                assert.equal(new Headers(init?.headers).get('Authorization'), `Bearer test-auth-${visit}`);
                payloads.push(JSON.parse(String(init?.body)));
                return new Response(null, { status: 204 });
            },
        });
        reporter.track({ event: 'portal_opened', section: 'overview' });
        reporter.track({ event: 'tab_opened', section: 'documents' });
        reporter.track({ event: 'module_load_failed', section: 'documents', module: 'account', httpStatus: 500, correlationId: CORRELATION_ID });
        reporter.track({ event: 'retry_clicked', section: 'documents', module: 'account' });
        reporter.track({ event: 'module_load_succeeded', section: 'documents', module: 'account', httpStatus: 200 });
        await setImmediate();
    }
    assert.equal(payloads.length, 15);
    assert.equal(new Set(payloads.map(event => event.sessionId)).size, 3);
    for (let visit = 0; visit < 3; visit++) {
        assert.deepEqual(payloads.slice(visit * 5, visit * 5 + 5).map(event => event.sequence), [1, 2, 3, 4, 5]);
    }
});

test('diagnostic transport rejection and synchronous failure never escape or trigger retries', async () => {
    let attempts = 0;
    for (const fetcher of [
        (() => { attempts++; throw new Error('transport unavailable'); }) as typeof fetch,
        (async () => { attempts++; throw new Error('network unavailable'); }) as typeof fetch,
    ]) {
        const reporter = createPortalEventReporter({ token: 'test-token', createSessionId: () => SESSION_ID, fetcher });
        assert.doesNotThrow(() => reporter.track({ event: 'tab_opened', section: 'documents' }));
    }
    await setImmediate();
    assert.equal(attempts, 2);
});

test('diagnostics neither await a stalled request nor exceed six requests in flight', async () => {
    const resolvers: Array<(response: Response) => void> = [];
    const reporter = createPortalEventReporter({
        token: 'test-token', createSessionId: () => SESSION_ID,
        fetcher: () => new Promise(resolve => resolvers.push(resolve)),
    });
    for (let index = 0; index < 20; index++) {
        assert.equal(reporter.track({ event: 'tab_opened', section: 'settings' }), undefined);
    }
    assert.equal(resolvers.length, 6);
    resolvers.forEach(resolve => resolve(new Response(null, { status: 204 })));
    await setImmediate();
});

test('a stalled diagnostic request is aborted after two seconds without retry', async context => {
    context.mock.timers.enable({ apis: ['setTimeout'] });
    let signal: AbortSignal | undefined;
    let attempts = 0;
    const reporter = createPortalEventReporter({
        token: 'test-token', createSessionId: () => SESSION_ID,
        fetcher: (_url, init) => new Promise((_resolve, reject) => {
            attempts++;
            signal = init?.signal || undefined;
            signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
        }),
    });
    reporter.track({ event: 'portal_opened', section: 'overview' });
    context.mock.timers.tick(1_999);
    assert.equal(signal?.aborted, false);
    context.mock.timers.tick(1);
    assert.equal(signal?.aborted, true);
    await setImmediate();
    assert.equal(attempts, 1);
});

test('rate limit is bounded to ninety events per minute, including a zero-based clock', async () => {
    let time = 0;
    let attempts = 0;
    const reporter = createPortalEventReporter({
        token: 'test-token', createSessionId: () => SESSION_ID, now: () => time,
        fetcher: async () => { attempts++; return new Response(null, { status: 204 }); },
    });
    for (let index = 0; index < 100; index++) {
        reporter.track({ event: 'tab_opened', section: 'overview' });
        await setImmediate();
    }
    assert.equal(attempts, 90);
    time = 60_000;
    reporter.track({ event: 'tab_opened', section: 'documents' });
    await setImmediate();
    assert.equal(attempts, 91);
});

test('payload allows only operational enums and IDs, never auth or incidental user content', async () => {
    const bodies: string[] = [];
    const reporter = createPortalEventReporter({
        token: 'AUTH_SECRET', createSessionId: () => SESSION_ID,
        fetcher: async (_url, init) => { bodies.push(String(init?.body)); return new Response(null, { status: 204 }); },
    });
    reporter.track({ event: 'action_clicked', action: 'voucher_open', section: 'gift_cards', url: '/karta-podarunkowa/dostep/SECRET', email: 'private@example.test', note: 'PRIVATE_NOTE', token: 'PRIVATE_TOKEN' } as PortalObservation);
    // Even incorrectly constructed enum/ID values are rejected before any network request.
    reporter.track({ event: 'action_clicked', action: 'PRIVATE_NOTE' } as unknown as PortalObservation);
    reporter.track({ event: 'module_load_failed', module: 'account', correlationId: 'PRIVATE_TOKEN' });
    await setImmediate();
    assert.equal(bodies.length, 1);
    assert.doesNotMatch(bodies[0], /SECRET|private|PRIVATE|url|email|note|token/);
    assert.deepEqual(Object.keys(JSON.parse(bodies[0])).sort(), ['action', 'event', 'section', 'sequence', 'sessionId']);
});

test('diagnostic crypto failure cannot block the portal', () => {
    let attempts = 0;
    const reporter = createPortalEventReporter({
        token: 'test-token', createSessionId: () => { throw new Error('unsupported'); },
        fetcher: async () => { attempts++; return new Response(null, { status: 204 }); },
    });
    assert.doesNotThrow(() => reporter.track({ event: 'portal_opened' }));
    assert.equal(attempts, 0);
});

test('response diagnostics contain status and valid correlation only, never server error text', () => {
    assert.deepEqual(portalResponseDiagnostics(new Response(null, { status: 500 }), { caseCode: CORRELATION_ID, error: 'PRIVATE_ERROR' }), { httpStatus: 500, correlationId: CORRELATION_ID });
    assert.deepEqual(portalResponseDiagnostics(new Response(null, { status: 403 }), { caseCode: 'PRIVATE_ERROR', requestUrl: 'SECRET' }), { httpStatus: 403, correlationId: undefined });
    assert.deepEqual(portalResponseDiagnostics(new Response(null, { status: 500, headers: { 'X-Correlation-ID': CORRELATION_ID } }), { caseCode: 'ABCDEF12', error: 'PRIVATE_ERROR' }), { httpStatus: 500, correlationId: CORRELATION_ID });
    assert.deepEqual(portalResponseDiagnostics(new Response(null, { status: 500, headers: { 'X-Correlation-ID': 'PRIVATE_TOKEN' } }), { caseCode: CORRELATION_ID }), { httpStatus: 500, correlationId: CORRELATION_ID });
});
