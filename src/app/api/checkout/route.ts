import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// For now, this is a placeholder. In production, integrate with Stripe.
// POST - Create Stripe checkout session
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            bookingId,
            amount,
            email,
            serviceName,
            packageName
        } = body;

        if (!bookingId || !amount || !email) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // TODO: Integrate with Stripe
        // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        //
        // const session = await stripe.checkout.sessions.create({
        //     payment_method_types: ['card', 'p24'],
        //     line_items: [{
        //         price_data: {
        //             currency: 'pln',
        //             product_data: {
        //                 name: `${serviceName} - ${packageName}`,
        //             },
        //             unit_amount: amount, // in cents
        //         },
        //         quantity: 1,
        //     }],
        //     mode: 'payment',
        //     customer_email: email,
        //     success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/rezerwacja/potwierdzenie?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
        //     cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/rezerwacja/anulowana`,
        //     metadata: {
        //         bookingId: String(bookingId),
        //         serviceName,
        //         packageName
        //     }
        // });

        // Temporary: Return success without actual Stripe integration
        // In production, uncomment the Stripe code above and return session.url
        
        return NextResponse.json({
            success: true,
            message: 'Payment system not configured yet',
            // url: session.url, // Uncomment when Stripe is set up
            url: null,
            bookingId
        });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }
}
