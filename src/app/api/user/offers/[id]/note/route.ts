import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractToken } from '@/lib/auth/jwt';

// PATCH /api/user/offers/[id]/note — klient dodaje notatkę do oferty
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = request.headers.get('Authorization');
        const token = extractToken(authHeader) || request.cookies.get('client_token')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded = await verifyToken(token);
        if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        const { id } = await params;
        const offerId = parseInt(id);
        const { client_note } = await request.json();

        // Upewnij się, że oferta należy do klienta
        const offer = await prisma.offer.findFirst({
            where: {
                id: offerId,
                OR: [
                    { client_id: decoded.id },
                    { client_email: decoded.email }
                ]
            }
        });

        if (!offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });

        await prisma.offer.update({
            where: { id: offerId },
            data: { client_note: client_note ?? null } as any
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Note API] Error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
