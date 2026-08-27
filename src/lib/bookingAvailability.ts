import { isValidBookingDate } from './bookingDate';

export type BookingAvailabilityRecord = {
    blocks_entire_day?: boolean | null;
    start_time?: string | null;
    end_time?: string | null;
};

export type CalendarDayAvailability = {
    fullDay?: boolean;
    booked?: string[];
    ranges?: Array<{ start: string; end: string }>;
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
                return [{ start: range.start, end: range.end }];
            })
            : [];

        availability[dateISO] = {
            fullDay: day.fullDay === true,
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
    const requestedEnd = parseBookingTime(requested.endTime);
    if (requestedStart === null || requestedEnd === null || requestedEnd <= requestedStart) return true;

    return existingBookings.some(booking => {
        if (booking.blocks_entire_day) return true;
        const existingStart = parseBookingTime(booking.start_time);
        const existingEnd = parseBookingTime(booking.end_time);
        // Legacy reservation without a reliable range is treated conservatively.
        if (existingStart === null || existingEnd === null || existingEnd <= existingStart) return true;
        return requestedStart < existingEnd && existingStart < requestedEnd;
    });
}
