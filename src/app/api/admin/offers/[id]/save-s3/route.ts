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

            console.log(`[S3_SAVE] Starting S3 save process for offer ${offerId}`);

            const offer = await prisma.offer.findUnique({
                where: { id: offerId },
                include: {
                    sections: {
                        include: { items: true }
                    }
                }
            });

            if (!offer) {
                console.error(`[S3_SAVE] Offer ${offerId} not found`);
                return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
            }

            // Actual S3 upload implementation
            console.log(`[S3_SAVE] Generating PDF for offer ${offerId}...`);
            const pdfBuffer = await generateOfferPDF(offer);
            console.log(`[S3_SAVE] PDF generated successfully, size: ${pdfBuffer.length} bytes`);

            const fileName = `oferta_${offer.offerNumber || offerId}.pdf`;
            const s3Key = `offers/${fileName}`;

            console.log(`[S3_SAVE] Uploading to S3: ${s3Key}...`);
            const pdfUrl = await uploadToS3(pdfBuffer, s3Key, 'application/pdf');
            console.log(`[S3_SAVE] S3 upload successful, URL: ${pdfUrl}`);

            console.log(`[S3_SAVE] Updating DB with PDF URL: ${pdfUrl}`);
            await prisma.offer.update({
                where: { id: offerId },
                data: { pdf_url: pdfUrl }
            });

            console.log(`[S3_SAVE] Success! Offer ${offerId} saved to S3`);
            return NextResponse.json({ success: true, pdfUrl });
        } catch (error: any) {
            console.error('[S3_SAVE] Error in save-s3:', error);
            console.error('[S3_SAVE] Error details:', {
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            // Enhanced error details for debugging
            return NextResponse.json({
                error: 'Failed to save to S3',
                details: error.message,
                code: error.code,
            }, { status: 500 });
        }
    });
}
