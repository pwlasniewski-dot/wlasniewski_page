import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { isAdminImmutableOfferStatus } from '@/lib/offers/status';

// POST /api/admin/offers/[id]/save-drive
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req) => {
        try {
            const params = await context.params;
            const offerId = parseInt(params.id);

            const offer = await prisma.offer.findUnique({ where: { id: offerId } });
            if (!offer) {
                return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
            }
            if (isAdminImmutableOfferStatus(offer.status)) {
                return NextResponse.json({ error: 'Wysłana lub zaakceptowana oferta jest niezmiennym snapshotem.' }, { status: 409 });
            }

            return NextResponse.json({ error: 'Integracja Google Drive nie jest zaimplementowana.' }, { status: 501 });
        } catch (error) {
            console.error('Error saving to Drive:', error);
            return NextResponse.json({ error: 'Failed to save to Drive' }, { status: 500 });
        }
    });
}
