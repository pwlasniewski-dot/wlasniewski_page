import { isValidBookingDate } from './bookingDate';

export type BookingAvailabilityRecord = {
    date?: Date | string | null;
    blocks_entire_day?: boolean | null;
    start_time?: string | null;
    end_time?: string | null;
    end_day_offset?: number | null;
};

export type CalendarDayAvailability = {
    fullDay?: boolean;
    closed?: boolean;
    booked?: string[];
    ranges?: Array<{ start: string; end: string; endDayOffset?: number }>;
};

export type CalendarAvailabilityPayload = {
    availability: Record<string, CalendarDayAvailability>;
    minBookingDate: string;
};

export const DEFAULT_AVAILABLE_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17] as const;

export function parseAvailableHours(value?: string | null): number[] {
    const parsed = String(value || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
        .map(item => Number(item.trim()))
        .filter(hour => Number.isInteger(hour) && hour >= 0 && hour <= 23);
    const unique = [...new Set(parsed)].sort((a, b) => a - b);
    return unique.length > 0 ? unique : [...DEFAULT_AVAILABLE_HOURS];
}

export function parseBookingTime(value?: string | null): number | null {
    const match = /^(?:[01]\d|2[0-3]):[0-5]\d$/.exec(String(value || ''));
    if (!match) return null;
    const [hours, minutes] = String(value).split(':').map(Number);
    return hours * 60 + minutes;
}

export function parseCalendarAvailabilityPayload(value: unknown): CalendarAvailabilityPayload | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

    const payload = value as Record<string, unknown>;
    const minBookingDate = payload.minBookingDate;
    const rawAvailability = payload.availability;

    if (typeof minBookingDate !== 'string' || !isValidBookingDate(minBookingDate)) return null;
    if (!rawAvailability || typeof rawAvailability !== 'object' || Array.isArray(rawAvailability)) return null;

    const availability: Record<string, CalendarDayAvailability> = {};
    for (const [dateISO, rawDay] of Object.entries(rawAvailability as Record<string, unknown>)) {
        if (!isValidBookingDate(dateISO) || !rawDay || typeof rawDay !== 'object' || Array.isArray(rawDay)) continue;

        const day = rawDay as Record<string, unknown>;
        const booked = Array.isArray(day.booked)
            ? day.booked.filter((item): item is string => typeof item === 'string' && parseBookingTime(item) !== null)
            : [];
        const ranges = Array.isArray(day.ranges)
            ? day.ranges.flatMap(item => {
                if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
                const range = item as Record<string, unknown>;
                if (typeof range.start !== 'string' || typeof range.end !== 'string') return [];
                if (parseBookingTime(range.start) === null || parseBookingTime(range.end) === null) return [];
                return [{
                    start: range.start,
                    end: range.end,
                    ...(range.endDayOffset === 1 ? { endDayOffset: 1 } : {}),
                }];
            })
            : [];

        availability[dateISO] = {
            fullDay: day.fullDay === true,
            ...(day.closed === true ? { closed: true } : {}),
            booked,
            ranges,
        };
    }

    return { availability, minBookingDate };
}

export function isRequestedTimeAllowed(input: {
    startTime?: string | null;
    endTime?: string | null;
    durationHours: number;
    availableHours?: string | null;
    blocksEntireDay: boolean;
}) {
    if (input.blocksEntireDay) return true;
    const start = parseBookingTime(input.startTime);
    const end = parseBookingTime(input.endTime);
    const durationMinutes = Math.max(1, input.durationHours) * 60;
    if (start === null || end === null || end - start !== durationMinutes || start % 60 !== 0) return false;

    const startHour = start / 60;
    const available = new Set(parseAvailableHours(input.availableHours));
    return Array.from({ length: Math.max(1, input.durationHours) }, (_, index) => startHour + index)
        .every(hour => available.has(hour));
}

export function hasBookingConflict(
    existingBookings: BookingAvailabilityRecord[],
    requested: { blocksEntireDay: boolean; startTime?: string | null; endTime?: string | null },
) {
    if (existingBookings.length === 0) return false;
    if (requested.blocksEntireDay) return true;

    const requestedStart = parseBookingTime(requested.startTime);
    const requestedEndClock = parseBookingTime(requested.endTime);
    if (requestedStart === null || requestedEndClock === null) return true;
    const requestedEnd = requestedEndClock + (requestedEndClock <= requestedStart ? 1440 : 0);

    return existingBookings.some(booking => {
        if (booking.blocks_entire_day) return true;
        const existingStart = parseBookingTime(booking.start_time);
        const existingEndClock = parseBookingTime(booking.end_time);
        // Legacy reservation without a reliable range is treated conservatively.
        if (existingStart === null || existingEndClock === null) return true;
        const existingEnd = existingEndClock + (
            booking.end_day_offset === 1 || (booking.end_day_offset == null && existingEndClock <= existingStart)
                ? 1440
                : 0
        );
        if (existingEnd <= existingStart) return true;
        return requestedStart < existingEnd && existingStart < requestedEnd;
    });
}

function dateDifferenceInDays(dateISO: string, anchorDateISO: string) {
    const value = Date.parse(`${dateISO}T00:00:00.000Z`);
    const anchor = Date.parse(`${anchorDateISO}T00:00:00.000Z`);
    if (!Number.isFinite(value) || !Number.isFinite(anchor)) return null;
    return Math.round((value - anchor) / 86_400_000);
}

function recordDateISO(value: Date | string | null | undefined, fallback: string) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
    const candidate = String(value || '').slice(0, 10);
    return isValidBookingDate(candidate) ? candidate : fallback;
}

function absoluteInterval(
    booking: BookingAvailabilityRecord,
    anchorDateISO: string,
): { start: number; end: number; bookingDateISO: string } | null {
    const bookingDateISO = recordDateISO(booking.date, anchorDateISO);
    const dayDifference = dateDifferenceInDays(bookingDateISO, anchorDateISO);
    if (dayDifference === null) return null;
    const dayStart = dayDifference * 1440;
    const startClock = parseBookingTime(booking.start_time);
    const endClock = parseBookingTime(booking.end_time);

    if (booking.blocks_entire_day) {
        const actualStart = startClock === null ? dayStart : dayStart + startClock;
        const inferredOffset = booking.end_day_offset === 1 || (
            booking.end_day_offset == null
            && startClock !== null
            && endClock !== null
            && endClock <= startClock
        ) ? 1 : 0;
        const actualEnd = endClock === null ? dayStart + 1440 : dayStart + endClock + inferredOffset * 1440;
        return { start: Math.min(dayStart, actualStart), end: Math.max(dayStart + 1440, actualEnd), bookingDateISO };
    }

    if (startClock === null || endClock === null) return null;
    const inferredOffset = booking.end_day_offset === 1 || (
        booking.end_day_offset == null && endClock <= startClock
    ) ? 1 : 0;
    const start = dayStart + startClock;
    const end = dayStart + endClock + inferredOffset * 1440;
    if (end <= start) return null;
    return { start, end, bookingDateISO };
}

/**
 * Compares reservations on an absolute timeline anchored to the selected date.
 * It protects both sides of midnight and keeps the business rule that a package
 * marked as exclusive blocks every other reservation anchored to that day.
 */
export function hasBookingDateTimeConflict(
    existingBookings: BookingAvailabilityRecord[],
    requested: {
        dateISO: string;
        blocksEntireDay: boolean;
        startTime?: string | null;
        endTime?: string | null;
        endDayOffset?: number | null;
    },
) {
    const requestedStart = parseBookingTime(requested.startTime);
    const requestedEndClock = parseBookingTime(requested.endTime);
    if (requestedStart === null || requestedEndClock === null) return true;
    const requestedEnd = requestedEndClock + (
        requested.endDayOffset === 1 || (requested.endDayOffset == null && requestedEndClock <= requestedStart) ? 1440 : 0
    );
    if (requestedEnd <= requestedStart) return true;

    return existingBookings.some(booking => {
        const bookingDateISO = recordDateISO(booking.date, requested.dateISO);
        if (bookingDateISO === requested.dateISO && (requested.blocksEntireDay || booking.blocks_entire_day)) {
            return true;
        }
        const interval = absoluteInterval(booking, requested.dateISO);
        // A legacy row on the selected day without a reliable time stays blocked.
        if (!interval) return bookingDateISO === requested.dateISO;
        return requestedStart < interval.end && interval.start < requestedEnd;
    });
}
