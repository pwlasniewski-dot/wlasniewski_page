import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';
import { uploadToS3 } from '@/lib/storage/s3';

export const dynamic = 'force-dynamic';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const authError = await requireAuth(request);
        if (authError) return authError;

        const { id } = await context.params;
        const contractId = parseInt(id);

        const contract = await prisma.contract.findUnique({ where: { id: contractId } });
        if (!contract) {
            return NextResponse.json({ error: 'Umowa nie znaleziona' }, { status: 404 });
        }

        const formData = await request.formData();
        const file = formData.get('pdf') as File;
        if (!file) {
            return NextResponse.json({ error: 'Brak pliku PDF' }, { status: 400 });
        }

        if (file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'Plik musi być w formacie PDF' }, { status: 400 });
        }

        // Max 50MB
        if (file.size > 50 * 1024 * 1024) {
            return NextResponse.json({ error: 'Plik zbyt duży (max 50MB)' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `contracts/umowa_${contract.contract_number || contractId}_custom.pdf`;

        console.log(`[ADMIN_UPLOAD_PDF] Uploading custom PDF for contract ${contractId}, size: ${buffer.length}`);
        const s3Url = await uploadToS3(buffer, fileName, 'application/pdf');
        console.log(`[ADMIN_UPLOAD_PDF] Uploaded to: ${s3Url}`);

        await prisma.contract.update({
            where: { id: contractId },
            data: { pdf_url: s3Url }
        });

        return NextResponse.json({ success: true, pdf_url: s3Url });
    } catch (error: any) {
        console.error('[ADMIN_UPLOAD_PDF] Error:', error);
        return NextResponse.json({ error: error.message || 'Błąd uploadu' }, { status: 500 });
    }
}
