import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateIcs } from '@/lib/photo-challenge/voucher';
import { deriveShortCode } from '@/lib/photo-challenge/short-code';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ unique_link: string }> }
) {
    const { unique_link } = await params;

    const challenge = await prisma.photoChallenge.findUnique({
        where: { unique_link },
        include: { package: true, location: true },
    });

    if (!challenge) {
        return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    if (challenge.status !== 'accepted' && challenge.status !== 'completed') {
        return NextResponse.json({ success: false, error: 'Brak potwierdzonego terminu.' }, { status: 403 });
    }
    if ((challenge as any).payment_status !== 'paid') {
        return NextResponse.json({ success: false, error: 'Brak potwierdzonej płatności.' }, { status: 403 });
    }

    const booking = await prisma.booking.findFirst({ where: { challenge_id: challenge.id } });
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl';
    const ics = generateIcs(challenge, booking, baseUrl);

    if (!ics) {
        return NextResponse.json({ success: false, error: 'Termin nieustalony.' }, { status: 422 });
    }

    const shortCode = deriveShortCode(challenge.unique_link);
    return new NextResponse(ics, {
        status: 200,
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': `attachment; filename="foto-wyzwanie-${shortCode}.ics"`,
            'Cache-Control': 'private, no-store',
        },
    });
}
