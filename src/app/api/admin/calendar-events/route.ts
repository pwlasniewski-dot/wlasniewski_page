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
    source: 'booking' | 'offer' | 'challenge' | 'contract' | 'workshop';
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
            const cDateKey = c.session_date.toISOString().slice(0, 10);
            const cEmail = c.user?.email?.toLowerCase() || null;

            // Helper: znajdź istniejącą ofertę powiązaną z tą umową
            // 1) po offer_id (jawne powiązanie)
            // 2) po email klienta + data sesji (umowa standalone wygenerowana z oferty bez powiązania)
            const existingOffer = events.find(e => {
                if (e.source !== 'offer') return false;
                if (c.offer_id && e.source_id === c.offer_id) return true;
                if (e.date !== cDateKey) return false;
                if (cEmail && e.email && e.email.toLowerCase() === cEmail) return true;
                return false;
            });

            if (existingOffer) {
                // Wzbogać istniejący wpis o dane z umowy i zamień źródło na contract
                // (umowa jest bardziej autorytatywna niż oferta)
                existingOffer.id = `contract-${c.id}`;
                existingOffer.source = 'contract';
                existingOffer.source_id = c.id;
                existingOffer.detail_url = `/admin/umowy/${c.id}`;
                existingOffer.notes = c.contract_number;
                existingOffer.status = c.status === 'signed' ? 'confirmed' : existingOffer.status;
                existingOffer.start_time = c.session_time || existingOffer.start_time;
                existingOffer.venue = c.session_location || existingOffer.venue;
                existingOffer.deposit_amount = c.deposit_amount ?? existingOffer.deposit_amount;
                existingOffer.deposit_paid_at = c.deposit_paid_at ? c.deposit_paid_at.toISOString() : existingOffer.deposit_paid_at;
                existingOffer.deposit_due_at = c.deposit_due_at ? c.deposit_due_at.toISOString() : existingOffer.deposit_due_at;
                existingOffer.deposit_status = calcDepositStatus(c.deposit_amount, c.deposit_paid_at, c.deposit_due_at, c.session_date);
                continue;
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

    // ── 5) WORKSHOPS (każdy dzień z harmonogramu jako osobny event) ─────────
    try {
        const workshops = await prisma.workshop.findMany({
            where: {
                status: { notIn: ['draft', 'archived'] },
            },
            select: {
                id: true,
                slug: true,
                title: true,
                location: true,
                starts_at: true,
                ends_at: true,
                schedule: true,
                status: true,
                _count: { select: { participants: true } },
            },
        });

        for (const w of workshops) {
            const schedule = Array.isArray(w.schedule) ? w.schedule : [];
            
            if (schedule.length > 0) {
                // Każdy dzień z harmonogramu jako osobny event
                for (let i = 0; i < schedule.length; i++) {
                    const day = schedule[i];
                    if (!day.date) continue;

                    const eventDate = new Date(day.date);
                    if (isNaN(eventDate.getTime())) continue;

                    // Filtr zakresu dat
                    if (dateFilter.gte && eventDate < dateFilter.gte) continue;
                    if (dateFilter.lte && eventDate > dateFilter.lte) continue;

                    const dayNum = i + 1;
                    const topic = day.topic ? ` — ${day.topic}` : '';

                    events.push({
                        id: `workshop-${w.id}-day${dayNum}`,
                        source: 'workshop' as any, // Rozszerzenie typu
                        source_id: w.id,
                        date: eventDate.toISOString().slice(0, 10),
                        start_time: day.start || null,
                        end_time: day.end || null,
                        title: `🎓 ${w.title} (Dzień ${dayNum}${topic})`,
                        client_name: `Warsztat (${w._count.participants} uczestników)`,
                        email: null,
                        phone: null,
                        status: w.status === 'active' ? 'confirmed' : 'pending',
                        price: null,
                        venue: w.location || null,
                        notes: day.plan || null,
                        photographer_id: null,
                        detail_url: `/admin/warsztaty/${w.id}`,
                        deposit_amount: null,
                        deposit_paid_at: null,
                        deposit_due_at: null,
                        deposit_status: null,
                    });
                }
            } else if (w.starts_at && w.ends_at) {
                // Fallback: jeśli brak harmonogramu, pokaż zakres dat jako jeden blok
                const start = new Date(w.starts_at);
                const end = new Date(w.ends_at);

                // Filtr zakresu dat
                if (dateFilter.gte && end < dateFilter.gte) continue;
                if (dateFilter.lte && start > dateFilter.lte) continue;

                // Dla każdego dnia w zakresie start-end dodaj event
                const current = new Date(start);
                let dayNum = 1;
                while (current <= end) {
                    if ((!dateFilter.gte || current >= dateFilter.gte) && 
                        (!dateFilter.lte || current <= dateFilter.lte)) {
                        events.push({
                            id: `workshop-${w.id}-day${dayNum}`,
                            source: 'workshop' as any,
                            source_id: w.id,
                            date: current.toISOString().slice(0, 10),
                            start_time: null,
                            end_time: null,
                            title: `🎓 ${w.title}`,
                            client_name: `Warsztat (${w._count.participants} uczestników)`,
                            email: null,
                            phone: null,
                            status: w.status === 'active' ? 'confirmed' : 'pending',
                            price: null,
                            venue: w.location || null,
                            notes: null,
                            photographer_id: null,
                            detail_url: `/admin/warsztaty/${w.id}`,
                            deposit_amount: null,
                            deposit_paid_at: null,
                            deposit_due_at: null,
                            deposit_status: null,
                        });
                    }
                    current.setDate(current.getDate() + 1);
                    dayNum++;
                }
            }
        }
    } catch (e) {
        console.warn('[calendar-events] Workshops skipped:', (e as Error).message);
    }

    events.sort((a, b) => a.date.localeCompare(b.date) || (a.start_time || '').localeCompare(b.start_time || ''));

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
