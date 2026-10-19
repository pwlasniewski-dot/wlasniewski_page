/**
 * GET /api/admin/calendar-events?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Zwraca **zunifikowany** kalendarz wydarzeń:
 *   - Booking (formalne rezerwacje z `/rezerwacja`)
 *   - Offer (wyceny ze statusem != draft/rejected, z parsowaną datą z template_data.eventDate)
 *   - PhotoChallenge (foto-wyzwania ze statusem != draft i z session_date)
 *
 * Po stronie frontu (BookingsCalendar) wszystko renderuje się tym samym komponentem.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';
import { isValidBookingDate } from '@/lib/bookingDate';
import { hasBookingDateTimeConflict, parseBookingTime } from '@/lib/bookingAvailability';
import { isBookingBlockingAvailability } from '@/lib/bookingStatus';
import { acquireAdvisoryTransactionLock } from '@/lib/db/advisoryLock';
import { loadCalendarEvents } from '@/lib/calendar/events';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const events = await loadCalendarEvents({ from: from || undefined, to: to || undefined });

    return NextResponse.json({
        events,
        counts: {
            bookings: events.filter(e => e.source === 'booking').length,
            offers: events.filter(e => e.source === 'offer').length,
            challenges: events.filter(e => e.source === 'challenge').length,
            contracts: events.filter(e => e.source === 'contract').length,
            workshops: events.filter(e => e.source === 'workshop').length,
            total: events.length,
        },
    });
}

/** Administrator enters an offline booking into the existing booking register.
 * No checkout, payment, voucher redemption or email is triggered here. */
export async function POST(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;
    try {
        const body = await request.json();
        const text = (key: string, max: number) => {
            const value = body?.[key];
            if (value == null) return '';
            if (typeof value !== 'string' || value.trim().length > max) throw new Error('CALENDAR_INVALID_INPUT');
            return value.trim();
        };
        const date = typeof body?.date === 'string' ? body.date : '';
        const start = typeof body?.start_time === 'string' ? body.start_time : '';
        const end = typeof body?.end_time === 'string' ? body.end_time : '';
        const name = text('client_name', 200);
        const service = text('service', 200);
        const email = text('email', 254);
        const price = body?.price;
        const startMinute = parseBookingTime(start), endMinute = parseBookingTime(end);
        if (!isValidBookingDate(date) || !name || !service || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
            || startMinute === null || endMinute === null || endMinute <= startMinute
            || body?.price === '' || body?.price == null || !Number.isSafeInteger(price) || price < 0 || price > 2147483647) {
            return NextResponse.json({ message: 'Uzupełnij klienta, e-mail, usługę, datę, cenę w pełnych złotych i godziny (koniec po początku).' }, { status: 400 });
        }
        const booking = await prisma.$transaction(async tx => {
            await acquireAdvisoryTransactionLock(tx, `booking:${date}`);
            const startDate = new Date(`${date}T00:00:00.000Z`);
            const previous = new Date(startDate); previous.setUTCDate(previous.getUTCDate() - 1);
            const next = new Date(startDate); next.setUTCDate(next.getUTCDate() + 1);
            const existing = await tx.booking.findMany({
                where: { date: { gte: previous, lt: next } },
                select: { date: true, blocks_entire_day: true, start_time: true, end_time: true, status: true, created_at: true },
            });
            if (hasBookingDateTimeConflict(existing.filter(b => isBookingBlockingAvailability(b)), {
                dateISO: date, startTime: start, endTime: end, blocksEntireDay: false, endDayOffset: 0,
            })) throw new Error('CALENDAR_CONFLICT');
            return tx.booking.create({ data: {
                date: startDate, start_time: start, end_time: end, client_name: name, email,
                service, package: text('package', 200) || 'Ustalenia indywidualne', price,
                phone: text('phone', 50) || null, venue_place: text('venue_place', 300) || null,
                notes: text('notes', 2000) || null, status: 'confirmed', booking_source: 'admin_calendar',
            }, select: { id: true } });
        });
        return NextResponse.json({ ok: true, id: booking.id }, { status: 201 });
    } catch (error) {
        if (error instanceof Error && error.message === 'CALENDAR_INVALID_INPUT') return NextResponse.json({ message: 'Sprawdź format i długość pól formularza.' }, { status: 400 });
        if (error instanceof SyntaxError) return NextResponse.json({ message: 'Nieprawidłowe dane formularza.' }, { status: 400 });
        if (error instanceof Error && error.message === 'CALENDAR_CONFLICT') {
            return NextResponse.json({ message: 'Ten termin koliduje z istniejącą rezerwacją. Wybierz inne godziny.' }, { status: 409 });
        }
        console.error('[calendar-events] Create failed', error);
        return NextResponse.json({ message: 'Nie udało się zapisać terminu. Sprawdź kalendarz przed ponowieniem.' }, { status: 500 });
    }
}
