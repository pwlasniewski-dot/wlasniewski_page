
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';
import { sendGiftCardAccessEmail } from '@/lib/email/giftCardAccess';

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const auth = await requireAuth(request);
        if (auth instanceof NextResponse) return auth;

        const orderId = parseInt(params.id);
        if (isNaN(orderId)) {
            return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
        }

        const order = await prisma.giftCardOrder.findUnique({
            where: { id: orderId },
            include: { gift_card: true }
        });

        if (!order) {
            return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
        }

        if (!order.gift_card) {
            return NextResponse.json({ success: false, error: 'No associated gift card' }, { status: 400 });
        }

        // Allow resend if status is completed OR if admin forces it (we assume admin knows what they are doing)
        // Ideally checking payment_status === 'completed' is safer, but sometimes manual overrides are needed.
        if (order.payment_status !== 'completed' && order.payment_status !== 'paid') {
            return NextResponse.json({ success: false, error: 'Order is not paid' }, { status: 400 });
        }

        // Resend email
        // Logic: The 'access_token' is usually part of the order (GiftCardOrder model).

        if (!order.access_token) {
            console.error("No access token found for order", order.id);
            return NextResponse.json({ success: false, error: 'Order has no access token' }, { status: 500 });
        }

        await sendGiftCardAccessEmail(
            order.customer_email,
            order.customer_name,
            order.gift_card, // Object
            order.access_token, // Access Token
            order.recipient_name || undefined,
            order.recipient_email || undefined,
            undefined, // senderName
            undefined, // message
            order.id, // orderId
            order.gift_card.theme || 'christmas' // Passed theme
        );

        // Update delivery status
        await prisma.giftCardOrder.update({
            where: { id: orderId },
            data: { delivery_status: 'sent' }
        });

        return NextResponse.json({ success: true, message: 'Email sent successfully' });

    } catch (error) {
        console.error('Error resending email:', error);
        return NextResponse.json({ success: false, error: 'Failed to resend email' }, { status: 500 });
    }
}
