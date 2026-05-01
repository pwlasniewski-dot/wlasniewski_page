import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';

/**
 * GET /api/foto-match/waitlist/admin
 *
 * Wymaga: zalogowany admin (Bearer JWT z `/api/auth/admin/login`).
 *
 * Zwraca: lista zapisów + agregaty (per miasto, per intencja, % potwierdzeń).
 * Wsparcie filtrów: ?city=, ?confirmed=true|false, ?limit= (max 500).
 */
export async function GET(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const url = new URL(request.url);
    const city = url.searchParams.get('city')?.trim() || undefined;
    const confirmedParam = url.searchParams.get('confirmed');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '200') || 200, 500);

    const where: any = {};
    if (city) where.city = { equals: city, mode: 'insensitive' };
    if (confirmedParam === 'true') where.confirmed_at = { not: null };
    if (confirmedParam === 'false') where.confirmed_at = null;

    try {
        const [items, total, confirmed, byCity, byRole] = await Promise.all([
            prisma.fotoMatchWaitlist.findMany({
                where,
                orderBy: { created_at: 'desc' },
                take: limit,
                select: {
                    id: true, email: true, city: true, role: true, age_range: true,
                    source: true, marketing_opt_in: true, confirmed_at: true,
                    unsubscribed_at: true, created_at: true,
                },
            }),
            prisma.fotoMatchWaitlist.count(),
            prisma.fotoMatchWaitlist.count({ where: { confirmed_at: { not: null } } }),
            prisma.fotoMatchWaitlist.groupBy({
                by: ['city'],
                _count: { _all: true },
                where: { confirmed_at: { not: null } },
                orderBy: { _count: { city: 'desc' } },
                take: 20,
            }).catch(() => []),
            prisma.fotoMatchWaitlist.groupBy({
                by: ['role'],
                _count: { _all: true },
                where: { confirmed_at: { not: null } },
            }).catch(() => []),
        ]);

        return NextResponse.json({
            success: true,
            stats: {
                total,
                confirmed,
                unconfirmed: total - confirmed,
                conversion_pct: total > 0 ? Math.round((confirmed / total) * 100) : 0,
                by_city: byCity.map((r: any) => ({ city: r.city || '(nie podano)', count: r._count._all })),
                by_role: byRole.map((r: any) => ({ role: r.role || '(nie podano)', count: r._count._all })),
            },
            items,
            limit,
        });
    } catch (e: any) {
        console.error('[foto-match/waitlist/admin] error:', e?.message || e);
        // Prawdopodobnie tabela nie istnieje (migracja nie odpalona).
        return NextResponse.json(
            { success: false, error: 'DB_ERROR', message: 'Tabela foto_match_waitlist może nie istnieć — odpal migrację.' },
            { status: 503 },
        );
    }
}
