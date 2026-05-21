import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractToken } from '@/lib/auth/jwt';
import { generateFamilyVoucherPdfBuffer } from '@/lib/offers/familyVoucher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const tokenFromQuery = request.nextUrl.searchParams.get('token');
        const token = extractToken(request.headers.get('authorization'))
            || tokenFromQuery
            || request.cookies.get('client_token')?.value
            || request.cookies.get('user_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const offerId = Number(id);

        const offer = await prisma.offer.findUnique({
            where: { id: offerId },
            select: {
                id: true,
                title: true,
                category: true,
                client_id: true,
                client_email: true,
            },
        });

        if (!offer) {
            return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
        }

        if (offer.client_id !== decoded.id && offer.client_email !== decoded.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const isFamilySession = (offer.category || '').toLowerCase().includes('rodzin') || (offer.category || '').toLowerCase() === 'family';
        if (!isFamilySession) {
            return NextResponse.json({ error: 'Voucher dostępny tylko dla sesji rodzinnych' }, { status: 400 });
        }

        const searchParams = request.nextUrl.searchParams;
        const senderName = searchParams.get('senderName') || 'Osoba zamawiająca';
        const recipientName = searchParams.get('recipientName') || 'Rodzice';
        const packageName = searchParams.get('packageName') || 'Do wyboru';
        const packagePriceLabel = searchParams.get('packagePriceLabel') || 'Do ustalenia';
        const hidePrice = searchParams.get('hidePrice') === '1';
        const sessionDate = searchParams.get('sessionDate') || 'Termin do uzgodnienia';
        const sessionTime = searchParams.get('sessionTime') || 'Godzina do uzgodnienia';
        const location = searchParams.get('location') || 'Lokalizacja do uzgodnienia';
        const verificationCode = searchParams.get('verificationCode') || `RODZ${offerId}`;
        const qrTarget = 'https://wlasniewski.pl';

        const pdfBuffer = await generateFamilyVoucherPdfBuffer({
            senderName,
            recipientName,
            packageName,
            packagePriceLabel,
            hidePrice,
            sessionDate,
            sessionTime,
            location,
            verificationCode,
            qrTarget,
        });

        return new NextResponse(pdfBuffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="voucher-rodzinny-${offerId}.pdf"`,
                'Cache-Control': 'private, no-store',
            },
        });
    } catch (error) {
        console.error('[family-voucher] error:', error);
        return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
    }
}