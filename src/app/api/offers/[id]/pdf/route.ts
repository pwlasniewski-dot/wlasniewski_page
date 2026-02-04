import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateOfferPDF } from '@/lib/services/pdf';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const offerId = parseInt(id);

        const offer = await prisma.offer.findUnique({
            where: { id: offerId },
            include: {
                sections: {
                    include: { items: true },
                },
            },
        });

        if (!offer) {
            return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
        }

        const pdfBuffer = await generateOfferPDF(offer);

        return new NextResponse(pdfBuffer as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="oferta-${offer.slug}.pdf"`,
            },
        });
    } catch (error) {
        console.error('Error serving PDF:', error);
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
}
