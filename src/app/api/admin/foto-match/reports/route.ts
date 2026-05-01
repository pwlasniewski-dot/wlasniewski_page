/**
 * Admin: lista zgłoszeń (Foto-Match reports).
 *
 * GET /api/admin/foto-match/reports?status=PENDING
 * PATCH /api/admin/foto-match/reports/[id]
 *   body: { status: 'REVIEWING'|'RESOLVED'|'DISMISSED', admin_note? }
 *   (PATCH w osobnym pliku [id]/route.ts)
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

        const where: any = {};
        if (status && status !== 'ALL') where.status = status;

        const [reports, total, counts] = await Promise.all([
            prisma.fotoMatchReport.findMany({
                where,
                orderBy: { created_at: 'desc' },
                take: 200,
                include: {
                    reporter: {
                        select: { id: true, display_name: true, user: { select: { email: true } } },
                    },
                    reported: {
                        select: { id: true, display_name: true, status: true, flagged_count: true, user: { select: { email: true } } },
                    },
                },
            }),
            prisma.fotoMatchReport.count({ where }),
            prisma.fotoMatchReport.groupBy({
                by: ['status'],
                _count: { _all: true },
            }),
        ]);

        const countsMap: Record<string, number> = {};
        counts.forEach((c: any) => { countsMap[c.status] = c._count._all; });

        return NextResponse.json({ reports, total, counts: countsMap });
    });
}
