const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const pad = (value: number) => String(value).padStart(2, '0');

export function localDateISO(date: Date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dateISOInTimeZone(date: Date, timeZone: string) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
}

export function isValidBookingDate(dateISO: string) {
    if (!ISO_DATE_PATTERN.test(dateISO)) return false;
    const [year, month, day] = dateISO.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year
        && date.getUTCMonth() === month - 1
        && date.getUTCDate() === day;
}

export function isPastBookingDate(dateISO: string, now = new Date(), timeZone?: string) {
    if (!isValidBookingDate(dateISO)) return true;
    const today = timeZone ? dateISOInTimeZone(now, timeZone) : localDateISO(now);
    return dateISO < today;
}

export function minimumBookingDateISO(minDaysAhead: number, now = new Date(), timeZone = 'Europe/Warsaw') {
    const safeDays = Number.isFinite(minDaysAhead) ? Math.max(0, Math.min(365, Math.floor(minDaysAhead))) : 0;
    const today = dateISOInTimeZone(now, timeZone);
    const [year, month, day] = today.split('-').map(Number);
    const minimum = new Date(Date.UTC(year, month - 1, day + safeDays));
    return `${minimum.getUTCFullYear()}-${pad(minimum.getUTCMonth() + 1)}-${pad(minimum.getUTCDate())}`;
}

export function isBookingDateAllowed(
    dateISO: string,
    minDaysAhead: number,
    now = new Date(),
    timeZone = 'Europe/Warsaw',
) {
    return isValidBookingDate(dateISO) && dateISO >= minimumBookingDateISO(minDaysAhead, now, timeZone);
}

export function isBookingStartInFuture(
    dateISO: string,
    startTime: unknown,
    now = new Date(),
    timeZone = 'Europe/Warsaw',
) {
    if (!isValidBookingDate(dateISO) || typeof startTime !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
        return false;
    }
    const currentDate = dateISOInTimeZone(now, timeZone);
    if (dateISO !== currentDate) return dateISO > currentDate;

    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(now);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    const currentTime = `${values.hour}:${values.minute}`;
    return startTime > currentTime;
}

export function bookingDateUtcRange(dateISO: string) {
    if (!isValidBookingDate(dateISO)) return null;
    const [year, month, day] = dateISO.split('-').map(Number);
    const start = new Date(Date.UTC(year, month - 1, day));
    const end = new Date(Date.UTC(year, month - 1, day + 1));
    return { start, end };
}

export function isCurrentOrPastMonth(cursor: Date, now = new Date()) {
    const cursorMonth = cursor.getFullYear() * 12 + cursor.getMonth();
    const currentMonth = now.getFullYear() * 12 + now.getMonth();
    return cursorMonth <= currentMonth;
}
