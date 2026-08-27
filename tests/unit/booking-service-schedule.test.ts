import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { hasBookingDateTimeConflict } from '../../src/lib/bookingAvailability.ts';
import {
    buildBookingSlots,
    defaultBookingScheduleRules,
    formatBookingTimeRange,
    resolveBookingSchedule,
    validateBookingSlot,
} from '../../src/lib/bookingSchedule.ts';

test('weekday sessions and weekend events use separate professional windows', () => {
    const session = resolveBookingSchedule({
        serviceKey: 'SESJA',
        date: '2026-09-03', // Thursday
        rules: defaultBookingScheduleRules('SESJA'),
    });
    assert.ok(session);
    assert.deepEqual(buildBookingSlots(session!, 120).map(slot => slot.start), ['18:00', '19:00', '20:00']);

    const weekendEvent = resolveBookingSchedule({
        serviceKey: 'PRZYJECIE',
        date: '2026-09-05', // Saturday
        rules: defaultBookingScheduleRules('PRZYJECIE'),
    });
    assert.ok(weekendEvent);
    const eventSlots = buildBookingSlots(weekendEvent!, 5 * 60);
    assert.equal(eventSlots[0].start, '08:00');
    assert.deepEqual(eventSlots.at(-1), {
        start: '21:00',
        end: '02:00',
        endDayOffset: 1,
        startMinute: 1260,
        endMinute: 1560,
    });
});

test('long package is not offered when it cannot fit the configured work window', () => {
    const monday = resolveBookingSchedule({
        serviceKey: 'SLUB',
        date: '2026-09-07',
        rules: defaultBookingScheduleRules('SLUB'),
    });
    const saturday = resolveBookingSchedule({
        serviceKey: 'SLUB',
        date: '2026-09-05',
        rules: defaultBookingScheduleRules('SLUB'),
    });
    assert.deepEqual(buildBookingSlots(monday!, 12 * 60), []);
    assert.equal(buildBookingSlots(saturday!, 12 * 60).at(-1)?.start, '14:00');
    assert.equal(buildBookingSlots(saturday!, 12 * 60).at(-1)?.end, '02:00');
});

test('date exceptions close a day or replace its weekly hours', () => {
    const rules = defaultBookingScheduleRules('SESJA');
    const closed = resolveBookingSchedule({
        serviceKey: 'SESJA',
        date: '2026-09-10',
        rules,
        exceptions: [{
            serviceKey: 'SESJA',
            date: '2026-09-10',
            mode: 'CLOSED',
            startMinute: null,
            endMinute: null,
            slotIntervalMinutes: null,
        }],
    });
    assert.equal(closed?.enabled, false);

    const custom = resolveBookingSchedule({
        serviceKey: 'SESJA',
        date: '2026-09-10',
        rules,
        exceptions: [{
            serviceKey: 'SESJA',
            date: '2026-09-10',
            mode: 'CUSTOM',
            startMinute: 16 * 60,
            endMinute: 20 * 60,
            slotIntervalMinutes: 30,
        }],
    });
    assert.equal(custom?.startMinute, 960);
    assert.equal(custom?.slotIntervalMinutes, 30);
});

test('checkout slot validation accepts midnight correctly and rejects tampering', () => {
    const schedule = resolveBookingSchedule({
        serviceKey: 'URODZINY',
        date: '2026-09-05',
        rules: defaultBookingScheduleRules('URODZINY'),
    })!;

    assert.equal(validateBookingSlot({
        schedule,
        durationMinutes: 3 * 60,
        startTime: '23:00',
        endTime: '02:00',
        endDayOffset: 1,
    })?.endDayOffset, 1);
    assert.equal(validateBookingSlot({
        schedule,
        durationMinutes: 3 * 60,
        startTime: '23:00',
        endTime: '01:00',
        endDayOffset: 1,
    }), null);
    assert.equal(formatBookingTimeRange('23:00', '02:00'), '23:00–02:00 następnego dnia');
});

test('night booking conflicts with the neighbouring calendar day', () => {
    const existing = [{
        date: new Date('2026-09-05T23:00:00.000Z'),
        start_time: '23:00',
        end_time: '02:00',
        blocks_entire_day: false,
    }];
    assert.equal(hasBookingDateTimeConflict(existing, {
        dateISO: '2026-09-06',
        blocksEntireDay: false,
        startTime: '01:00',
        endTime: '03:00',
        endDayOffset: 0,
    }), true);
    assert.equal(hasBookingDateTimeConflict(existing, {
        dateISO: '2026-09-06',
        blocksEntireDay: false,
        startTime: '02:00',
        endTime: '03:00',
        endDayOffset: 0,
    }), false);
});

test('availability is administered and the public page renders one compact picker', async () => {
    const [adminApi, adminPage, publicPage, migration] = await Promise.all([
        readFile(new URL('../../src/app/api/admin/booking-availability/route.ts', import.meta.url), 'utf8'),
        readFile(new URL('../../src/app/admin/rezerwacja/page.tsx', import.meta.url), 'utf8'),
        readFile(new URL('../../src/app/rezerwacja/page.tsx', import.meta.url), 'utf8'),
        readFile(new URL('../../prisma/migrations/20260827120000_booking_service_availability/migration.sql', import.meta.url), 'utf8'),
    ]);
    assert.match(adminApi, /export async function PUT[\s\S]*?requireAuth\(request\)/);
    assert.match(adminApi, /export async function POST[\s\S]*?requireAuth\(request\)/);
    assert.match(adminPage, /<BookingAvailabilityEditor/);
    assert.match(publicPage, /id="booking-start-time"/);
    assert.match(publicPage, /bookingCopy\.nextDayLabel/);
    assert.doesNotMatch(publicPage, /grid-cols-4 md:grid-cols-6 lg:grid-cols-8/);
    assert.match(migration, /"end_minute" <= 1560/);
    assert.match(migration, /'PRZYJECIE', 6, true, 480, 1560/);
    assert.match(migration, /'URODZINY', 7, true, 480, 1560/);
});
