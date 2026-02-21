import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { generateOfferPDF } from '@/lib/services/pdf';
import { uploadToS3 } from '@/lib/storage/s3';

// POST /api/admin/offers/[id]/save-s3
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req) => {
        try {
            const params = await context.params;
            const offerId = parseInt(params.id);

            const offer = await prisma.offer.findUnique({
                where: { id: offerId },
                include: {
                    sections: {
                        include: { items: true }
                    }
                }
            });

            if (!offer) {
                return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
            }

            // Actual S3 upload implementation
            console.log(`[S3_SAVE] Generating PDF for offer ${offerId}...`);
            const pdfBuffer = await generateOfferPDF(offer);

            const fileName = `oferta_${offer.offerNumber || offerId}.pdf`;
            const s3Key = `offers/${fileName}`;

            console.log(`[S3_SAVE] Uploading to S3: ${s3Key}...`);
            const pdfUrl = await uploadToS3(pdfBuffer, s3Key, 'application/pdf');

            console.log(`[S3_SAVE] Updating DB with PDF URL: ${pdfUrl}`);
            await prisma.offer.update({
                where: { id: offerId },
                data: { pdf_url: pdfUrl }
            });

            return NextResponse.json({ success: true, pdfUrl });
        } catch (error: any) {
            console.error('Error saving to S3:', error);
            return NextResponse.json({
                error: 'Failed to save to S3',
                details: error.message
            }, { status: 500 });
        }
    });
}
