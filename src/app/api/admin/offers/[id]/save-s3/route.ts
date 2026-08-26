import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { generateOfferPDF } from '@/lib/services/pdf';
import { deleteFromS3, uploadToS3 } from '@/lib/storage/s3';
import { isAdminImmutableOfferStatus } from '@/lib/offers/status';
import { randomUUID } from 'node:crypto';
import { jsonWithCorrelation } from '@/lib/http/correlation';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';

// POST /api/admin/offers/[id]/save-s3
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req) => {
        const correlationId = randomUUID();
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
            if (isAdminImmutableOfferStatus(offer.status)) {
                return NextResponse.json({ error: 'Wysłana lub zaakceptowana oferta jest niezmiennym snapshotem.' }, { status: 409 });
            }

            // PROTECT standalone/uploaded PDFs — never regenerate if no sections exist
            const hasSections = offer.sections && offer.sections.length > 0;

            if (!hasSections && offer.pdf_url) {
                console.log(`[S3_SAVE] Offer ${offerId} is a standalone PDF upload (no sections). Skipping regeneration to preserve original content.`);
                return NextResponse.json({ 
                    success: true, 
                    pdfUrl: offer.pdf_url,
                    note: 'Standalone PDF — original file preserved'
                });
            }

            // Actual S3 upload implementation — only for offers with sections
            console.log(`[S3_SAVE] Generating PDF for offer ${offerId}...`);
            
            // Generate PRE-acceptance version (standard offer)
            const pdfBufferPre = await generateOfferPDF(offer, false);
            console.log(`[S3_SAVE] Pre-acceptance PDF generated, size: ${pdfBufferPre.length} bytes`);

            const fileNamePre = `oferta_${offer.offerNumber || offerId}_${randomUUID()}.pdf`;
            const s3KeyPre = `offers/${fileNamePre}`;

            console.log(`[S3_SAVE] Uploading pre-acceptance PDF to S3: ${s3KeyPre}...`);
            const pdfUrlPre = await uploadToS3(pdfBufferPre, s3KeyPre, 'application/pdf', { access: 'private' });
            console.log(`[S3_SAVE] Pre-acceptance S3 upload successful, URL: ${pdfUrlPre}`);

            console.log(`[S3_SAVE] Updating DB with PDF URL`);
            let updated;
            try {
                updated = await prisma.offer.updateMany({
                    where: { id: offerId, status: offer.status, updated_at: offer.updated_at },
                    data: { pdf_url: pdfUrlPre },
                });
            } catch (error) {
                await deleteFromS3(pdfUrlPre).catch(cleanupError => console.error('[S3_SAVE] Error cleanup failed', cleanupError));
                throw error;
            }
            if (updated.count !== 1) {
                await deleteFromS3(pdfUrlPre).catch(cleanupError => console.error('[S3_SAVE] Lost-CAS cleanup failed', cleanupError));
                return jsonWithCorrelation({
                    error: 'Oferta została równolegle zmieniona lub wysłana. Odśwież dane.',
                    correlation_id: correlationId,
                }, correlationId, 409);
            }

            console.log(`[S3_SAVE] Success! Offer ${offerId} saved to S3`);
            return jsonWithCorrelation({
                success: true, 
                pdfUrl: pdfUrlPre
            }, correlationId);
        } catch (error: any) {
            console.error('[S3_SAVE] Error in save-s3:', error);
            console.error('[S3_SAVE] Error details:', {
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            // Enhanced error details for debugging
            await recordAdminIncidentSafely({
                severity: 'P1', category: 'ADMIN_WRITE', reasonCode: 'ADMIN_OFFER_S3_SAVE_FAILED',
                summary: 'Nie udało się wygenerować lub zapisać PDF oferty', correlationId,
                details: { error: error instanceof Error ? error.message : String(error) },
            });
            return jsonWithCorrelation({
                error: 'Failed to save to S3',
                details: error.message,
                code: error.code,
                correlation_id: correlationId,
            }, correlationId, 500);
        }
    });
}
