import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Gift card ID is required' }, { status: 400 });
        }

        const card = await prisma.giftCard.findUnique({
            where: { id: parseInt(id) }
        });

        if (!card) {
            return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });
        }

        // Calculate price based on Global Discount Settings
        const settings = await prisma.setting.findMany({
            where: {
                setting_key: { in: ['gift_card_global_discount_enabled', 'gift_card_global_discount_value', 'gift_card_global_discount_type'] }
            }
        });

        const getSetting = (key: string) => settings.find(s => s.setting_key === key)?.setting_value;

        const discountEnabled = getSetting('gift_card_global_discount_enabled') === 'true';
        const discountValue = parseInt(getSetting('gift_card_global_discount_value') || '0');
        const discountType = getSetting('gift_card_global_discount_type') || 'percentage';

        let basePrice = card.value || 0;

        if (discountEnabled && basePrice > 0) {
            if (discountType === 'percentage') {
                basePrice = Math.round(basePrice * (1 - discountValue / 100));
            } else {
                basePrice = Math.max(0, basePrice - discountValue);
            }
        }

        const response = {
            id: card.id,
            code: card.code,
            value: card.value || card.amount,
            theme: card.theme || card.card_template || 'christmas',
            price: basePrice,
            description: card.card_description || `Karta podarunkowa o wartości ${card.value || card.amount} zł`,
            available: ['active', 'available', 'sent'].includes(card.status),
            card_title: card.card_title,
            card_description: card.card_description
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('[Gift Card API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async () => {
        try {
            const { id } = await params;

            if (!id) {
                return NextResponse.json({ error: 'Gift card ID is required' }, { status: 400 });
            }

            await prisma.giftCard.delete({
                where: { id: parseInt(id) }
            });

            return NextResponse.json({ success: true, message: 'Gift card deleted' });
        } catch (error) {
            console.error('[Gift Cards Delete API] error:', error);
            return NextResponse.json({ error: 'Failed to delete gift card' }, { status: 500 });
        }
    });
}
