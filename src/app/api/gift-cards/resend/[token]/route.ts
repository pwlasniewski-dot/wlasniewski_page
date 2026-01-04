import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sendGiftCardAccessEmail } from '@/lib/email/giftCardAccess';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email jest wymagany' }, { status: 400 });
        }

        // Find order by access token
        const order = await prisma.giftCardOrder.findUnique({
            where: { access_token: token },
            include: {
                gift_card: true
            },
        });

        if (!order) {
            return NextResponse.json({ error: 'Karta nie znaleziona' }, { status: 404 });
        }

        if (order.payment_status !== 'completed') {
            return NextResponse.json({ error: 'Zamówienie nie zostało opłacone' }, { status: 403 });
        }

        // Resend email
        await sendGiftCardAccessEmail(
            email,
            order.customer_name,
            order.gift_card,
            order.access_token as string,
            order.recipient_name || undefined,
            order.recipient_email || undefined,
            order.sender_name || undefined,
            order.message || undefined,
            order.id,
            (order.gift_card as any)?.theme || 'gold'
        );

        return NextResponse.json({ success: true, message: 'Email został wysłany' });
    } catch (error) {
        console.error('Error resending gift card email:', error);
        return NextResponse.json(
            { error: 'Błąd podczas wysyłania maila' },
            { status: 500 }
        );
    }
}
