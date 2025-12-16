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

        // Fetch Logo URL
        const logoSetting = await prisma.setting.findFirst({
            where: { setting_key: 'logo_url' }
        });

        let logoUrl = '';
        if (logoSetting?.setting_value) {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl';
            logoUrl = logoSetting.setting_value.startsWith('http')
                ? logoSetting.setting_value
                : `${baseUrl}${logoSetting.setting_value}`;
        }

        // Return order combined with logoUrl
        return NextResponse.json({ ...order, logoUrl });
    } catch (error) {
        console.error('Error fetching gift card:', error);
        return NextResponse.json(
            { error: 'Błąd pobierania karty' },
            { status: 500 }
        );
    }
}
