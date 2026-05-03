import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractToken } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

// GET /api/user/workshops — moje warsztaty (po e-mailu z WorkshopOffer)
export async function GET(req: NextRequest) {
    try {
        const token = extractToken(req.headers.get('Authorization'));
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded = await verifyToken(token);
        if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { email: true } });
        if (!user?.email) return NextResponse.json({ workshops: [] });

        const offers = await prisma.workshopOffer.findMany({
            where: { recipient_email: user.email },
            orderBy: { sent_at: 'desc' },
            include: {
                workshop: {
                    select: {
                        id: true, slug: true, title: true, location: true, description: true,
                        starts_at: true, ends_at: true, status: true, schedule: true,
                    },
                },
            },
        });

        const out = offers.map(o => ({
            offer_id: o.id,
            status: o.status,
            participant_name: o.participant_name,
            price: o.price,
            deposit_amount: o.deposit_amount,
            deposit_due_at: o.deposit_due_at,
            deposit_paid_at: o.deposit_paid_at,
            sent_at: o.sent_at,
            participant_id: o.participant_id,
            workshop: o.workshop,
            panel_url: o.participant_id ? `/warsztaty/${o.workshop.slug}/login` : null,
        }));

        return NextResponse.json({ workshops: out });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'error' }, { status: 500 });
    }
}
