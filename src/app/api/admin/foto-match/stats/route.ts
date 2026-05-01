/**
 * Admin: Foto-Match dashboard.
 * Pokazuje liczniki + szybkie linki + stan toggle + waitlist count.
 */
import { withAuth } from '@/lib/auth/middleware';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        const [
            pendingCount,
            activeCount,
            suspendedCount,
            rejectedCount,
            flaggedPhotosCount,
            waitlistCount,
            pendingReportsCount,
            setting,
            recentProfiles,
        ] = await Promise.all([
            prisma.fotoMatchProfile.count({ where: { status: 'PENDING' } }),
            prisma.fotoMatchProfile.count({ where: { status: 'ACTIVE' } }),
            prisma.fotoMatchProfile.count({ where: { status: 'SUSPENDED' } }),
            prisma.fotoMatchProfile.count({ where: { status: 'REJECTED' } }),
            prisma.fotoMatchPhoto.count({ where: { ai_status: 'FLAGGED' } }),
            prisma.fotoMatchWaitlist.count(),
            prisma.fotoMatchReport.count({ where: { status: 'PENDING' } }).catch(() => 0),
            prisma.setting.findFirst({
                orderBy: { id: 'asc' },
                select: { foto_match_enabled: true },
            }),
            prisma.fotoMatchProfile.findMany({
                orderBy: { created_at: 'desc' },
                take: 5,
                include: {
                    user: { select: { email: true, name: true } },
                },
            }),
        ]);

        return NextResponse.json({
            counts: {
                pending: pendingCount,
                active: activeCount,
                suspended: suspendedCount,
                rejected: rejectedCount,
                flaggedPhotos: flaggedPhotosCount,
                waitlist: waitlistCount,
                pendingReports: pendingReportsCount,
            },
            enabled: !!setting?.foto_match_enabled,
            recentProfiles,
        });
    });
}
