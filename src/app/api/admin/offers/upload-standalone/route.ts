import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';
import { uploadToS3 } from '@/lib/storage/s3';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const authError = await requireAuth(request);
        if (authError) return authError;

        const formData = await request.formData();
        const file = formData.get('pdf') as File;
        const clientId = formData.get('client_id') as string;
        const clientEmail = formData.get('client_email') as string;

        if (!file) {
            return NextResponse.json({ error: 'Brak pliku PDF' }, { status: 400 });
        }
        if (!clientEmail) {
            return NextResponse.json({ error: 'Brak client_email' }, { status: 400 });
        }
        if (file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'Plik musi być w formacie PDF' }, { status: 400 });
        }
        if (file.size > 50 * 1024 * 1024) {
            return NextResponse.json({ error: 'Plik zbyt duży (max 50MB)' }, { status: 400 });
        }

        // Generate offer number
        const year = new Date().getFullYear();
        const count = await prisma.offer.count();
        const offerNumber = `OF/${year}/${String(count + 1).padStart(3, '0')}`;

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `offers/oferta_${offerNumber.replace(/\//g, '_')}_custom.pdf`;

        console.log(`[STANDALONE_OFFER] Uploading PDF for client ${clientEmail}, size: ${buffer.length}`);
        const s3Url = await uploadToS3(buffer, fileName, 'application/pdf');

        const offer = await prisma.offer.create({
            data: {
                title: `Oferta (PDF) - ${file.name.replace('.pdf', '')}`,
                client_email: clientEmail,
                client_id: clientId ? parseInt(clientId) : undefined,
                type: 'b2c',
                status: 'sent',
                pdf_url: s3Url,
                valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            }
        });

        console.log(`[STANDALONE_OFFER] Created offer ${offer.id} with PDF: ${s3Url}`);

        return NextResponse.json({ success: true, offer_id: offer.id, pdf_url: s3Url });
    } catch (error: any) {
        console.error('[STANDALONE_OFFER] Error:', error);
        return NextResponse.json({ error: error.message || 'Błąd tworzenia oferty' }, { status: 500 });
    }
}
