// Execute the actual calendar routes with isolated storage; no live DB writes.
require('tsx/cjs');
const assert = require('node:assert/strict');
const Module = require('node:module');
const originalLoad = Module._load;
const { NextRequest, NextResponse } = require('next/server');
const saved = [];
let authenticated = true;
let lockHeld = false;
const db = {
    booking: {
        findMany: async () => saved,
        create: async ({ data }) => {
            assert.equal(lockHeld, true);
            const value = { ...data, id: saved.length + 1, created_at: new Date() };
            saved.push(value); return { id: value.id };
        },
    },
    offer: { findMany: async () => [] }, photoChallenge: { findMany: async () => [] },
    contract: { findMany: async () => [] }, workshop: { findMany: async () => [] },
    $transaction: async callback => { try { return await callback(db); } finally { lockHeld = false; } },
};
Module._load = function(name, ...args) {
    if (name === '@/lib/auth/middleware') return { requireAuth: async () => authenticated ? null : NextResponse.json({}, { status: 401 }) };
    if (name === '@/lib/db/prisma') return { __esModule: true, default: db };
    if (name === '@/lib/db/advisoryLock') return { acquireAdvisoryTransactionLock: async (_tx, key) => { assert.equal(key, 'booking:2026-11-20'); lockHeld = true; } };
    return originalLoad.call(this, name, ...args);
};
const { POST, GET } = require('../../src/app/api/admin/calendar-events/route.ts');
const body = { date: '2026-11-20', start_time: '12:00', end_time: '13:00', client_name: 'Test Klient', email: 'test@example.com', service: 'Sesja rodzinna', price: 450 };
const post = extra => POST(new NextRequest('https://example.com/api/admin/calendar-events', { method: 'POST', body: JSON.stringify({ ...body, ...extra }) }));
(async () => {
    authenticated = false;
    assert.equal((await post()).status, 401);
    assert.equal(saved.length, 0);
    authenticated = true;
    assert.equal((await post({ date: '2026-02-30' })).status, 400);
    assert.equal((await post({ end_time: '11:00' })).status, 400);
    assert.equal((await post({ price: -1 })).status, 400);
    assert.equal((await post({ price: true })).status, 400);
    assert.equal((await post({ date: '2026-11-20oops' })).status, 400);
    assert.equal((await post({ email: 'a'.repeat(255) + '@example.com' })).status, 400);
    assert.equal((await post()).status, 201);
    assert.equal(saved[0].status, 'confirmed');
    assert.equal(saved[0].booking_source, 'admin_calendar');
    assert.equal(saved[0].deposit_paid_at, undefined);
    const response = await GET(new NextRequest('https://example.com/api/admin/calendar-events?from=2026-11-01&to=2026-11-30'));
    const data = await response.json();
    assert.equal(data.events[0].source_id, saved[0].id);
    assert.equal(data.events[0].client_name, body.client_name);
    assert.equal(data.events[0].date, body.date);
    assert.equal((await post()).status, 409); // repeat / overlap cannot duplicate
    assert.equal((await post({ start_time: '12:30', end_time: '14:00' })).status, 409);
    assert.equal((await post({ start_time: '13:00', end_time: '14:00' })).status, 201);
    assert.equal(saved.length, 2);
    console.log('PASS admin calendar: denied auth, validation, save/read, conflict/retry, adjacent slots, lock, no paid flag');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { Module._load = originalLoad; });
