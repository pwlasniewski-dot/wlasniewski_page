import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { generateContractPDF } from '@/lib/services/pdf';
import { uploadToS3 } from '@/lib/storage/s3';

// POST /api/admin/contracts/[id]/save-s3
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req) => {
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

            const fileNameUnsigned = `umowa_${contract.contract_number || contractId}.pdf`;
            const s3KeyUnsigned = `contracts/${fileNameUnsigned}`;

            console.log(`[CONTRACT_S3_SAVE] Uploading unsigned PDF to S3: ${s3KeyUnsigned}...`);
            const pdfUrlUnsigned = await uploadToS3(pdfBufferUnsigned, s3KeyUnsigned, 'application/pdf');
            console.log(`[CONTRACT_S3_SAVE] Unsigned S3 upload successful, URL: ${pdfUrlUnsigned}`);

            // If contract is signed, also generate POST-signature version with signature section
            if (contract.status === 'signed' && contract.signed_at) {
                console.log(`[CONTRACT_S3_SAVE] Contract is signed, generating signed PDF version...`);
                const pdfBufferSigned = await generateContractPDF(contract, true);
                console.log(`[CONTRACT_S3_SAVE] Signed PDF generated, size: ${pdfBufferSigned.length} bytes`);

                const fileNameSigned = `umowa_${contract.contract_number || contractId}_podpisana.pdf`;
                const s3KeySigned = `contracts/${fileNameSigned}`;

                console.log(`[CONTRACT_S3_SAVE] Uploading signed PDF to S3: ${s3KeySigned}...`);
                const pdfUrlSigned = await uploadToS3(pdfBufferSigned, s3KeySigned, 'application/pdf');
                console.log(`[CONTRACT_S3_SAVE] Signed S3 upload successful, URL: ${pdfUrlSigned}`);
            }

            console.log(`[CONTRACT_S3_SAVE] Updating DB with PDF URL`);
            await prisma.contract.update({
                where: { id: contractId },
                data: { pdf_url: pdfUrlUnsigned }
            });

            console.log(`[CONTRACT_S3_SAVE] Success! Contract ${contractId} saved to S3`);
            return NextResponse.json({ success: true, pdfUrl: pdfUrlUnsigned });
        } catch (error: any) {
            console.error('Error saving contract to S3:', error);
            return NextResponse.json({
                error: 'Failed to save to S3',
                details: error.message
            }, { status: 500 });
        }
    });
}
