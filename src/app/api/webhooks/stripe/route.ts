import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import prisma from '@/lib/db/prisma';
import { sendGiftCardAccessEmail } from '@/lib/email/giftCardAccess';

export const dynamic = 'force-dynamic';

let stripe: any = null;

function getStripe() {
    if (!stripe) {
        const Stripe = require('stripe').default;
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
    }
    return stripe;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('stripe-signature') || '';

        // Verify webhook signature
        let event;
        try {
            const stripeClient = getStripe();
            event = stripeClient.webhooks.constructEvent(
                body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET || ''
            );
        } catch (err: any) {
            console.error('Webhook signature verification failed:', err.message);
            return NextResponse.json(
                { error: 'Webhook verification failed' },
                { status: 400 }
            );
        }

        console.log('📦 Stripe event:', event.type);

        // Handle checkout.session.completed
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            const orderId = session.metadata?.order_id;

            if (!orderId) {
                console.error('❌ No order_id in session metadata');
                return NextResponse.json({ success: false });
            }

            // Verify and Clone Gift Card (Template -> Instance)
            const originalOrder = await prisma.giftCardOrder.findUnique({
                where: { id: parseInt(orderId) },
                include: { gift_card: true }
            });

            if (originalOrder && originalOrder.gift_card) {
                // If the card is a template (or just the product card), we create a unique copy for this user
                // We use the 'generateGiftCardCode' to ensure uniqueness
                const { generateGiftCardCode } = await import('@/lib/gift-cards');
                const uniqueCode = generateGiftCardCode();

                const newCard = await prisma.giftCard.create({
                    data: {
                        code: uniqueCode,
                        amount: originalOrder.gift_card.amount,
                        value: originalOrder.gift_card.value,
                        theme: originalOrder.gift_card.theme,
                        card_template: originalOrder.gift_card.card_template,
                        card_title: originalOrder.gift_card.card_title,
                        card_description: originalOrder.gift_card.card_description,
                        recipient_email: originalOrder.recipient_email || originalOrder.customer_email,
                        recipient_name: originalOrder.recipient_name || originalOrder.customer_name,
                        sender_name: originalOrder.sender_name,
                        message: originalOrder.message,
                        created_by: originalOrder.gift_card.created_by,
                        status: 'active'
                    }
                });

                // Update order to point to the new unique card
                await prisma.giftCardOrder.update({
                    where: { id: parseInt(orderId) },
                    data: {
                        gift_card_id: newCard.id
                    }
                });

                console.log(`✅ Cloned GiftCard Template #${originalOrder.gift_card.id} to New Instance #${newCard.id} (${uniqueCode})`);
            }

            // Update order status
            const order = await prisma.giftCardOrder.update({
                where: { id: parseInt(orderId) },
                data: {
                    payment_status: 'completed',
                    stripe_payment_id: session.payment_intent as string,
                    paid_at: new Date()
                },
                include: {
                    gift_card: true
                }
            });

            console.log('✅ Order paid:', order.id);

            // Send email with access
            if (order.customer_email) {
                try {
                    await sendGiftCardAccessEmail(
                        order.customer_email,
                        order.customer_name,
                        order.gift_card, // Now points to the NEW card
                        order.access_token || '',
                        order.recipient_name || undefined,
                        order.recipient_email || undefined,
                        order.sender_name || undefined,
                        order.message || undefined,
                        order.id,
                        order.gift_card.theme || 'christmas'
                    );

                    console.log('📧 Email sent to:', order.customer_email);

                    // Mark as email sent
                    await prisma.giftCardOrder.update({
                        where: { id: order.id },
                        data: { delivery_status: 'email_sent' }
                    });
                } catch (emailError) {
                    console.error('❌ Error sending email:', emailError);
                }
            }

            return NextResponse.json({ success: true });
        }

        // Handle payment_intent.payment_failed
        if (event.type === 'payment_intent.payment_failed') {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;

            // Find order by payment intent
            const order = await prisma.giftCardOrder.findFirst({
                where: { stripe_payment_id: paymentIntent.id }
            });

            if (order) {
                await prisma.giftCardOrder.update({
                    where: { id: order.id },
                    data: { payment_status: 'failed' }
                });

                console.log('❌ Payment failed for order:', order.id);
            }

            return NextResponse.json({ success: true });
        }

        // Handle charge.refunded
        if (event.type === 'charge.refunded') {
            const charge = event.data.object as Stripe.Charge;

            // Find order by charge
            const order = await prisma.giftCardOrder.findFirst({
                where: { stripe_payment_id: charge.payment_intent as string }
            });

            if (order) {
                await prisma.giftCardOrder.update({
                    where: { id: order.id },
                    data: { payment_status: 'cancelled' }
                });

                console.log('↩️ Payment refunded for order:', order.id);
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed', details: error.message },
            { status: 500 }
        );
    }
}
