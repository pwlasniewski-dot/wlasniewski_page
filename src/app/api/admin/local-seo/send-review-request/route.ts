import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import prisma from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email/sender';
import { generateGoogleReviewRequestEmail } from '@/lib/email-templates';
import { logSystem } from '@/lib/logger';

export async function POST(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const { bookingId } = await request.json();
        if (!bookingId || typeof bookingId !== 'number') {
            return NextResponse.json({ ok: false, message: 'bookingId required' }, { status: 400 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            select: { id: true, email: true, client_name: true, service: true },
        });
        if (!booking) {
            return NextResponse.json({ ok: false, message: 'Booking not found' }, { status: 404 });
        }

        const placeIdSetting = await prisma.setting.findFirst({
            where: { setting_key: 'google_place_id' },
        });
        const reviewLinkSetting = await prisma.setting.findFirst({
            where: { setting_key: 'gbp_review_link' },
        });

        const reviewLink = reviewLinkSetting?.setting_value
            || (placeIdSetting?.setting_value
                ? `https://search.google.com/local/writereview?placeid=${placeIdSetting.setting_value}`
                : null);

        if (!reviewLink) {
            return NextResponse.json(
                { ok: false, message: 'Brak linku do recenzji — skonfiguruj w panelu Local SEO' },
                { status: 400 }
            );
        }

        await sendEmail({
            to: booking.email,
            subject: `${booking.client_name}, dziękuję za zaufanie ⭐`,
            html: generateGoogleReviewRequestEmail({
                clientName: booking.client_name,
                service: booking.service,
                reviewLink,
            }),
        });

        await logSystem('INFO', 'LOCAL_SEO', `Manual Google review request sent`, {
            bookingId: booking.id,
            email: booking.email,
        });

        return NextResponse.json({ ok: true, email: booking.email });
    } catch (e) {
        await logSystem('ERROR', 'LOCAL_SEO', `Failed to send manual review request`, { error: String(e) });
        return NextResponse.json({ ok: false, message: String(e) }, { status: 500 });
    }
}
