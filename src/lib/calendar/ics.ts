/**
 * iCalendar (.ics) generator for bookings.
 * Spec: RFC 5545. Compatible with Google Calendar, Apple Calendar, Outlook.
 */

type IcsBooking = {
    id: number;
    service: string;
    package: string;
    date: Date | string;
    start_time?: string | null;
    end_time?: string | null;
    client_name: string;
    email?: string | null;
    phone?: string | null;
    venue_city?: string | null;
    venue_place?: string | null;
    notes?: string | null;
    status: string;
    ics_uid?: string | null;
    updated_at?: Date | string;
};

function pad(n: number) {
    return n < 10 ? '0' + n : '' + n;
}

function formatIcsDate(d: Date): string {
    return (
        d.getUTCFullYear().toString() +
        pad(d.getUTCMonth() + 1) +
        pad(d.getUTCDate()) +
        'T' +
        pad(d.getUTCHours()) +
        pad(d.getUTCMinutes()) +
        pad(d.getUTCSeconds()) +
        'Z'
    );
}

function escapeIcs(s: string): string {
    return s
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');
}

function combineDateTime(date: Date, hhmm?: string | null, fallback = '10:00'): Date {
    const time = hhmm && /^\d{1,2}:\d{2}$/.test(hhmm) ? hhmm : fallback;
    const [h, m] = time.split(':').map(Number);
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d;
}

function statusToIcs(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'cancelled' || s === 'archived') return 'CANCELLED';
    if (s === 'pending') return 'TENTATIVE';
    return 'CONFIRMED';
}

export function bookingToVEvent(booking: IcsBooking): string {
    const date = typeof booking.date === 'string' ? new Date(booking.date) : booking.date;
    const dtStart = combineDateTime(date, booking.start_time, '10:00');
    const dtEnd = combineDateTime(date, booking.end_time, booking.start_time ? addHour(booking.start_time) : '12:00');
    if (dtEnd <= dtStart) {
        dtEnd.setTime(dtStart.getTime() + 60 * 60 * 1000);
    }

    const updated = booking.updated_at
        ? typeof booking.updated_at === 'string' ? new Date(booking.updated_at) : booking.updated_at
        : new Date();

    const uid = booking.ics_uid || `booking-${booking.id}@wlasniewski.pl`;
    const title = `${booking.service} \u2014 ${booking.client_name}`;
    const locParts = [booking.venue_place, booking.venue_city].filter(Boolean);
    const location = locParts.join(', ');
    const descParts = [
        `Pakiet: ${booking.package}`,
        booking.email ? `Email: ${booking.email}` : '',
        booking.phone ? `Telefon: ${booking.phone}` : '',
        booking.notes ? `Notatki: ${booking.notes}` : '',
        `Panel: https://wlasniewski.pl/admin/bookings?id=${booking.id}`,
    ].filter(Boolean).join('\n');

    return [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${formatIcsDate(updated)}`,
        `DTSTART:${formatIcsDate(dtStart)}`,
        `DTEND:${formatIcsDate(dtEnd)}`,
        `SUMMARY:${escapeIcs(title)}`,
        location ? `LOCATION:${escapeIcs(location)}` : '',
        `DESCRIPTION:${escapeIcs(descParts)}`,
        `STATUS:${statusToIcs(booking.status)}`,
        'END:VEVENT',
    ].filter(Boolean).join('\r\n');
}

function addHour(hhmm: string): string {
    const [h, m] = hhmm.split(':').map(Number);
    return pad((h + 1) % 24) + ':' + pad(m);
}

export function bookingsToIcs(bookings: IcsBooking[], calName = 'Rezerwacje \u2014 Wla\u015bniewski Foto'): string {
    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Wlasniewski Foto//Booking Calendar//PL',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${escapeIcs(calName)}`,
        'X-WR-TIMEZONE:Europe/Warsaw',
        ...bookings.map(bookingToVEvent),
        'END:VCALENDAR',
    ].join('\r\n');
}
