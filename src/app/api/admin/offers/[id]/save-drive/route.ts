import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

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

            // TODO: Actual Google Drive upload implementation
            // Placeholder URL
            const driveUrl = `https://drive.google.com/file/d/offer-${offer.offerNumber || offerId}/view`;

            await prisma.offer.update({
                where: { id: offerId },
                data: { drive_url: driveUrl }
            });

            return NextResponse.json({ success: true, driveUrl });
        } catch (error) {
            console.error('Error saving to Drive:', error);
            return NextResponse.json({ error: 'Failed to save to Drive' }, { status: 500 });
        }
    });
}
