
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (auth instanceof NextResponse) return auth;

        const orders = await prisma.giftCardOrder.findMany({
            orderBy: {
                created_at: 'desc'
            },
            include: {
                gift_card: {
                    select: {
                        code: true,
                        value: true,
                        recipient_email: true
                    }
                }
            }
        });

        // Map for cleaner frontend consumption
        const mappedOrders = orders.map(order => ({
            id: order.id,
            customerId: order.id, // For display
            customerEmail: order.customer_email,
            customerName: order.customer_name,
            recipientName: order.recipient_name,
            recipientEmail: order.recipient_email,
            amount: order.amount_paid,
            currency: order.currency,
            status: order.payment_status,
            deliveryStatus: order.delivery_status,
            createdAt: order.created_at,
            payuOrderId: order.payu_order_id,
            stripeSessionId: order.stripe_session_id,
            paymentMethod: order.payment_method,
            giftCardCode: order.gift_card?.code,
            giftCardValue: order.gift_card?.value
        }));

        return NextResponse.json({ success: true, orders: mappedOrders });

    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
    }
}
