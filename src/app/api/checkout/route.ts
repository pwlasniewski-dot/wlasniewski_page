import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { createPayUOrder, OrderRequest, extractClientIpv4 } from '@/lib/payu';

// PayU integration for booking payments
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            bookingId,
            amount, // Expected in PLN from frontend
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

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl';
        const clientIp = extractClientIpv4(
            request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        );

        const orderRequest: OrderRequest = {
            description: `${serviceName} - ${packageName}`,
            currencyCode: 'PLN',
            totalAmount: Math.round(Number(amount) * 100), // Convert PLN to grosze for PayU
            extOrderId: `BOOKING_${bookingId}_${Date.now()}`,
            buyer: {
                email: email,
                firstName: email.split('@')[0], // Fallback if name not passed
                language: 'pl',
            },
            products: [
                {
                    name: `${serviceName} - ${packageName}`,
                    unitPrice: Math.round(Number(amount) * 100),
                    quantity: 1,
                }
            ],
            continueUrl: `${baseUrl}/rezerwacja/potwierdzenie?bookingId=${bookingId}`
        };

        // Create PayU order using unified library
        let payuData;
        try {
            payuData = await createPayUOrder(orderRequest, clientIp);
        } catch (payuError: any) {
            console.error('PayU Order Error:', payuError);
            return NextResponse.json(
                { error: 'Payment initialization failed', details: payuError.message },
                { status: 500 }
            );
        }

        // Check for redirect URL (302 response) or standard link
        const redirectUri = payuData.redirectUri || payuData.links?.find((link: any) => link.rel === 'redirect_uri')?.href;
        const payuOrderId = payuData.orderId || payuData.orders?.[0]?.orderId;

        if (!redirectUri) {
            console.error('No redirect URI in PayU response:', payuData);
            return NextResponse.json({ error: 'Invalid payment gateway response' }, { status: 500 });
        }

        // Update booking with PayU order ID
        await prisma.booking.update({
            where: { id: Number(bookingId) },
            data: {
                stripe_session_id: payuOrderId || null, // Reuse field for PayU order ID
            }
        });

        return NextResponse.json({
            success: true,
            url: redirectUri,
            bookingId,
            payuOrderId
        });
    } catch (error: any) {
        console.error('Checkout error:', error);
        return NextResponse.json({ error: 'Failed to create checkout session', details: error.message }, { status: 500 });
    }
}
