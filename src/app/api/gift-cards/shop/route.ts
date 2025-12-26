import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Get main settings
        const settings = await prisma.setting.findFirst({
            orderBy: { id: 'asc' }
        });

        // Note: We're not blocking on 'gift_card_shop_enabled' anymore as it's not a standard column.
        // If we need a toggle, we should use gift_card_promo_enabled or add a new column.
        // For now, allow access.

        // Get all gift cards that are not used (available for reference)
        // In production, these would be product templates from admin
        const cards = await prisma.giftCard.findMany({
            where: {
                status: { in: ['active', 'available', 'sent'] }
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
                message: true,
                lowest_price_30d: true
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
            const theme = (card.theme || card.card_template || 'christmas') as string;
            const cardValue = card.value || card.amount || 0;

            // Price is now by default the same as value, unless a specific price is set in settings
            const basePrice = priceMap[theme] || cardValue;

            return {
                id: card.id,
                code: 'PREVIEW', // MASKED for security - do not leak real codes
                value: cardValue,
                theme: theme,
                price: basePrice,
                lowest_price_30d: card.lowest_price_30d,
                description: card.card_description || `Karta podarunkowa o wartości ${cardValue} zł`,
                available: true,
                card_title: card.card_title,
                card_description: card.card_description
            };
        });

        return NextResponse.json({
            cards: formattedCards,
            settings: {
                heroImage: (settings as any)?.gift_card_hero_image || null,
                heroOpacity: (settings as any)?.gift_card_hero_opacity || 0.6,
                rotationInterval: (settings as any)?.gift_card_promo_rotation_interval || 5
            }
        });
    } catch (error: any) {
        console.error('Error fetching gift cards:', error);
        return NextResponse.json(
            { error: 'Failed to fetch gift cards', cards: [] },
            { status: 500 }
        );
    }
}
