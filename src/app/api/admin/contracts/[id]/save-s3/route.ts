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

            // Actual S3 upload implementation
            console.log(`[CONTRACT_S3_SAVE] Generating PDF for contract ${contractId}...`);

            const clientName = contract.user?.name || contract.offer?.user?.name || contract.offer?.client_email || 'Kliencie';
            const eventDate = ""; // Could be extracted if needed

            const pdfBuffer = await generateContractPDF(contract, clientName, eventDate);

            const fileName = `umowa_${contract.contract_number || contractId}.pdf`;
            const s3Key = `contracts/${fileName}`;

            console.log(`[CONTRACT_S3_SAVE] Uploading to S3: ${s3Key}...`);
            const pdfUrl = await uploadToS3(pdfBuffer, s3Key, 'application/pdf');

            console.log(`[CONTRACT_S3_SAVE] Updating DB with PDF URL: ${pdfUrl}`);
            await prisma.contract.update({
                where: { id: contractId },
                data: { pdf_url: pdfUrl }
            });

            return NextResponse.json({ success: true, pdfUrl });
        } catch (error: any) {
            console.error('Error saving contract to S3:', error);
            return NextResponse.json({
                error: 'Failed to save to S3',
                details: error.message
            }, { status: 500 });
        }
    });
}
