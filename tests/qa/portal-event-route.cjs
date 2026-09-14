// Execute the real route and origin guard; substitute only auth, limiter and storage.
require('tsx/cjs');
const assert = require('node:assert/strict');
const Module = require('node:module');
const originalLoad = Module._load;
const saved = [];
let authenticated = true;
Module._load = function(name, ...args) {
    if (name === '@/lib/auth/jwt') return { extractToken: value => value?.startsWith('Bearer ') ? value.slice(7) : null, verifyToken: async token => token === 'test-session' && authenticated ? { id: 116 } : null };
    if (name === '@/lib/auth/active-client') return { revalidateActiveClient: async decoded => decoded };
    if (name === '@/lib/analytics/ingestGuard') return { consumeAnalyticsRateLimit: async () => true };
    if (name === '@/lib/client-portal-events-server') return { storePortalClientEvent: async (id, value) => saved.push({ id, value }) };
    return originalLoad.call(this, name, ...args);
};
process.env.NEXT_PUBLIC_BASE_URL = 'https://shop.example.test';
const { NextRequest } = require('next/server');
const { POST } = require('../../src/app/api/user/events/route.ts');
const event = { event: 'portal_opened', sessionId: '513d9da0-12c0-4b00-8874-7a12d3a569ca', sequence: 1, section: 'overview' };
function request(origin, extra = {}) {
    return new NextRequest('http://localhost:3000/api/user/events', {
        method: 'POST', headers: { origin, 'sec-fetch-site': 'same-origin', 'content-type': 'application/json', authorization: 'Bearer test-session', ...extra },
        body: JSON.stringify(event),
    });
}
(async () => {
    let response = await POST(request('https://shop.example.test'));
    assert.equal(response.status, 204);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(saved, [{ id: 116, value: event }]);
    response = await POST(request('https://attacker.test', { 'x-forwarded-host': 'attacker.test', host: 'attacker.test' }));
    assert.equal(response.status, 403);
    response = await POST(request('https://shop.example.test', { 'sec-fetch-site': 'cross-site' }));
    assert.equal(response.status, 403);
    authenticated = false;
    response = await POST(request('https://shop.example.test'));
    assert.equal(response.status, 401);
    assert.equal(saved.length, 1);
    console.log('PASS portal events route: proxy origin, exact allowlist, cross-site rejection and authentication');
})().catch(error => { console.error(error); process.exitCode = 1; });
