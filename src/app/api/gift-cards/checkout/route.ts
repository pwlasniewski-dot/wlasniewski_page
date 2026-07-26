import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { nanoid } from 'nanoid';
import { createPayUOrder, OrderRequest } from '@/lib/payu';

export const dynamic = 'force-dynamic';

interface CheckoutRequest {
    cardId: number;
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
        const cardId = Number(body.cardId);
        const customerEmail = body.customerEmail?.trim();
        const customerName = body.customerName?.trim();

        if (!Number.isInteger(cardId) || !customerEmail || !customerName) {
            return NextResponse.json({ error: 'Uzupełnij wymagane dane.', success: false }, { status: 400 });
        }

        const template = await prisma.giftCard.findFirst({
            where: {
                id: cardId,
                code: { startsWith: 'TPL-' },
                status: 'available',
                card_template: 'product',
            },
        });

        if (!template) {
            return NextResponse.json({ error: 'Wybrana karta nie jest dostępna.', success: false }, { status: 404 });
        }

        const verifiedValue = template.value || template.amount;
        if (!verifiedValue || verifiedValue < 1) {
            return NextResponse.json({ error: 'Nieprawidłowa wartość karty.', success: false }, { status: 400 });
        }

        const amountInGrosze = Math.round(verifiedValue * 100);
        const accessToken = nanoid(32);
        const order = await prisma.giftCardOrder.create({
            data: {
                card_id: template.id,
                gift_card_id: template.id,
                template_id: template.id,
                customer_email: customerEmail,
                customer_name: customerName,
                recipient_name: body.recipientName?.trim() || undefined,
                recipient_email: body.recipientEmail?.trim() || undefined,
                message: body.message?.trim().slice(0, 300) || undefined,
                sender_name: body.senderName?.trim() || undefined,
                payment_method: 'payu',
                amount_paid: amountInGrosze,
                access_token: accessToken,
            },
        });

        const origin = request.headers.get('origin');
        const baseUrl = origin || process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl';
        const forwarded = request.headers.get('x-forwarded-for');
        const clientIp = forwarded?.split(',')[0]?.trim() || '127.0.0.1';
        const title = template.card_title || 'Karta podarunkowa';

        const orderRequest: OrderRequest = {
            description: `${title} — Właśniewski Fotografia`,
            currencyCode: 'PLN',
            totalAmount: amountInGrosze,
            extOrderId: `GIFT_${order.id}_${Date.now()}`,
            buyer: {
                email: customerEmail,
                firstName: customerName.split(' ')[0],
                lastName: customerName.split(' ').slice(1).join(' ') || 'N/A',
                language: 'pl',
            },
            products: [{
                name: title,
                unitPrice: amountInGrosze,
                quantity: 1,
            }],
            continueUrl: `${baseUrl}/karta-podarunkowa/podziekowanie?orderId=${order.id}&token=${order.access_token}`,
        };

        const payuData = await createPayUOrder(orderRequest, clientIp);
        const checkoutUrl = payuData.redirectUri || payuData.links?.find((link: any) => link.rel === 'redirect_uri')?.href;
        const payuOrderId = payuData.orderId || payuData.orders?.[0]?.orderId;

        if (!checkoutUrl || !payuOrderId) {
            throw new Error('PayU nie zwróciło adresu płatności.');
        }

        await prisma.giftCardOrder.update({
            where: { id: order.id },
            data: {
                payu_order_id: payuOrderId,
                stripe_session_id: payuOrderId,
            },
        });

        return NextResponse.json({
            success: true,
            checkoutUrl,
            sessionId: payuOrderId,
            orderId: order.id,
        });
    } catch (error) {
        console.error('Gift card checkout error:', error);
        return NextResponse.json({ error: 'Nie udało się rozpocząć płatności. Spróbuj ponownie.', success: false }, { status: 500 });
    }
}
