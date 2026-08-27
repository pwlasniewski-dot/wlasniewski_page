import { isValidBookingDate } from './bookingDate';

export const BOOKING_SERVICE_KEYS = ['SESJA', 'SLUB', 'PRZYJECIE', 'URODZINY', 'DRON'] as const;

export type BookingServiceKey = (typeof BOOKING_SERVICE_KEYS)[number];
export type BookingScheduleExceptionMode = 'CLOSED' | 'CUSTOM';

export type BookingScheduleRule = {
    serviceKey: BookingServiceKey;
    weekday: number;
    enabled: boolean;
    startMinute: number;
    endMinute: number;
    slotIntervalMinutes: number;
};

export type BookingScheduleException = {
    id?: number;
    serviceKey: BookingServiceKey;
    date: string;
    mode: BookingScheduleExceptionMode;
    startMinute: number | null;
    endMinute: number | null;
    slotIntervalMinutes: number | null;
    note?: string | null;
};

export type ResolvedBookingSchedule = {
    serviceKey: BookingServiceKey;
    date: string;
    weekday: number;
    enabled: boolean;
    startMinute: number;
    endMinute: number;
    slotIntervalMinutes: number;
    exceptionMode: BookingScheduleExceptionMode | null;
};

export type BookingSlot = {
    start: string;
    end: string;
    endDayOffset: number;
    startMinute: number;
    endMinute: number;
};

export const BOOKING_SERVICE_LABELS: Record<BookingServiceKey, string> = {
    SESJA: 'Sesja',
    SLUB: 'Ślub',
    PRZYJECIE: 'Przyjęcie',
    URODZINY: 'Urodziny',
    DRON: 'Dron',
};

function stripPolishCharacters(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z]/g, '');
}

export function normalizeBookingServiceKey(value?: string | null): BookingServiceKey {
    const normalized = stripPolishCharacters(String(value || ''));
    if (normalized.includes('SLUB')) return 'SLUB';
    if (normalized.includes('PRZYJEC')) return 'PRZYJECIE';
    if (normalized.includes('URODZ')) return 'URODZINY';
    if (normalized.includes('DRON')) return 'DRON';
    return 'SESJA';
}

export function bookingWeekday(dateISO: string): number | null {
    if (!isValidBookingDate(dateISO)) return null;
    const [year, month, day] = dateISO.split('-').map(Number);
    const jsDay = new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
    return jsDay === 0 ? 7 : jsDay;
}

function defaultWindow(serviceKey: BookingServiceKey, weekday: number) {
    const isWeekend = weekday === 6 || weekday === 7;
    const isFriday = weekday === 5;

    if (serviceKey === 'SESJA') {
        return isWeekend
            ? { startMinute: 9 * 60, endMinute: 20 * 60, slotIntervalMinutes: 60 }
            : { startMinute: 18 * 60, endMinute: 22 * 60, slotIntervalMinutes: 60 };
    }

    if (serviceKey === 'DRON') {
        return isWeekend
            ? { startMinute: 9 * 60, endMinute: 20 * 60, slotIntervalMinutes: 60 }
            : { startMinute: 17 * 60, endMinute: 21 * 60, slotIntervalMinutes: 60 };
    }

    if (isWeekend) {
        return { startMinute: 8 * 60, endMinute: 26 * 60, slotIntervalMinutes: 60 };
    }
    if (isFriday) {
        return { startMinute: 17 * 60, endMinute: 26 * 60, slotIntervalMinutes: 60 };
    }
    return { startMinute: 17 * 60, endMinute: 23 * 60, slotIntervalMinutes: 60 };
}

export function defaultBookingScheduleRules(serviceKey: BookingServiceKey): BookingScheduleRule[] {
    return Array.from({ length: 7 }, (_, index) => {
        const weekday = index + 1;
        return {
            serviceKey,
            weekday,
            enabled: true,
            ...defaultWindow(serviceKey, weekday),
        };
    });
}

export function mergeBookingScheduleRules(
    serviceKey: BookingServiceKey,
    storedRules: BookingScheduleRule[],
): BookingScheduleRule[] {
    const byWeekday = new Map(storedRules.map(rule => [rule.weekday, rule]));
    return defaultBookingScheduleRules(serviceKey).map(defaultRule => byWeekday.get(defaultRule.weekday) || defaultRule);
}

export function resolveBookingSchedule(input: {
    serviceKey: BookingServiceKey;
    date: string;
    rules: BookingScheduleRule[];
    exceptions?: BookingScheduleException[];
}): ResolvedBookingSchedule | null {
    const weekday = bookingWeekday(input.date);
    if (weekday === null) return null;

    const rule = mergeBookingScheduleRules(input.serviceKey, input.rules).find(item => item.weekday === weekday);
    if (!rule) return null;

    const exception = input.exceptions?.find(item => item.serviceKey === input.serviceKey && item.date === input.date);
    if (exception?.mode === 'CLOSED') {
        return {
            serviceKey: input.serviceKey,
            date: input.date,
            weekday,
            enabled: false,
            startMinute: rule.startMinute,
            endMinute: rule.endMinute,
            slotIntervalMinutes: rule.slotIntervalMinutes,
            exceptionMode: 'CLOSED',
        };
    }

    if (
        exception?.mode === 'CUSTOM'
        && exception.startMinute !== null
        && exception.endMinute !== null
        && exception.slotIntervalMinutes !== null
    ) {
        return {
            serviceKey: input.serviceKey,
            date: input.date,
            weekday,
            enabled: true,
            startMinute: exception.startMinute,
            endMinute: exception.endMinute,
            slotIntervalMinutes: exception.slotIntervalMinutes,
            exceptionMode: 'CUSTOM',
        };
    }

    return {
        serviceKey: input.serviceKey,
        date: input.date,
        weekday,
        enabled: rule.enabled,
        startMinute: rule.startMinute,
        endMinute: rule.endMinute,
        slotIntervalMinutes: rule.slotIntervalMinutes,
        exceptionMode: null,
    };
}

export function clockToMinute(value?: string | null): number | null {
    const match = /^(?:[01]\d|2[0-3]):[0-5]\d$/.exec(String(value || ''));
    if (!match) return null;
    const [hours, minutes] = String(value).split(':').map(Number);
    return hours * 60 + minutes;
}

export function minuteToClock(value: number): string {
    const normalized = ((Math.round(value) % 1440) + 1440) % 1440;
    return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
}

export function formatScheduleMinute(value: number): string {
    const suffix = value >= 1440 ? ' następnego dnia' : '';
    return `${minuteToClock(value)}${suffix}`;
}

export function formatBookingTimeRange(start?: string | null, end?: string | null): string | undefined {
    if (!start) return undefined;
    if (!end) return start;
    const startMinute = clockToMinute(start);
    const endMinute = clockToMinute(end);
    const nextDay = startMinute !== null && endMinute !== null && endMinute <= startMinute;
    return `${start}–${end}${nextDay ? ' następnego dnia' : ''}`;
}

export function createBookingSlot(startMinute: number, durationMinutes: number): BookingSlot {
    const endMinute = startMinute + durationMinutes;
    return {
        start: minuteToClock(startMinute),
        end: minuteToClock(endMinute),
        endDayOffset: Math.floor(endMinute / 1440),
        startMinute,
        endMinute,
    };
}

export function buildBookingSlots(schedule: ResolvedBookingSchedule, durationMinutes: number): BookingSlot[] {
    if (!schedule.enabled || durationMinutes <= 0 || schedule.endMinute <= schedule.startMinute) return [];
    const interval = schedule.slotIntervalMinutes === 30 ? 30 : 60;
    const slots: BookingSlot[] = [];
    for (let start = schedule.startMinute; start + durationMinutes <= schedule.endMinute; start += interval) {
        // Początek usługi zawsze należy do dnia wybranego w kalendarzu.
        if (start >= 1440) break;
        slots.push(createBookingSlot(start, durationMinutes));
    }
    return slots;
}

export function validateBookingSlot(input: {
    schedule: ResolvedBookingSchedule;
    durationMinutes: number;
    startTime?: string | null;
    endTime?: string | null;
    endDayOffset?: number | null;
}): BookingSlot | null {
    const startMinute = clockToMinute(input.startTime);
    const endClockMinute = clockToMinute(input.endTime);
    if (startMinute === null || endClockMinute === null) return null;

    const expected = createBookingSlot(startMinute, input.durationMinutes);
    const suppliedDayOffset = Number.isInteger(input.endDayOffset)
        ? Number(input.endDayOffset)
        : endClockMinute <= startMinute ? 1 : 0;

    if (
        expected.end !== input.endTime
        || expected.endDayOffset !== suppliedDayOffset
        || startMinute < input.schedule.startMinute
        || expected.endMinute > input.schedule.endMinute
        || (startMinute - input.schedule.startMinute) % input.schedule.slotIntervalMinutes !== 0
    ) return null;

    return expected;
}

export function isValidScheduleWindow(input: {
    enabled: boolean;
    startMinute: number;
    endMinute: number;
    slotIntervalMinutes: number;
}) {
    if (!input.enabled) return true;
    return Number.isInteger(input.startMinute)
        && Number.isInteger(input.endMinute)
        && input.startMinute >= 0
        && input.startMinute < 1440
        && input.endMinute > input.startMinute
        && input.endMinute <= 1560
        && [30, 60].includes(input.slotIntervalMinutes)
        && input.startMinute % 30 === 0
        && input.endMinute % 30 === 0;
}
