import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import prisma from '@/lib/db/prisma';
import {
    BOOKING_SERVICE_KEYS,
    isValidScheduleWindow,
    type BookingServiceKey,
} from '@/lib/bookingSchedule';
import { loadAllBookingScheduleConfigurations } from '@/lib/bookingScheduleRepository';
import { dateISOInTimeZone, isValidBookingDate } from '@/lib/bookingDate';

const schemaUnavailableMessage = 'Grafik oczekuje na wdrożenie migracji bazy danych.';

function isKnownService(value: unknown): value is BookingServiceKey {
    return typeof value === 'string' && BOOKING_SERVICE_KEYS.includes(value as BookingServiceKey);
}

function cleanNote(value: unknown) {
    const note = typeof value === 'string' ? value.trim() : '';
    return note ? note.slice(0, 160) : null;
}

function isScheduleSchemaUnavailable(error: unknown) {
    const candidate = error as { code?: string };
    return candidate?.code === 'P2021'
        || candidate?.code === 'P2022';
}

export async function GET(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const today = dateISOInTimeZone(new Date(), 'Europe/Warsaw');
    const configurations = await loadAllBookingScheduleConfigurations({ fromDate: today });
    return NextResponse.json({ ok: true, configurations });
}

export async function PUT(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        if (!isKnownService(body?.serviceKey) || !Array.isArray(body?.rules) || body.rules.length !== 7) {
            return NextResponse.json({ ok: false, message: 'Nieprawidłowy grafik tygodniowy.' }, { status: 400 });
        }

        const serviceKey: BookingServiceKey = body.serviceKey;
        const weekdays = new Set<number>();
        const rules: Array<{
            weekday: number;
            enabled: boolean;
            startMinute: number;
            endMinute: number;
            slotIntervalMinutes: number;
        }> = (body.rules as Array<Record<string, unknown>>).map(raw => {
            const weekday = Number(raw.weekday);
            const rule = {
                enabled: raw.enabled === true,
                startMinute: Number(raw.startMinute),
                endMinute: Number(raw.endMinute),
                slotIntervalMinutes: Number(raw.slotIntervalMinutes),
            };
            if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7 || weekdays.has(weekday) || !isValidScheduleWindow(rule)) {
                throw new Error('INVALID_SCHEDULE');
            }
            weekdays.add(weekday);
            return { weekday, ...rule };
        });

        await prisma.$transaction(rules.map(rule => prisma.bookingAvailabilityRule.upsert({
            where: {
                service_key_day_of_week: {
                    service_key: serviceKey,
                    day_of_week: rule.weekday,
                },
            },
            update: {
                enabled: rule.enabled,
                start_minute: rule.startMinute,
                end_minute: rule.endMinute,
                slot_interval_minutes: rule.slotIntervalMinutes,
            },
            create: {
                service_key: serviceKey,
                day_of_week: rule.weekday,
                enabled: rule.enabled,
                start_minute: rule.startMinute,
                end_minute: rule.endMinute,
                slot_interval_minutes: rule.slotIntervalMinutes,
            },
        })));

        return NextResponse.json({ ok: true });
    } catch (error) {
        if ((error as Error)?.message === 'INVALID_SCHEDULE') {
            return NextResponse.json({ ok: false, message: 'Każdy dzień musi mieć poprawne godziny i interwał.' }, { status: 400 });
        }
        if (isScheduleSchemaUnavailable(error)) {
            return NextResponse.json({ ok: false, message: schemaUnavailableMessage }, { status: 503 });
        }
        console.error('[booking-availability] Failed to save rules', error);
        return NextResponse.json({ ok: false, message: 'Nie udało się zapisać grafiku.' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const serviceKey = body?.serviceKey;
        const date = String(body?.date || '');
        const mode = body?.mode === 'CUSTOM' ? 'CUSTOM' : body?.mode === 'CLOSED' ? 'CLOSED' : null;
        if (
            !isKnownService(serviceKey)
            || !isValidBookingDate(date)
            || date < dateISOInTimeZone(new Date(), 'Europe/Warsaw')
            || !mode
        ) {
            return NextResponse.json({ ok: false, message: 'Nieprawidłowy wyjątek grafiku.' }, { status: 400 });
        }

        const customWindow = {
            enabled: true,
            startMinute: Number(body?.startMinute),
            endMinute: Number(body?.endMinute),
            slotIntervalMinutes: Number(body?.slotIntervalMinutes),
        };
        if (mode === 'CUSTOM' && !isValidScheduleWindow(customWindow)) {
            return NextResponse.json({ ok: false, message: 'Nieprawidłowe godziny wyjątku.' }, { status: 400 });
        }

        const exception = await prisma.bookingAvailabilityException.upsert({
            where: {
                service_key_date: {
                    service_key: serviceKey,
                    date: new Date(`${date}T00:00:00.000Z`),
                },
            },
            update: {
                mode,
                start_minute: mode === 'CUSTOM' ? customWindow.startMinute : null,
                end_minute: mode === 'CUSTOM' ? customWindow.endMinute : null,
                slot_interval_minutes: mode === 'CUSTOM' ? customWindow.slotIntervalMinutes : null,
                note: cleanNote(body?.note),
            },
            create: {
                service_key: serviceKey,
                date: new Date(`${date}T00:00:00.000Z`),
                mode,
                start_minute: mode === 'CUSTOM' ? customWindow.startMinute : null,
                end_minute: mode === 'CUSTOM' ? customWindow.endMinute : null,
                slot_interval_minutes: mode === 'CUSTOM' ? customWindow.slotIntervalMinutes : null,
                note: cleanNote(body?.note),
            },
        });

        return NextResponse.json({ ok: true, id: exception.id });
    } catch (error) {
        if (isScheduleSchemaUnavailable(error)) {
            return NextResponse.json({ ok: false, message: schemaUnavailableMessage }, { status: 503 });
        }
        console.error('[booking-availability] Failed to save exception', error);
        return NextResponse.json({ ok: false, message: 'Nie udało się zapisać wyjątku.' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const exceptionId = Number(new URL(request.url).searchParams.get('exceptionId'));
    if (!Number.isInteger(exceptionId) || exceptionId <= 0) {
        return NextResponse.json({ ok: false, message: 'Nieprawidłowy wyjątek.' }, { status: 400 });
    }

    try {
        await prisma.bookingAvailabilityException.delete({ where: { id: exceptionId } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        if (isScheduleSchemaUnavailable(error)) {
            return NextResponse.json({ ok: false, message: schemaUnavailableMessage }, { status: 503 });
        }
        console.error('[booking-availability] Failed to delete exception', error);
        return NextResponse.json({ ok: false, message: 'Nie udało się usunąć wyjątku.' }, { status: 500 });
    }
}
