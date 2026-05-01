/**
 * Admin: lista profili Foto-Match.
 *
 * GET /api/admin/foto-match/profiles?status=PENDING&city=Toru%C5%84&q=ania
 *   - status: PENDING | ACTIVE | SUSPENDED | REJECTED | ALL (default: ALL)
 *   - city:   filtr exact (opcjonalny)
 *   - q:      szuka po display_name lub User.email (opcjonalny)
 *   - flagged: 'true' = tylko z flagged_count > 0 lub z FLAGGED photos
 *
 * Zwraca: { profiles: [...], total }
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import prisma from '@/lib/db/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withAuth(request, async (req) => {
        const url = new URL(req.url);
        const status = url.searchParams.get('status');
        const city = url.searchParams.get('city');
        const q = url.searchParams.get('q')?.trim();
        const flagged = url.searchParams.get('flagged') === 'true';

        const where: any = {};
        if (status && status !== 'ALL') where.status = status;
        if (city) where.city = city;
        if (q) {
            where.OR = [
                { display_name: { contains: q, mode: 'insensitive' } },
                { user: { email: { contains: q, mode: 'insensitive' } } },
                { user: { name: { contains: q, mode: 'insensitive' } } },
            ];
        }
        if (flagged) {
            where.OR = [
                ...(where.OR || []),
                { flagged_count: { gt: 0 } },
                { photos: { some: { ai_status: 'FLAGGED' } } },
            ];
        }

        const profiles = await prisma.fotoMatchProfile.findMany({
            where,
            orderBy: [{ status: 'asc' }, { created_at: 'desc' }],
            include: {
                user: {
                    select: { id: true, email: true, name: true, created_at: true },
                },
                photos: {
                    select: { id: true, url: true, ai_status: true, position: true },
                    orderBy: { position: 'asc' },
                },
            },
            take: 200,
        });

        const total = await prisma.fotoMatchProfile.count({ where });

        return NextResponse.json({ profiles, total });
    });
}
