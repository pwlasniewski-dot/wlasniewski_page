import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// PayU integration for booking payments
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

        // Get PayU configuration from settings
        const settings = await prisma.setting.findMany({
            where: {
                setting_key: { in: ['payu_client_id', 'payu_client_secret', 'payu_pos_id', 'payu_test_mode'] }
            }
        });

        const config: any = {};
        settings.forEach(s => {
            config[s.setting_key] = s.setting_value;
        });

        const payuClientId = config.payu_client_id || process.env.PAYU_CLIENT_ID;
        const payuClientSecret = config.payu_client_secret || process.env.PAYU_CLIENT_SECRET;
        const payuPosId = config.payu_pos_id || process.env.PAYU_POS_ID;
        const isTestMode = config.payu_test_mode === 'true' || process.env.PAYU_TEST_MODE === 'true';

        const payuBaseUrl = isTestMode ? 'https://sandbox.payu.com' : 'https://secure.payu.com';

        // Get PayU OAuth token
        const tokenRes = await fetch(`${payuBaseUrl}/pl/standard/user/oauth/authorize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: payuClientId,
                client_secret: payuClientSecret,
            }).toString(),
        });

        if (!tokenRes.ok) {
            console.error('PayU token error:', await tokenRes.text());
            return NextResponse.json({ error: 'Payment gateway error' }, { status: 500 });
        }

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) {
            console.error('No access token from PayU');
            return NextResponse.json({ error: 'Payment gateway error' }, { status: 500 });
        }

        // Create PayU order
        const orderPayload = {
            notifyUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl'}/api/payu/notify`,
            customerIp: request.headers.get('x-forwarded-for') || '127.0.0.1',
            merchantPosId: payuPosId,
            description: `${serviceName} - ${packageName}`,
            currencyCode: 'PLN',
            totalAmount: amount,
            buyer: {
                email: email,
                phone: '0000000000'
            },
            products: [
                {
                    name: `${serviceName} - ${packageName}`,
                    unitPrice: amount,
                    quantity: 1,
                    virtual: true
                }
            ],
            extOrderId: String(bookingId) // Use booking ID as external order ID
        };

        const orderRes = await fetch(`${payuBaseUrl}/api/v2_1/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(orderPayload),
        });

        if (!orderRes.ok) {
            console.error('PayU order error:', await orderRes.text());
            return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
        }

        const orderData = await orderRes.json();
        const payuOrderId = orderData.orderId;
        const redirectUri = orderData.redirectUri;

        if (!payuOrderId || !redirectUri) {
            console.error('Invalid PayU response:', orderData);
            return NextResponse.json({ error: 'Invalid payment gateway response' }, { status: 500 });
        }

        // Update booking with PayU order ID
        await prisma.booking.update({
            where: { id: bookingId },
            data: {
                stripe_session_id: payuOrderId, // Reuse field for PayU order ID
            }
        });

        return NextResponse.json({
            success: true,
            url: redirectUri,
            bookingId,
            payuOrderId
        });
    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }
}
