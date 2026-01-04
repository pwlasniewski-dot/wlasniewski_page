import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { nanoid } from 'nanoid';
import { sendEmail } from '@/lib/email/sender';
import { createPayUOrder, OrderRequest } from '@/lib/payu';

export const dynamic = 'force-dynamic';

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
                card_id: Number(cardId),
                gift_card_id: Number(cardId),
                customer_email: customerEmail,
                customer_name: customerName,
                recipient_name: recipientName,
                recipient_email: recipientEmail,
                message: message ? message.slice(0, 25) : undefined,
                sender_name: senderName,
                payment_method: 'payu',
                amount_paid: Math.round(Number(price) * 100), // Convert to groszy
                access_token: accessToken,
            }
        });

        // Prepare PayU Order Data
        const origin = request.headers.get('origin');
        const baseUrl = origin || process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl';

        let clientIp = '127.0.0.1';
        try {
            const forwarded = request.headers.get('x-forwarded-for');
            clientIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
        } catch (e) {
            console.error('Error parsing IP:', e);
        }

        console.log(`[Checkout] Processing order for Card ${card.id}. IP: ${clientIp}`);

        const orderRequest: OrderRequest = {
            description: `Karta Podarunkowa - ${theme} (${value} PLN)`,
            currencyCode: 'PLN',
            totalAmount: Math.round(price * 100),
            extOrderId: `GIFT_${order.id}_${Date.now()}`,
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
            ],
            // PayU requires a continue URL, ensuring user comes back to the site
            continueUrl: `${baseUrl}/karta-podarunkowa/podziekowanie?orderId=${order.id}&token=${order.access_token}`,
        };

        // Execute PayU Call via Library (uses DB settings)
        let payuData;
        try {
            payuData = await createPayUOrder(orderRequest, clientIp);
        } catch (payuError: any) {
            console.error('PayU Library Error:', payuError);
            console.error(payuError?.stack);
            return NextResponse.json(
                { error: 'Payment initialization failed', details: payuError.message, stack: payuError.stack },
                { status: 500 }
            );
        }

        // Check for redirectUri (302 response) or standard links (201 response)
        const checkoutUrl = payuData.redirectUri || payuData.links?.find((link: any) => link.rel === 'redirect_uri')?.href;
        // In 302 response, orderId is at root. In 201 response, it's in orders[0].
        const payuOrderId = payuData.orderId || payuData.orders?.[0]?.orderId || 'UNKNOWN';

        if (!checkoutUrl) {
            throw new Error("Failed to retrieve PayU redirect URL");
        }

        // Update order with PayU order ID
        await prisma.giftCardOrder.update({
            where: { id: order.id },
            data: {
                payu_order_id: payuOrderId,
                stripe_session_id: payuOrderId
            }
        });

        // Send confirmation email to customer
        try {
            const confirmationHtml = `
                <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #000000; color: #ffffff; margin: 0; padding: 0; }
                            .container { max-width: 600px; margin: 0 auto; background: #111111; border: 1px solid #333; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.8); }
                            .header { background: #000; padding: 40px; text-align: center; border-bottom: 2px solid #222; }
                            .premium-line { height: 1px; width: 40px; background: #d4af37; margin: 15px auto; }
                            .title { color: #d4af37; font-size: 20px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; margin: 0; }
                            .content { padding: 40px; text-align: center; }
                            .greeting { font-size: 20px; color: #ffffff; margin-bottom: 20px; font-weight: 500; }
                            .text { color: #dddddd; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
                            
                            .info-box { background: #1a1a1a; border-radius: 12px; padding: 25px; text-align: left; margin: 30px 0; border-left: 4px solid #d4af37; }
                            .info-row { display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #333; padding-bottom: 12px; }
                            .info-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
                            .info-label { color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
                            .info-val { color: #fff; font-size: 16px; font-weight: 500; }
                            
                            .status-badge { 
                                display: inline-block; 
                                background: #222; 
                                color: #d4af37; 
                                padding: 10px 20px; 
                                border-radius: 50px; 
                                border: 1px solid #d4af37;
                                font-weight: bold;
                                text-transform: uppercase;
                                font-size: 12px;
                                letter-spacing: 1px;
                                margin-top: 20px;
                            }
                            
                            .footer { background: #050505; padding: 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #222; line-height: 1.6; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1 class="title">Exclusive Gift Card</h1>
                                <div class="premium-line"></div>
                                <div style="font-size: 11px; color: #888; letter-spacing: 2px;">POTWIERDZENIE ZAMÓWIENIA</div>
                            </div>
                            
                            <div class="content">
                                <div class="greeting">Cześć ${customerName.split(' ')[0]}!</div>
                                <div class="text">
                                    Dziękujemy za złożenie zamówienia na Kartę Podarunkową.
                                    <br>Twoja płatność jest obecnie przetwarzana.
                                </div>

                                <div class="info-box">
                                    <div class="info-row">
                                        <span class="info-label">Numer zamówienia</span>
                                        <span class="info-val">#${order.id}</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="info-label">Wartość karty</span>
                                        <span class="info-val">${Math.round(value)} PLN</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="info-label">Do zapłaty</span>
                                        <span class="info-val">${Math.round(price)} PLN</span>
                                    </div>
                                </div>

                                <div class="text">
                                    Gdy tylko otrzymamy potwierdzenie płatności, wyślemy do Ciebie kolejną wiadomość z linkiem do Twojej karty.
                                </div>

                                <div class="status-badge">⏳ Oczekiwanie na płatność</div>
                            </div>

                            <div class="footer">
                                <p>Jeśli masz pytania, skontaktuj się z nami: ${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'kontakt@wlasniewski.pl'}</p>
                                <p>© Fotograf Wlasniewski</p>
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
            checkoutUrl: checkoutUrl,
            payuOrderId: payuOrderId,
            orderId: order.id,
            accessToken: accessToken
        });
    } catch (error: any) {
        console.error('Checkout error [FATAL]:', error);
        return NextResponse.json(
            {
                error: 'Checkout failed',
                details: error.message || 'Unknown error',
                success: false
            },
            { status: 500 }
        );
    }
}
