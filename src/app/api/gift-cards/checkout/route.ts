import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { nanoid } from 'nanoid';
import { sendEmail } from '@/lib/email/sender';

export const dynamic = 'force-dynamic';

// Get OAuth token from PayU
async function getPayUToken() {
    const clientId = process.env.PAYU_CLIENT_ID;
    const clientSecret = process.env.PAYU_CLIENT_SECRET;
    const baseUrl = process.env.PAYU_TEST_MODE === 'true' 
        ? 'https://secure.sandbox.payu.com'
        : 'https://secure.payu.com';

    const response = await fetch(`${baseUrl}/pl/standard/user/oauth/authorize`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId || '',
            client_secret: clientSecret || '',
        }).toString(),
    });

    if (!response.ok) {
        throw new Error('Failed to get PayU OAuth token');
    }

    const data = await response.json();
    return data.access_token;
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
                payment_method: 'payu',
                amount_paid: Math.round(price * 100), // Convert to groszy
                access_token: accessToken,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            }
        });

        // Create PayU order
        const oauthToken = await getPayUToken();
        const baseUrl = process.env.PAYU_TEST_MODE === 'true'
            ? 'https://secure.sandbox.payu.com'
            : 'https://secure.payu.com';

        const payuResponse = await fetch(`${baseUrl}/api/v2_1/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${oauthToken}`,
            },
            body: JSON.stringify({
                notifyUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl'}/api/payu/notify`,
                customerIp: request.headers.get('x-forwarded-for') || '127.0.0.1',
                merchantPosId: process.env.PAYU_POS_ID,
                description: `Karta Podarunkowa - ${theme} (${value} PLN)`,
                currencyCode: 'PLN',
                totalAmount: Math.round(price * 100),
                extOrderId: order.id.toString(),
                buyer: {
                    email: customerEmail,
                    firstName: customerName.split(' ')[0],
                    lastName: customerName.split(' ').slice(1).join(' ') || 'N/A',
                    language: 'pl',
                },
                products: [
                    {
                        name: `Karta Podarunkowa - ${theme}`,
                        unitPrice: Math.round(price * 100),
                        quantity: 1,
                    }
                ]
            }),
        });

        if (!payuResponse.ok) {
            throw new Error('Failed to create PayU order');
        }

        const payuData = await payuResponse.json();
        const payuOrderId = payuData.orders[0].orderId;

        // Update order with PayU order ID
        await prisma.giftCardOrder.update({
            where: { id: order.id },
            data: { stripe_session_id: payuOrderId } // Reuse field for PayU order ID
        });

        // Send confirmation email to customer
        try {
            const confirmationHtml = `
                <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: Arial, sans-serif; background: #0f0f0f; color: #fff; }
                            .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; padding: 40px; border-radius: 12px; }
                            .header { text-align: center; margin-bottom: 30px; }
                            .info { background: #2a2a2a; padding: 20px; border-radius: 8px; margin: 20px 0; }
                            .button { display: inline-block; background: #d4af37; color: #000; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 20px; }
                            .footer { text-align: center; margin-top: 40px; border-top: 1px solid #333; padding-top: 20px; font-size: 12px; color: #888; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1 style="color: #d4af37; margin: 0;">🎁 Potwierdzenie Zamówienia</h1>
                                <p style="color: #aaa;">Karta Podarunkowa</p>
                            </div>

                            <p>Cześć ${customerName.split(' ')[0]},</p>

                            <p>Dziękujemy za złożenie zamówienia karty podarunkowej! Twoja płatność jest w toku.</p>

                            <div class="info">
                                <h3 style="margin-top: 0; color: #d4af37;">📋 Szczegóły Zamówienia</h3>
                                <p><strong>Wartość karty:</strong> ${value} PLN</p>
                                <p><strong>Cena:</strong> ${(price / 100).toFixed(2)} PLN</p>
                                <p><strong>Numer zamówienia:</strong> ${order.id}</p>
                            </div>

                            <p>Po potwierddzeniu płatności otrzymasz wiadomość email z dostępem do karty podarunkowej.</p>

                            <p style="color: #d4af37; font-weight: bold;">⏳ Czekamy na potwierdzenie płatności...</p>

                            <div class="footer">
                                <p>Jeśli masz pytania, skontaktuj się z nami: <strong>kontakt@wlasniewski.pl</strong></p>
                                <p>© Fotograf Wlasniewski - Wszystkie prawa zastrzeżone</p>
                            </div>
                        </div>
                    </body>
                </html>
            `;

            await sendEmail({
                to: customerEmail,
                subject: `✓ Potwierdzenie zamówienia karty podarunkowej`,
                html: confirmationHtml
            });
        } catch (emailErr) {
            console.error('Failed to send confirmation email:', emailErr);
            // Don't fail checkout if email fails
        }

        return NextResponse.json({
            success: true,
            checkoutUrl: payuData.links.find((link: any) => link.rel === 'redirect_uri')?.href,
            payuOrderId: payuOrderId,
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
