import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Get gift card shop settings
        const shopSettings = await prisma.setting.findFirst({
            where: { setting_key: 'gift_card_shop_enabled' }
        });

        if (!shopSettings?.setting_value || shopSettings.setting_value !== 'true') {
            return NextResponse.json({ message: 'Shop is disabled', cards: [] });
        }

        // Get all gift cards that are not used (available for reference)
        // In production, these would be product templates from admin
        const cards = await prisma.giftCard.findMany({
            where: {
                status: { in: ['active', 'available'] }
            },
            select: {
                id: true,
                code: true,
                value: true,
                amount: true,
                theme: true,
                card_template: true,
                card_title: true,
                card_description: true,
                recipient_name: true,
                message: true
            },
            distinct: ['theme', 'value'],
            orderBy: [
                { theme: 'asc' },
                { value: 'asc' }
            ],
            take: 50
        });

        // Get pricing from settings (will be customizable per theme)
        const pricingSettings = await prisma.setting.findMany({
            where: {
                setting_key: { contains: 'gift_card_price_' }
            }
        });

        const priceMap: Record<string, number> = {};
        pricingSettings.forEach(setting => {
            const themeValue = setting.setting_key.replace('gift_card_price_', '');
            priceMap[themeValue] = parseInt(setting.setting_value || '0');
        });

        const formattedCards = cards.map(card => {
            const themeKey = `${card.theme}_${card.value}`;
            const theme = (card.theme || card.card_template || 'christmas') as string;
            const basePrice = priceMap[theme] || (card.value ? Math.round(card.value * 0.1) : 50); // 10% of value or 50 PLN

            return {
                id: card.id,
                code: card.code,
                value: card.value || card.amount,
                theme: theme,
                price: basePrice,
                description: `Karta podarunkowa o wartości ${card.value || card.amount} zł - ${theme}`,
                available: true,
                card_title: card.card_title,
                card_description: card.card_description
            };
        });

        return NextResponse.json(formattedCards);
    } catch (error: any) {
        console.error('Error fetching gift cards:', error);
        return NextResponse.json(
            { error: 'Failed to fetch gift cards', cards: [] },
            { status: 500 }
        );
    }
}
