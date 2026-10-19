// Actual shared loader, isolated database boundary; no live data writes.
require('tsx/cjs');
const assert = require('node:assert/strict');
const Module = require('node:module');
const originalLoad = Module._load;
const rows = { booking: [], offer: [], photoChallenge: [], contract: [], workshop: [] };
let fail = null;
const db = Object.fromEntries(Object.keys(rows).map(key => [key, { findMany: async ({where} = {}) => {
    if (fail === key) throw new Error(`unavailable:${key}`);
    const filter = where?.session_date || where?.date;
    return rows[key].filter(row => {
        const date = row.session_date || row.date;
        return !filter || ((!filter.gte || date >= filter.gte) && (!filter.lte || date <= filter.lte) && (filter.not !== null || date != null));
    });
} }]));
Module._load = function(name, ...args) {
    if (name === '@/lib/db/prisma') return { __esModule: true, default: db };
    return originalLoad.call(this, name, ...args);
};
const { loadCalendarEvents } = require('../../src/lib/calendar/events.ts');
(async () => {
    rows.booking = [{ id: 1, date: new Date('2028-07-01T00:00:00Z'), service: 'Sesja', package: 'Pakiet', status: 'confirmed', challenge_id: 10 }];
    rows.photoChallenge = [
        { id: 10, status: 'paid', session_date: new Date('2028-07-01T00:00:00Z') },
        { id: 11, status: 'paid', session_date: new Date('2028-07-01T22:30:00Z') },
        { id: 12, status: 'paid', session_date: new Date('2028-12-01T22:30:00Z') },
    ];
    rows.offer = [{ id: 2, title: 'Oferta', status: 'accepted', session_date: new Date('2028-07-01T00:00:00Z') }];
    rows.contract = [
        { id: 3, status: 'cancelled', offer_id: 2, session_date: new Date('2028-07-01T00:00:00Z') },
        { id: 4, status: 'rejected', session_date: new Date('2028-08-01T00:00:00Z') },
    ];
    rows.workshop = [{ id: 5, title: 'Warsztat', status: 'active', schedule: [{date:'2029-04-01', start:'10:00', end:'12:00'}, {date:'2029-04-02'}], _count: {participants: 2} }];
    const events = await loadCalendarEvents({ strict: true });
    assert.equal(events.length, 7);
    assert.equal(events.some(e => e.id === 'challenge-10'), false);
    assert.equal(events.find(e => e.id === 'contract-3').status, 'cancelled');
    assert.equal(events.find(e => e.id === 'contract-4').status, 'rejected');
    assert.equal(events.some(e => e.id === 'offer-2'), false);
    assert.equal(events.find(e => e.id === 'challenge-11').date, '2028-07-02');
    assert.equal(events.find(e => e.id === 'challenge-11').start_time, '00:30');
    assert.equal(events.find(e => e.id === 'challenge-12').start_time, '23:30');
    assert.deepEqual(events.filter(e => e.source === 'workshop').map(e => e.id), ['workshop-5-day1','workshop-5-day2']);
    const midnight = await loadCalendarEvents({from:'2028-07-02', to:'2028-07-02', strict:true});
    assert.deepEqual(midnight.map(e => e.id), ['challenge-11']);
    // Contract date overrides a stale offer, including moving outside the export interval.
    rows.contract[0].session_date = new Date('2028-09-10T00:00:00Z');
    rows.contract[0].status = 'signed';
    const moved = await loadCalendarEvents({from:'2028-09-01', to:'2028-09-30', strict:true});
    assert.equal(moved.find(e => e.id === 'contract-3').date, '2028-09-10');
    assert.equal(moved.some(e => e.id === 'contract-4'), false);
    rows.contract[0].session_date = new Date('2027-01-01T00:00:00Z');
    const past = await loadCalendarEvents({from:'2028-01-01', strict:true});
    assert.equal(past.some(e => e.id === 'contract-3' || e.id === 'offer-2'), false);
    for (const source of ['photoChallenge','contract','workshop']) {
        fail = source;
        await assert.rejects(() => loadCalendarEvents({strict:true}), new RegExp(`unavailable:${source}`));
        const oldWarn = console.warn; console.warn = () => {};
        try { assert.ok((await loadCalendarEvents()).length > 0); } finally { console.warn = oldWarn; }
    }
    fail = 'booking';
    await assert.rejects(() => loadCalendarEvents(), /unavailable:booking/);
    console.log('PASS shared calendar loader: five sources, unlimited future, linked dedup, terminal contracts, Warsaw summer/winter, strict completeness');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { Module._load = originalLoad; });
