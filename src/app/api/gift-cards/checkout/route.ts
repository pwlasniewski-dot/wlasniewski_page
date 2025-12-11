import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

let stripe: any = null;

function getStripe() {
    if (!stripe) {
        const Stripe = require('stripe').default;
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
    }
    return stripe;
}

export async function GET() {
    return NextResponse.json(
        { error: 'Method not allowed', success: false },
        { status: 405 }
    );
}

interface CheckoutRequest {
    cardId: number;
    price: number;
    value: number;
    theme: string;
    customerEmail: string;
    customerName: string;
    recipientName?: string;
    recipientEmail?: string;
    senderName?: string;
    message?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: CheckoutRequest = await request.json();
        const {
            cardId,
            price,
            value,
            theme,
            customerEmail,
            customerName,
            recipientName,
            recipientEmail,
            senderName,
            message
        } = body;

        // Validate
        if (!cardId || !price || !customerEmail || !customerName) {
            return NextResponse.json(
                { error: 'Missing required fields', success: false },
                { status: 400 }
            );
        }

        // Get card
        const card = await prisma.giftCard.findUnique({
            where: { id: cardId }
        });

        if (!card) {
            return NextResponse.json(
                { error: 'Gift card not found', success: false },
                { status: 404 }
            );
        }

        // Create order in database
        const accessToken = nanoid(32);
        const order = await prisma.giftCardOrder.create({
            data: {
                gift_card_id: cardId,
                customer_email: customerEmail,
                customer_name: customerName,
                recipient_name: recipientName,
                recipient_email: recipientEmail,
                message: message,
                sender_name: senderName,
                payment_method: 'stripe',
                amount_paid: Math.round(price * 100), // Convert to groszy
                access_token: accessToken,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            }
        });

        // Create Stripe Checkout Session
        const stripeClient = getStripe();
        const session = await stripeClient.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            customer_email: customerEmail,
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl'}/karta-podarunkowa/sukces?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl'}/karta-podarunkowa/${cardId}/kup?canceled=true`,
            metadata: {
                order_id: order.id.toString(),
                card_id: cardId.toString(),
                access_token: accessToken
            },
            line_items: [
                {
                    price_data: {
                        currency: 'pln',
                        product_data: {
                            name: `Karta Podarunkowa - ${theme}`,
                            description: `Karta o wartości ${value} PLN`,
                            images: [
                                // Add card image if available
                            ]
                        },
                        unit_amount: Math.round(price * 100) // Price in groszy
                    },
                    quantity: 1
                }
            ]
        });

        // Update order with Stripe session ID
        await prisma.giftCardOrder.update({
            where: { id: order.id },
            data: { stripe_session_id: session.id }
        });

        return NextResponse.json({
            success: true,
            checkoutUrl: session.url,
            orderId: order.id,
            accessToken: accessToken
        });
    } catch (error: any) {
        console.error('Checkout error:', error);
        return NextResponse.json(
            { 
                error: 'Checkout failed', 
                details: error.message, 
                success: false 
            },
            { status: 500 }
        );
    }
}
