import prisma from '@/lib/db/prisma';
import {
    BOOKING_SERVICE_KEYS,
    defaultBookingScheduleRules,
    mergeBookingScheduleRules,
    normalizeBookingServiceKey,
    type BookingScheduleException,
    type BookingScheduleRule,
    type BookingServiceKey,
} from '@/lib/bookingSchedule';

type ScheduleConfiguration = {
    serviceKey: BookingServiceKey;
    rules: BookingScheduleRule[];
    exceptions: BookingScheduleException[];
    persisted: boolean;
};

function isScheduleSchemaUnavailable(error: unknown) {
    const candidate = error as { code?: string };
    return candidate?.code === 'P2021'
        || candidate?.code === 'P2022';
}

function dateISO(value: Date | string) {
    if (typeof value === 'string') return value.slice(0, 10);
    return value.toISOString().slice(0, 10);
}

function mapRule(row: {
    service_key: string;
    day_of_week: number;
    enabled: boolean;
    start_minute: number;
    end_minute: number;
    slot_interval_minutes: number;
}): BookingScheduleRule {
    return {
        serviceKey: normalizeBookingServiceKey(row.service_key),
        weekday: row.day_of_week,
        enabled: row.enabled,
        startMinute: row.start_minute,
        endMinute: row.end_minute,
        slotIntervalMinutes: row.slot_interval_minutes,
    };
}

function mapException(row: {
    id: number;
    service_key: string;
    date: Date;
    mode: string;
    start_minute: number | null;
    end_minute: number | null;
    slot_interval_minutes: number | null;
    note: string | null;
}): BookingScheduleException {
    return {
        id: row.id,
        serviceKey: normalizeBookingServiceKey(row.service_key),
        date: dateISO(row.date),
        mode: row.mode === 'CUSTOM' ? 'CUSTOM' : 'CLOSED',
        startMinute: row.start_minute,
        endMinute: row.end_minute,
        slotIntervalMinutes: row.slot_interval_minutes,
        note: row.note,
    };
}

export async function loadBookingScheduleConfiguration(input: {
    service?: string | null;
    fromDate?: string;
    toDate?: string;
}): Promise<ScheduleConfiguration> {
    const serviceKey = normalizeBookingServiceKey(input.service);
    try {
        const [storedRules, storedExceptions] = await Promise.all([
            prisma.bookingAvailabilityRule.findMany({
                where: { service_key: serviceKey },
                orderBy: { day_of_week: 'asc' },
            }),
            prisma.bookingAvailabilityException.findMany({
                where: {
                    service_key: serviceKey,
                    ...(input.fromDate || input.toDate ? {
                        date: {
                            ...(input.fromDate ? { gte: new Date(`${input.fromDate}T00:00:00.000Z`) } : {}),
                            ...(input.toDate ? { lte: new Date(`${input.toDate}T00:00:00.000Z`) } : {}),
                        },
                    } : {}),
                },
                orderBy: { date: 'asc' },
            }),
        ]);

        return {
            serviceKey,
            rules: mergeBookingScheduleRules(serviceKey, storedRules.map(mapRule)),
            exceptions: storedExceptions.map(mapException),
            persisted: storedRules.length > 0,
        };
    } catch (error) {
        if (!isScheduleSchemaUnavailable(error)) throw error;
        return {
            serviceKey,
            rules: defaultBookingScheduleRules(serviceKey),
            exceptions: [],
            persisted: false,
        };
    }
}

export async function loadAllBookingScheduleConfigurations(input?: {
    fromDate?: string;
    toDate?: string;
}): Promise<ScheduleConfiguration[]> {
    try {
        const [storedRules, storedExceptions] = await Promise.all([
            prisma.bookingAvailabilityRule.findMany({ orderBy: [{ service_key: 'asc' }, { day_of_week: 'asc' }] }),
            prisma.bookingAvailabilityException.findMany({
                where: input?.fromDate || input?.toDate ? {
                    date: {
                        ...(input?.fromDate ? { gte: new Date(`${input.fromDate}T00:00:00.000Z`) } : {}),
                        ...(input?.toDate ? { lte: new Date(`${input.toDate}T00:00:00.000Z`) } : {}),
                    },
                } : undefined,
                orderBy: [{ date: 'asc' }, { service_key: 'asc' }],
            }),
        ]);

        return BOOKING_SERVICE_KEYS.map(serviceKey => {
            const serviceRules = storedRules.filter(row => normalizeBookingServiceKey(row.service_key) === serviceKey).map(mapRule);
            return {
                serviceKey,
                rules: mergeBookingScheduleRules(serviceKey, serviceRules),
                exceptions: storedExceptions
                    .filter(row => normalizeBookingServiceKey(row.service_key) === serviceKey)
                    .map(mapException),
                persisted: serviceRules.length > 0,
            };
        });
    } catch (error) {
        if (!isScheduleSchemaUnavailable(error)) throw error;
        return BOOKING_SERVICE_KEYS.map(serviceKey => ({
            serviceKey,
            rules: defaultBookingScheduleRules(serviceKey),
            exceptions: [],
            persisted: false,
        }));
    }
}
