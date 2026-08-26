import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';
import { uploadToS3 } from '@/lib/storage/s3';
import { generateContractNumber } from '@/lib/services/numbering';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const authError = await requireAuth(request);
        if (authError) return authError;

        const formData = await request.formData();
        const file = formData.get('pdf') as File;
        const clientId = formData.get('client_id') as string;

        if (!file) {
            return NextResponse.json({ error: 'Brak pliku PDF' }, { status: 400 });
        }
        if (!clientId) {
            return NextResponse.json({ error: 'Brak client_id' }, { status: 400 });
        }
        if (file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'Plik musi być w formacie PDF' }, { status: 400 });
        }
        if (file.size > 50 * 1024 * 1024) {
            return NextResponse.json({ error: 'Plik zbyt duży (max 50MB)' }, { status: 400 });
        }

        const contractNumber = await generateContractNumber('B2C');

        const buffer = Buffer.from(await file.arrayBuffer());
        const safeNumber = contractNumber.replace(/[\/\\]/g, '_');
        const fileName = `contracts/umowa_${safeNumber}_custom.pdf`;

        console.log(`[STANDALONE_CONTRACT] Uploading PDF for client ${clientId}, size: ${buffer.length}`);
        const s3Url = await uploadToS3(buffer, fileName, 'application/pdf', { access: 'private' });

        const contract = await prisma.contract.create({
            data: {
                contract_number: contractNumber,
                client_id: parseInt(clientId),
                content: `Umowa wgrana jako PDF (${file.name})`,
                status: 'draft',
                pdf_url: s3Url,
            }
        });

        console.log(`[STANDALONE_CONTRACT] Created contract ${contract.id} with PDF: ${s3Url}`);

        return NextResponse.json({ success: true, contract_id: contract.id, pdf_url: s3Url });
    } catch (error: any) {
        console.error('[STANDALONE_CONTRACT] Error:', error);
        return NextResponse.json({ error: error.message || 'Błąd tworzenia umowy' }, { status: 500 });
    }
}
