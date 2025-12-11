import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;

        // Find order by access token
        const order = await prisma.giftCardOrder.findUnique({
            where: { access_token: token },
            include: {
                gift_card: {
                    select: {
                        id: true,
                        code: true,
                        value: true,
                        theme: true,
                        card_title: true,
                        card_description: true,
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Karta nie znaleziona' },
                { status: 404 }
            );
        }

        // Check if order is expired
        if (!order.expires_at || new Date() > order.expires_at) {
            return NextResponse.json(
                { error: 'Karta wygasła' },
                { status: 403 }
            );
        }

        // Check if order is paid
        if (order.payment_status !== 'completed') {
            return NextResponse.json(
                { error: 'Zamówienie nie zostało opłacone' },
                { status: 403 }
            );
        }

        // Update accessed_at
        await prisma.giftCardOrder.update({
            where: { id: order.id },
            data: { accessed_at: new Date() },
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error('Error fetching gift card:', error);
        return NextResponse.json(
            { error: 'Błąd pobierania karty' },
            { status: 500 }
        );
    }
}
