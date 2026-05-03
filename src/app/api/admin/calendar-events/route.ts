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
import { parsePolishDate, parsePolishTime } from '@/lib/calendar/polishDate';

export const dynamic = 'force-dynamic';

type CalendarEvent = {
    id: string;
    source: 'booking' | 'offer' | 'challenge' | 'contract';
    source_id: number;
    date: string;            // ISO date YYYY-MM-DD
    start_time: string | null;
    end_time: string | null;
    title: string;
    client_name: string;
    email: string | null;
    phone: string | null;
    status: string;
    price: number | null;
    venue: string | null;
    notes: string | null;
    photographer_id: number | null;
    detail_url: string;
    // Zaliczka (manualne ksiegowanie po wplywie na konto)
    deposit_amount: number | null;
    deposit_paid_at: string | null;
    deposit_due_at: string | null;
    deposit_status: 'paid' | 'overdue' | 'due_soon' | 'pending' | null;
};

function calcDepositStatus(amount: number | null | undefined, paidAt: Date | null | undefined, dueAt: Date | null | undefined, sessionDate: Date | null | undefined): CalendarEvent['deposit_status'] {
    if (amount == null || amount === 0) return null;
    if (paidAt) return 'paid';
    const now = new Date();
    const eff = dueAt || (sessionDate ? new Date(sessionDate.getTime() - 14 * 86400000) : null);
    if (!eff) return 'pending';
    if (eff < now) return 'overdue';
    if (eff.getTime() - now.getTime() < 7 * 86400000) return 'due_soon';
    return 'pending';
}

export async function GET(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) {
        const t = new Date(to);
        t.setHours(23, 59, 59, 999);
        dateFilter.lte = t;
    }

    const events: CalendarEvent[] = [];

    // ── 1) BOOKINGS (mają strukturalną kolumnę date) ─────────
    const bookings = await prisma.booking.findMany({
        where: from || to ? { date: dateFilter } : {},
        orderBy: { date: 'asc' },
        select: {
            id: true, service: true, package: true, price: true,
            date: true, start_time: true, end_time: true,
            client_name: true, email: true, phone: true,
            venue_city: true, venue_place: true, notes: true,
            status: true, photographer_id: true,
            deposit_amount: true, deposit_paid_at: true,
        },
    });
    for (const b of bookings) {
        events.push({
            id: `booking-${b.id}`,
            source: 'booking',
            source_id: b.id,
            date: b.date.toISOString().slice(0, 10),
            start_time: b.start_time,
            end_time: b.end_time,
            title: `${b.service} — ${b.package}`,
            client_name: b.client_name,
            email: b.email,
            phone: b.phone,
            status: b.status,
            price: b.price,
            venue: [b.venue_city, b.venue_place].filter(Boolean).join(', ') || null,
            notes: b.notes,
            photographer_id: b.photographer_id,
            detail_url: `/admin/bookings?id=${b.id}`,
            deposit_amount: b.deposit_amount ?? null,
            deposit_paid_at: b.deposit_paid_at ? b.deposit_paid_at.toISOString() : null,
            deposit_due_at: null,
            deposit_status: calcDepositStatus(b.deposit_amount, b.deposit_paid_at, null, b.date),
        });
    }

    // ── 2) OFFERS (preferujemy kolumnę session_date; fallback do template_data.eventDate) ─────
    const offers = await prisma.offer.findMany({
        where: {
            status: { in: ['sent', 'accepted', 'negotiating', 'pending'] },
            is_template: false,
        },
        select: {
            id: true, slug: true, title: true, status: true,
            total_price: true, client_email: true, template_data: true,
            session_date: true, session_time: true, session_end_time: true, session_duration_min: true,
            session_location: true, photographer_id: true,
            user: { select: { id: true, name: true, email: true, phone: true } },
            contract: { select: { deposit_amount: true, deposit_paid_at: true, deposit_due_at: true } },
        },
    });
    for (const o of offers) {
        const td = (o.template_data || {}) as Record<string, unknown>;

        // Priorytet: kolumna DB > template_data
        let parsedDate: Date | null = o.session_date ? new Date(o.session_date) : null;
        let startTime: string | null = o.session_time || null;
        let venueStr: string | null = o.session_location || null;

        if (!parsedDate) {
            const eventDateStr = (td.eventDate as string) || (td.event_date as string) || null;
            const eventTimeStr = (td.eventTime as string) || (td.event_time as string) || (td.eventHour as string) || null;
            parsedDate = parsePolishDate(eventDateStr);
            if (parsedDate && !startTime) startTime = parsePolishTime(eventTimeStr) || parsePolishTime(eventDateStr);
            if (!venueStr) venueStr = (td.eventLocation as string) || (td.location as string) || null;
        }
        if (!parsedDate) continue;

        // filtr from/to
        if (dateFilter.gte && parsedDate < dateFilter.gte) continue;
        if (dateFilter.lte && parsedDate > dateFilter.lte) continue;

        const clientName = o.user?.name || (td.clientName as string) || o.client_email || 'Klient';

        events.push({
            id: `offer-${o.id}`,
            source: 'offer',
            source_id: o.id,
            date: parsedDate.toISOString().slice(0, 10),
            start_time: startTime,
            end_time: o.session_end_time || null,
            title: o.title || 'Oferta',
            client_name: clientName,
            email: o.user?.email || o.client_email || null,
            phone: o.user?.phone || null,
            status: o.status === 'accepted' ? 'confirmed' : 'pending',
            price: o.total_price || null,
            venue: venueStr,
            notes: null,
            photographer_id: o.photographer_id,
            detail_url: `/admin/offers/${o.id}`,
            deposit_amount: o.contract?.deposit_amount ?? null,
            deposit_paid_at: o.contract?.deposit_paid_at ? o.contract.deposit_paid_at.toISOString() : null,
            deposit_due_at: o.contract?.deposit_due_at ? o.contract.deposit_due_at.toISOString() : null,
            deposit_status: calcDepositStatus(o.contract?.deposit_amount, o.contract?.deposit_paid_at, o.contract?.deposit_due_at, parsedDate),
        });
    }

    // ── 3) PHOTO CHALLENGES (mają session_date) ──────────────
    try {
        const challenges = await prisma.photoChallenge.findMany({
            where: {
                session_date: from || to ? dateFilter : { not: null },
                status: { notIn: ['draft', 'rejected', 'cancelled'] },
            },
            select: {
                id: true, status: true, session_date: true, paid_amount: true,
                custom_location: true, inviter_email: true,
                inviter_user: { select: { id: true, name: true, email: true, phone: true } },
                invitee_user: { select: { name: true, email: true, phone: true } },
                package: { select: { name: true } },
                location: { select: { name: true, address: true } },
            },
        });
        for (const c of challenges) {
            if (!c.session_date) continue;
            const inviter = c.inviter_user;
            const invitee = c.invitee_user;
            const venue = c.location?.name || c.custom_location || null;
            events.push({
                id: `challenge-${c.id}`,
                source: 'challenge',
                source_id: c.id,
                date: c.session_date.toISOString().slice(0, 10),
                start_time: c.session_date.toISOString().slice(11, 16),
                end_time: null,
                title: `Foto-wyzwanie: ${c.package?.name || 'sesja'}`,
                client_name: [inviter?.name, invitee?.name].filter(Boolean).join(' + ') || inviter?.email || c.inviter_email || 'Wyzwanie',
                email: inviter?.email || c.inviter_email || null,
                phone: inviter?.phone || null,
                status: c.status === 'accepted' || c.status === 'paid' ? 'confirmed' : 'pending',
                price: c.paid_amount || null,
                venue,
                notes: c.location?.address || null,
                photographer_id: null,
                detail_url: `/admin/challenges/${c.id}`,
                deposit_amount: null,
                deposit_paid_at: null,
                deposit_due_at: null,
                deposit_status: null,
            });
        }
    } catch (e) {
        // PhotoChallenge może nie istnieć w starych instancjach — nie blokujemy reszty
        console.warn('[calendar-events] Challenges skipped:', (e as Error).message);
    }

    // ── 4) CONTRACTS (zwłaszcza standalone bez offer_id) ─────────
    try {
        const contracts = await prisma.contract.findMany({
            where: {
                session_date: from || to ? dateFilter : { not: null },
            },
            select: {
                id: true, contract_number: true, status: true,
                session_date: true, session_time: true, session_location: true,
                offer_id: true, photographer_id: true,
                deposit_amount: true, deposit_paid_at: true, deposit_due_at: true,
                user: { select: { id: true, name: true, email: true, phone: true } },
                offer: { select: { title: true, total_price: true } },
            },
        });
        for (const c of contracts) {
            if (!c.session_date) continue;
            // jesli jest offer_id i ofertę juz mamy w events -- aktualizujemy zaliczke i pomijamy duplikat
            if (c.offer_id) {
                const existing = events.find(e => e.source === 'offer' && e.source_id === c.offer_id);
                if (existing) {
                    existing.deposit_amount = c.deposit_amount ?? existing.deposit_amount;
                    existing.deposit_paid_at = c.deposit_paid_at ? c.deposit_paid_at.toISOString() : existing.deposit_paid_at;
                    existing.deposit_due_at = c.deposit_due_at ? c.deposit_due_at.toISOString() : existing.deposit_due_at;
                    existing.deposit_status = calcDepositStatus(c.deposit_amount, c.deposit_paid_at, c.deposit_due_at, c.session_date);
                    continue;
                }
            }
            events.push({
                id: `contract-${c.id}`,
                source: 'contract',
                source_id: c.id,
                date: c.session_date.toISOString().slice(0, 10),
                start_time: c.session_time || null,
                end_time: null,
                title: c.offer?.title || `Umowa ${c.contract_number || c.id}`,
                client_name: c.user?.name || c.user?.email || 'Klient',
                email: c.user?.email || null,
                phone: c.user?.phone || null,
                status: c.status === 'signed' ? 'confirmed' : 'pending',
                price: c.offer?.total_price || null,
                venue: c.session_location || null,
                notes: c.contract_number,
                photographer_id: c.photographer_id,
                detail_url: `/admin/umowy/${c.id}`,
                deposit_amount: c.deposit_amount ?? null,
                deposit_paid_at: c.deposit_paid_at ? c.deposit_paid_at.toISOString() : null,
                deposit_due_at: c.deposit_due_at ? c.deposit_due_at.toISOString() : null,
                deposit_status: calcDepositStatus(c.deposit_amount, c.deposit_paid_at, c.deposit_due_at, c.session_date),
            });
        }
    } catch (e) {
        console.warn('[calendar-events] Contracts skipped:', (e as Error).message);
    }

    events.sort((a, b) => a.date.localeCompare(b.date) || (a.start_time || '').localeCompare(b.start_time || ''));

    return NextResponse.json({
        events,
        counts: {
            bookings: events.filter(e => e.source === 'booking').length,
            offers: events.filter(e => e.source === 'offer').length,
            challenges: events.filter(e => e.source === 'challenge').length,
            contracts: events.filter(e => e.source === 'contract').length,
            total: events.length,
        },
    });
}
