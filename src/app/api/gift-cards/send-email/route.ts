import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email/sender';
import { requireAuth } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: 'Gift card ID is required' }, { status: 400 });
        }

        // Fetch gift card
        const giftCard = await prisma.giftCard.findUnique({
            where: { id: parseInt(id) }
        });

        if (!giftCard) {
            return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });
        }

        if (!giftCard.recipient_email) {
            return NextResponse.json({ error: 'Recipient email is missing' }, { status: 400 });
        }

        // Prepare email content
        const discountText = giftCard.discount_type === 'percentage'
            ? `${giftCard.amount}% zniżki`
            : `${giftCard.amount} PLN zniżki`;

        const validUntilText = giftCard.valid_until
            ? `Voucher ważny do: ${new Date(giftCard.valid_until).toLocaleDateString('pl-PL')}`
            : 'Voucher bezterminowy';

        // Get settings for logo
        const settings = await prisma.setting.findFirst({
            orderBy: { id: 'asc' }
        });

        // Use logo from settings
        let logoUrl = (settings as any)?.logo_url;

        // Ensure it's an absolute URL
        if (logoUrl && !logoUrl.startsWith('http')) {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl';
            logoUrl = baseUrl + (logoUrl.startsWith('/') ? logoUrl : '/' + logoUrl);
        }

        const { generateGiftCardEmail } = await import('@/lib/email/giftCardTemplate');

        const htmlContent = generateGiftCardEmail(
            giftCard.recipient_name || 'Odbiorca',
            giftCard.code,
            giftCard.value || giftCard.amount,
            giftCard.theme || giftCard.card_template || 'christmas', // Default theme
            'Przemysław Właśniewski Fotografia',
            giftCard.message || '',
            logoUrl,
            giftCard.card_title || 'KARTA PODARUNKOWA',
            giftCard.card_description || undefined,
            { showPrice: giftCard.show_price, validUntil: giftCard.valid_until }
        );

        // Send email
        await sendEmail({
            to: giftCard.recipient_email,
            subject: `🎁 Twoja Karta Podarunkowa - Przemysław Właśniewski Fotografia`,
            html: htmlContent
        });

        // Send check/copy to admin
        try {
            const { getAdminEmail } = await import('@/lib/email/sender');
            const adminEmail = await getAdminEmail();
            if (adminEmail) {
                await sendEmail({
                    to: adminEmail,
                    subject: `[KOPIA] 🎁 Karta wysłana do ${giftCard.recipient_name || 'Klienta'}`,
                    html: htmlContent
                });
            }
        } catch (e) {
            console.error('Failed to send admin copy:', e);
        }

        return NextResponse.json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('[Gift Card Email] Error:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}
