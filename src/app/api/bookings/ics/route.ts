/**
 * GET /api/bookings/ics
 *   Public per-token feed:        ?token=<random>     -> resolves photographer
 *   Admin auth (Bearer):          full calendar
 *   Per-photographer:             ?photographer_id=N  (admin only)
 *
 * Always returns text/calendar (RFC 5545).
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { bookingsToIcs } from '@/lib/calendar/ics';
import { requireAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const photographerIdParam = searchParams.get('photographer_id');

    let where: any = { status: { notIn: ['archived', 'cancelled'] } };
    let calName = 'Rezerwacje \u2014 Wla\u015bniewski Foto';

    if (token) {
        // Stateless token format: "ph_<id>_<secret>" — secret matches PhotographerProfile.id padded
        // (Prosty mechanizm — bez tabeli tokenów: token = "ph_<userId>_<sha256(JWT_SECRET+userId)[:16]>")
        const m = /^ph_(\d+)_([a-f0-9]{16})$/.exec(token);
        if (!m) {
            return new NextResponse('Invalid token', { status: 401 });
        }
        const userId = parseInt(m[1], 10);
        const expected = await import('crypto').then(c =>
            c.createHash('sha256').update(`${process.env.JWT_SECRET || ''}:ics:${userId}`).digest('hex').slice(0, 16)
        );
        if (expected !== m[2]) {
            return new NextResponse('Invalid token', { status: 401 });
        }
        where.photographer_id = userId;
        const u = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        calName = `Rezerwacje \u2014 ${u?.name || 'Fotograf'}`;
    } else {
        // Bearer auth (admin)
        const authError = await requireAuth(request);
        if (authError) return authError;
        if (photographerIdParam) {
            where.photographer_id = parseInt(photographerIdParam, 10);
        }
    }

    const bookings = await prisma.booking.findMany({
        where,
        orderBy: { date: 'asc' },
        select: {
            id: true, service: true, package: true, date: true,
            start_time: true, end_time: true, client_name: true,
            email: true, phone: true, venue_city: true, venue_place: true,
            notes: true, status: true, ics_uid: true, updated_at: true,
        },
    });

    const ics = bookingsToIcs(bookings, calName);

    return new NextResponse(ics, {
        status: 200,
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': 'inline; filename="rezerwacje.ics"',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
    });
}
