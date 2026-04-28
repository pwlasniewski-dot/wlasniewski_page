import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cleanup of stale photo-challenge records that never completed payment.
 *
 * Trigger: external cron (cron-job.org / Netlify scheduled function),
 *  daily at e.g. 03:00 Europe/Warsaw.
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}
 *
 * Rule:
 *  - Delete PhotoChallenge with status='pending_payment' AND payment_status='pending'
 *    AND created_at older than 24h.
 *  - Cascade-delete the associated Booking (status='challenge_pending').
 *  - Frees the time slot for new bookings.
 */
async function handle(request: NextRequest) {
    const auth = request.headers.get('authorization') || '';
    const expected = `Bearer ${process.env.CRON_SECRET || ''}`;
    if (!process.env.CRON_SECRET || auth !== expected) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stale = await prisma.photoChallenge.findMany({
        where: {
            status: 'pending_payment',
            payment_status: 'pending',
            created_at: { lt: cutoff },
        },
        select: { id: true, unique_link: true, inviter_email: true },
    });

    let deletedChallenges = 0;
    let deletedBookings = 0;

    for (const ch of stale) {
        const bk = await prisma.booking.deleteMany({
            where: { challenge_id: ch.id, status: 'challenge_pending' },
        }).catch(() => ({ count: 0 }));
        deletedBookings += bk.count;

        const del = await prisma.photoChallenge.delete({
            where: { id: ch.id },
        }).then(() => 1).catch(() => 0);
        deletedChallenges += del;
    }

    await prisma.systemLog.create({
        data: {
            level: 'INFO',
            module: 'CRON',
            message: 'cleanup-pending-challenges',
            metadata: JSON.stringify({
                cutoff: cutoff.toISOString(),
                deletedChallenges,
                deletedBookings,
                ids: stale.map((s) => s.id),
            }),
        },
    }).catch(() => null);

    return NextResponse.json({
        success: true,
        cutoff: cutoff.toISOString(),
        deletedChallenges,
        deletedBookings,
    });
}

export async function GET(request: NextRequest) {
    return handle(request);
}

export async function POST(request: NextRequest) {
    return handle(request);
}
