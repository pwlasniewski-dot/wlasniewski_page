import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

// GET /api/admin/workshops/participants — wszyscy uczestnicy + wszystkie oferty zbiorczo
export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        const participants = await prisma.workshopParticipant.findMany({
            orderBy: [{ workshop_id: 'desc' }, { id: 'asc' }],
            select: {
                id: true, login: true, display_name: true, avatar: true,
                active: true, last_login: true, created_at: true,
                workshop: { select: { id: true, slug: true, title: true, status: true } },
                _count: { select: { uploads: true } },
            },
        });

        const offers = await prisma.workshopOffer.findMany({
            where: { status: { in: ['sent', 'paid'] } },
            orderBy: { sent_at: 'desc' },
            select: {
                id: true, recipient_email: true, recipient_name: true, participant_name: true,
                price: true, deposit_amount: true, deposit_paid_at: true, status: true,
                source: true, sent_at: true,
                workshop: { select: { id: true, slug: true, title: true } },
            },
        });

        return NextResponse.json({ participants, offers });
    });
}
