import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const cardId = Number(id);

        if (!Number.isInteger(cardId)) {
            return NextResponse.json({ error: 'Nieprawidłowa karta.' }, { status: 400 });
        }

        const card = await prisma.giftCard.findFirst({
            where: {
                id: cardId,
                code: { startsWith: 'TPL-' },
                status: 'available',
                card_template: 'product',
            },
        });

        if (!card) {
            return NextResponse.json({ error: 'Karta nie jest dostępna.' }, { status: 404 });
        }

        const value = card.value || card.amount;
        return NextResponse.json({
            id: card.id,
            code: 'PREVIEW',
            value,
            theme: card.theme || 'gold',
            price: value,
            description: card.card_description || card.notes,
            available: true,
            card_title: card.card_title,
            card_description: card.card_description,
        });
    } catch (error) {
        console.error('[Gift Card API] Error:', error);
        return NextResponse.json({ error: 'Nie udało się pobrać karty.' }, { status: 500 });
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

