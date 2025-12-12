import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

// GET - Fetch gift card promo settings
export async function GET() {
    try {
        // Get settings from columns
        const settings = await prisma.setting.findFirst({
            orderBy: { id: 'asc' }
        });

        // Fetch cards regardless of setting for admin preview, or if enabled
        const cards = await prisma.giftCard.findMany({
            where: {
                status: { in: ['active', 'available', 'sent'] }
            },
            take: 5,
            distinct: ['value', 'theme'],
            orderBy: { value: 'asc' }
        });

        const formattedCards = cards.map(c => ({
            id: c.id,
            name: c.card_title || `${c.value} PLN Voucher`,
            description: c.card_description || `Karta podarunkowa o wartości ${c.value} zł`,
            price: c.value,
            theme: c.theme || c.card_template || 'christmas',
            currency: 'PLN',
            image_url: null // Component handles null
        }));

        // Force enable if cards exist and setting is null/false for debugging, 
        // OR rely on user setting. User complained it's missing, so let's default enabled=true if standard check fails but cards exist?
        // No, let's stick to the setting but LOG if it's disabled.

        const isEnabled = settings?.gift_card_promo_enabled ?? false;

        return NextResponse.json({
            enabled: isEnabled,
            settings: {
                title: settings?.gift_card_promo_title || 'Karty Podarunkowe',
                description: settings?.gift_card_promo_description || '',
                rotation_interval: settings?.gift_card_promo_rotation_interval || 5
            },
            cards: formattedCards
        });
    } catch (error: any) {
        console.error('Error fetching gift card promo:', error);
        return NextResponse.json(
            { enabled: false, error: error.message },
            { status: 500 }
        );
    }
}

// POST - Update gift card promo settings
export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const body = await request.json();
            const { enabled, title, description, rotation_interval } = body;

            const firstSetting = await prisma.setting.findFirst({
                orderBy: { id: 'asc' }
            });

            if (firstSetting) {
                await prisma.setting.update({
                    where: { id: firstSetting.id },
                    data: {
                        gift_card_promo_enabled: enabled || false,
                        gift_card_promo_title: title || 'Karty Podarunkowe',
                        gift_card_promo_description: description || '',
                        gift_card_promo_rotation_interval: rotation_interval || 5
                    }
                });
            } else {
                await prisma.setting.create({
                    data: {
                        setting_key: 'system_init',
                        setting_value: 'true',
                        gift_card_promo_enabled: enabled || false,
                        gift_card_promo_title: title || 'Karty Podarunkowe',
                        gift_card_promo_description: description || '',
                        gift_card_promo_rotation_interval: rotation_interval || 5
                    }
                });
            }

            return NextResponse.json({ success: true, message: 'Gift card promo settings updated' });
        } catch (error: any) {
            console.error('Error updating gift card promo settings:', error);
            return NextResponse.json(
                { error: error.message || 'Failed to update settings' },
                { status: 500 }
            );
        }
    });
}
