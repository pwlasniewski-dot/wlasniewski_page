/**
 * Admin: kolejka zdjęć do akceptacji.
 *
 * GET /api/admin/foto-match/photos?status=FLAGGED  (default: FLAGGED)
 *   Zwraca: { photos: [...] } z dołączonym profilem + użytkownikiem.
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import prisma from '@/lib/db/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withAuth(request, async (req) => {
        const url = new URL(req.url);
        const status = (url.searchParams.get('status') || 'FLAGGED').toUpperCase();

        const photos = await prisma.fotoMatchPhoto.findMany({
            where: { ai_status: status },
            orderBy: { created_at: 'desc' },
            take: 200,
            include: {
                profile: {
                    select: {
                        id: true,
                        display_name: true,
                        status: true,
                        user: { select: { id: true, email: true, name: true } },
                    },
                },
            },
        });

        return NextResponse.json({ photos, total: photos.length });
    });
}
