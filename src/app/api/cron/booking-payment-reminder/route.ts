import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email/sender';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cron: przypomnienie o dopłacie split-payment.
 *
 * Trigger: external cron (cron-job.org / Netlify scheduled function), codziennie 09:00.
 * Auth: Authorization: Bearer ${CRON_SECRET}.
 *
 * Reguła:
 *  - bookings.payment_plan='SPLIT'
 *  - deposit_paid_at IS NOT NULL
 *  - remaining_paid_at IS NULL
 *  - remaining_due_at <= NOW() + 3 dni
 *  - reminder nie był jeszcze wysłany w ciągu ostatnich 24h (idempotencja po notes)
 */
async function handle(request: NextRequest) {
    const auth = request.headers.get('authorization') || '';
    const expected = `Bearer ${process.env.CRON_SECRET || ''}`;
    if (!process.env.CRON_SECRET || auth !== expected) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const horizon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const bookings = await prisma.booking.findMany({
        where: {
            payment_plan: 'SPLIT',
            deposit_paid_at: { not: null },
            remaining_paid_at: null,
            remaining_due_at: { lte: horizon, not: null },
        },
        select: {
            id: true, email: true, client_name: true, date: true,
            remaining_amount: true, remaining_due_at: true, notes: true,
        },
    });

    let sent = 0, skipped = 0, failed = 0;

    for (const b of bookings) {
        // Idempotencja: skip jeśli notes zawiera marker REMINDER_<YYYY-MM-DD>
        const today = new Date().toISOString().slice(0, 10);
        const marker = `REMINDER_${today}`;
        if ((b.notes || '').includes(marker)) {
            skipped++;
            continue;
        }
        if (!b.email) { skipped++; continue; }

        try {
            await sendEmail({
                to: b.email,
                subject: 'Przypomnienie: dopłata przed sesją',
                template: 'booking-payment-reminder',
                data: {
                    name: b.client_name || 'Kliencie',
                    remaining_amount_pln: ((b.remaining_amount ?? 0) / 100).toFixed(2),
                    remaining_due_at: b.remaining_due_at ? b.remaining_due_at.toISOString().slice(0, 10) : '',
                    session_date: b.date ? b.date.toISOString().slice(0, 10) : '',
                    paymentUrl: '',
                },
            } as any);
            await prisma.booking.update({
                where: { id: b.id },
                data: { notes: `${b.notes || ''}\n[${marker}]`.trim() },
            });
            sent++;
        } catch (e) {
            console.error(`[cron payment-reminder] booking #${b.id} failed`, e);
            failed++;
        }
    }

    return NextResponse.json({ ok: true, scanned: bookings.length, sent, skipped, failed });
}

export async function GET(request: NextRequest) {
    return handle(request);
}
export async function POST(request: NextRequest) {
    return handle(request);
}
