/**
 * GET /api/photographer/bookings?from=YYYY-MM-DD&to=YYYY-MM-DD&status=...
 * Zwraca rezerwacje przypisane do zalogowanego fotografa (lub wszystkie jak ADMIN).
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getPhotographerAuth, unauthorized } from '@/lib/auth/photographer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const auth = await getPhotographerAuth(request);
    if (!auth) return unauthorized();

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const status = searchParams.get('status');
    const allParam = searchParams.get('all'); // admin only

    const where: any = { status: { not: 'archived' } };

    if (auth.isAdmin && allParam === '1') {
        // admin chce wszystko \u2014 ok
    } else {
        where.photographer_id = auth.id;
    }

    if (status && status !== 'all') {
        where.status = status;
    }
    if (from || to) {
        where.date = {};
        if (from) where.date.gte = new Date(from + 'T00:00:00.000Z');
        if (to) where.date.lte = new Date(to + 'T23:59:59.999Z');
    }

    const bookings = await prisma.booking.findMany({
        where,
        orderBy: { date: 'asc' },
        select: {
            id: true, service: true, package: true, price: true, date: true,
            start_time: true, end_time: true, client_name: true, email: true,
            phone: true, venue_city: true, venue_place: true, notes: true,
            status: true, photographer_id: true, created_at: true,
        },
    });

    return NextResponse.json({ bookings, viewer: { id: auth.id, isAdmin: auth.isAdmin } });
}
