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
            
            // Generate PRE-acceptance version (standard offer)
            const pdfBufferPre = await generateOfferPDF(offer, false);
            console.log(`[S3_SAVE] Pre-acceptance PDF generated, size: ${pdfBufferPre.length} bytes`);

            const fileNamePre = `oferta_${offer.offerNumber || offerId}.pdf`;
            const s3KeyPre = `offers/${fileNamePre}`;

            console.log(`[S3_SAVE] Uploading pre-acceptance PDF to S3: ${s3KeyPre}...`);
            const pdfUrlPre = await uploadToS3(pdfBufferPre, s3KeyPre, 'application/pdf');
            console.log(`[S3_SAVE] Pre-acceptance S3 upload successful, URL: ${pdfUrlPre}`);

            // If offer is accepted, also generate POST-acceptance version with client selection
            if (offer.status === 'accepted' && offer.client_selection) {
                console.log(`[S3_SAVE] Offer is accepted, generating post-acceptance version...`);
                const pdfBufferPost = await generateOfferPDF(offer, true);
                console.log(`[S3_SAVE] Post-acceptance PDF generated, size: ${pdfBufferPost.length} bytes`);

                const fileNamePost = `oferta_${offer.offerNumber || offerId}_zatwierdzona.pdf`;
                const s3KeyPost = `offers/${fileNamePost}`;

                console.log(`[S3_SAVE] Uploading post-acceptance PDF to S3: ${s3KeyPost}...`);
                const pdfUrlPost = await uploadToS3(pdfBufferPost, s3KeyPost, 'application/pdf');
                console.log(`[S3_SAVE] Post-acceptance S3 upload successful, URL: ${pdfUrlPost}`);
            }

            console.log(`[S3_SAVE] Updating DB with PDF URL`);
            await prisma.offer.update({
                where: { id: offerId },
                data: { 
                    pdf_url: pdfUrlPre
                }
            });

            console.log(`[S3_SAVE] Success! Offer ${offerId} saved to S3`);
            return NextResponse.json({ 
                success: true, 
                pdfUrl: pdfUrlPre
            });
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
