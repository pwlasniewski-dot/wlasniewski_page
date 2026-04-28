import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateVoucherPdfBuffer } from '@/lib/photo-challenge/voucher';
import { deriveShortCode } from '@/lib/photo-challenge/short-code';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ unique_link: string }> }
) {
    try {
        const { unique_link } = await params;

        const challenge = await prisma.photoChallenge.findUnique({
            where: { unique_link },
            include: { package: true, location: true },
        });

        if (!challenge) {
            return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
        }

        if (challenge.status !== 'accepted' && challenge.status !== 'completed') {
            return NextResponse.json(
                { success: false, error: 'Voucher dostępny po akceptacji zaproszenia.' },
                { status: 403 }
            );
        }

        const booking = await prisma.booking.findFirst({ where: { challenge_id: challenge.id } });
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl';
        const shortCode = deriveShortCode(challenge.unique_link);

        const pdfBuffer = await generateVoucherPdfBuffer(challenge, booking, baseUrl);

        return new NextResponse(pdfBuffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="voucher-foto-wyzwanie-${shortCode}.pdf"`,
                'Cache-Control': 'private, no-store',
            },
        });
    } catch (err) {
        console.error('[voucher] error:', err);
        return NextResponse.json({ success: false, error: 'PDF generation failed' }, { status: 500 });
    }
}
