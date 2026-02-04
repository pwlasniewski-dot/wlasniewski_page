import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

// POST /api/admin/offers/[id]/save-s3
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

            // TODO: Actual S3 upload implementation
            // For now, placeholder URL
            const s3Url = `https://s3.amazonaws.com/fotograf/offers/${offer.offerNumber || offerId}.pdf`;

            await prisma.offer.update({
                where: { id: offerId },
                data: { pdf_url: s3Url }
            });

            return NextResponse.json({ success: true, pdfUrl: s3Url });
        } catch (error) {
            console.error('Error saving to S3:', error);
            return NextResponse.json({ error: 'Failed to save to S3' }, { status: 500 });
        }
    });
}
