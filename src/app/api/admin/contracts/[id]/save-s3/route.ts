import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { generateContractPDF } from '@/lib/services/pdf';
import { deleteFromS3, uploadToS3 } from '@/lib/storage/s3';
import { isImmutableContractStatus } from '@/lib/contracts/status';
import { randomUUID } from 'node:crypto';
import { jsonWithCorrelation } from '@/lib/http/correlation';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';

// POST /api/admin/contracts/[id]/save-s3
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req) => {
        const correlationId = randomUUID();
        try {
            const params = await context.params;
            const contractId = parseInt(params.id);

            const contract = await prisma.contract.findUnique({
                where: { id: contractId },
                include: {
                    offer: {
                        include: { user: true }
                    },
                    user: true
                }
            });

            if (!contract) {
                return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
            }
            if (isImmutableContractStatus(contract.status)) {
                return NextResponse.json({ error: 'Wysłana lub podpisana umowa jest niezmiennym snapshotem.' }, { status: 409 });
            }

            // PROTECT standalone/uploaded PDFs — never regenerate if content is just a marker string
            const isStandalonePdf = contract.pdf_url && 
                (contract.content?.startsWith('Umowa wgrana jako PDF') || !contract.content?.trim());

            if (isStandalonePdf) {
                console.log(`[CONTRACT_S3_SAVE] Contract ${contractId} is a standalone PDF upload. Skipping regeneration to preserve original content.`);
                return NextResponse.json({ 
                    success: true, 
                    pdfUrl: contract.pdf_url,
                    note: 'Standalone PDF — original file preserved'
                });
            }

            // Generate PRE-signature version (unsigned contract)
            console.log(`[CONTRACT_S3_SAVE] Generating unsigned PDF for contract ${contractId}...`);
            const pdfBufferUnsigned = await generateContractPDF(contract, false);
            console.log(`[CONTRACT_S3_SAVE] Unsigned PDF generated, size: ${pdfBufferUnsigned.length} bytes`);

            const fileNameUnsigned = `umowa_${contract.contract_number || contractId}_${randomUUID()}.pdf`;
            const s3KeyUnsigned = `contracts/${fileNameUnsigned}`;

            console.log(`[CONTRACT_S3_SAVE] Uploading unsigned PDF to S3: ${s3KeyUnsigned}...`);
            const pdfUrlUnsigned = await uploadToS3(pdfBufferUnsigned, s3KeyUnsigned, 'application/pdf', { access: 'private' });
            console.log(`[CONTRACT_S3_SAVE] Unsigned S3 upload successful, URL: ${pdfUrlUnsigned}`);

            console.log(`[CONTRACT_S3_SAVE] Updating DB with PDF URL`);
            let updated;
            try {
                updated = await prisma.contract.updateMany({
                    where: { id: contractId, status: contract.status, updated_at: contract.updated_at },
                    data: { pdf_url: pdfUrlUnsigned },
                });
            } catch (error) {
                await deleteFromS3(pdfUrlUnsigned).catch(cleanupError => console.error('[CONTRACT_S3_SAVE] Error cleanup failed', cleanupError));
                throw error;
            }
            if (updated.count !== 1) {
                await deleteFromS3(pdfUrlUnsigned).catch(cleanupError => console.error('[CONTRACT_S3_SAVE] Lost-CAS cleanup failed', cleanupError));
                return jsonWithCorrelation({
                    error: 'Umowa została równolegle zmieniona lub wysłana. Odśwież dane.',
                    correlation_id: correlationId,
                }, correlationId, 409);
            }

            console.log(`[CONTRACT_S3_SAVE] Success! Contract ${contractId} saved to S3`);
            return jsonWithCorrelation({ success: true, pdfUrl: pdfUrlUnsigned }, correlationId);
        } catch (error: any) {
            console.error('Error saving contract to S3:', error);
            await recordAdminIncidentSafely({
                severity: 'P1', category: 'ADMIN_WRITE', reasonCode: 'ADMIN_CONTRACT_S3_SAVE_FAILED',
                summary: 'Nie udało się wygenerować lub zapisać PDF umowy', correlationId,
                details: { error: error instanceof Error ? error.message : String(error) },
            });
            return jsonWithCorrelation({
                error: 'Failed to save to S3',
                details: error.message,
                correlation_id: correlationId,
            }, correlationId, 500);
        }
    });
}
