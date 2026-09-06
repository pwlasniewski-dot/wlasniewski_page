import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { generateGiftCardCode } from '@/lib/gift-cards';
import { z } from 'zod';

const optionalEmail = z.union([z.literal(''), z.string().trim().email()]).optional().nullable();
const giftCardInput = z.object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{4,32}$/).optional(),
    value: z.coerce.number().int().min(1).max(1_000_000),
    theme: z.string().trim().min(1).max(40).default('gold'),
    recipientName: z.string().trim().max(120).optional().nullable(),
    recipientEmail: optionalEmail,
    senderName: z.string().trim().max(120).optional().nullable(),
    message: z.string().trim().max(500).optional().nullable(),
    card_title: z.string().trim().max(100).optional().nullable(),
    card_description: z.string().trim().max(180).optional().nullable(),
    valid_until: z.union([z.literal(''), z.string().datetime({ offset: true }), z.string().date()]).optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
    lowest_price_30d: z.coerce.number().int().min(0).max(1_000_000).optional().nullable(),
    showPrice: z.boolean().default(true),
});

// GET: List all gift cards (with optional filtering)
export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        try {
            const { searchParams } = new URL(request.url);
            const status = searchParams.get('status'); // 'active' | 'used' | 'expired' | 'all'

            const where: any = {};

            if (status === 'used') {
                where.OR = [{ redeemed_at: { not: null } }, { status: 'used' }];
            } else if (status === 'active') {
                where.is_active = true;
                where.redeemed_at = null;
                where.OR = [
                    { valid_until: null },
                    { valid_until: { gte: new Date() } }
                ];
            } else if (status === 'expired') {
                where.redeemed_at = null;
                where.valid_until = { lt: new Date() };
            }

            const giftCards = await prisma.giftCard.findMany({
                where,
                orderBy: { created_at: 'desc' }
            });

            return NextResponse.json({ success: true, cards: giftCards });
        } catch (error) {
            console.error('[Gift Cards API] GET error:', error);
            return NextResponse.json({ error: 'Failed to fetch gift cards' }, { status: 500 });
        }
    });
}

// POST: Create new gift card
export async function POST(request: NextRequest) {
    return withAuth(request, async () => {
        try {
            const raw = await request.json();
            const parsed = giftCardInput.safeParse({
                ...raw,
                value: raw.value ?? raw.amount,
                recipientName: raw.recipientName ?? raw.recipient_name,
                recipientEmail: raw.recipientEmail ?? raw.recipient_email,
                senderName: raw.senderName ?? raw.sender_name,
                showPrice: raw.showPrice ?? raw.show_price ?? true,
            });
            if (!parsed.success) {
                return NextResponse.json({ error: 'Nieprawidłowe dane vouchera', details: parsed.error.flatten() }, { status: 400 });
            }
            const data = parsed.data;

            const giftCard = await prisma.giftCard.create({
                data: {
                    code: data.code || generateGiftCardCode(),
                    recipient_name: data.recipientName || null,
                    recipient_email: data.recipientEmail || null,
                    amount: data.value,
                    value: data.value,
                    discount_type: 'amount',
                    card_template: 'premium',
                    theme: data.theme,
                    sender_name: data.senderName || null,
                    message: data.message || null,
                    valid_until: data.valid_until ? new Date(data.valid_until) : null,
                    notes: data.notes || null,
                    card_title: data.card_title || null,
                    card_description: data.card_description || null,
                    lowest_price_30d: data.lowest_price_30d || null,
                    show_price: data.showPrice,
                }
            });

            return NextResponse.json({ success: true, giftCard });
        } catch (error) {
            console.error('[Gift Cards API] POST error:', error);
            return NextResponse.json({ error: 'Failed to create gift card' }, { status: 500 });
        }
    });
}

// PATCH: Update gift card (e.g., mark as used)
export async function PATCH(request: NextRequest) {
    return withAuth(request, async () => {
        try {
            const body = await request.json();
            const { id } = body;

            if (!id) {
                return NextResponse.json({ error: 'Gift card ID is required' }, { status: 400 });
            }

            const parsed = giftCardInput.safeParse({
                ...body,
                recipientName: body.recipientName ?? body.recipient_name,
                recipientEmail: body.recipientEmail ?? body.recipient_email,
                senderName: body.senderName ?? body.sender_name,
                showPrice: body.showPrice ?? body.show_price ?? true,
            });
            if (!parsed.success) {
                return NextResponse.json({ error: 'Nieprawidłowe dane vouchera', details: parsed.error.flatten() }, { status: 400 });
            }
            const data = parsed.data;
            const updateData = {
                code: data.code || undefined,
                value: data.value,
                amount: data.value,
                theme: data.theme,
                recipient_name: data.recipientName || null,
                recipient_email: data.recipientEmail || null,
                sender_name: data.senderName || null,
                message: data.message || null,
                card_title: data.card_title || null,
                card_description: data.card_description || null,
                valid_until: data.valid_until ? new Date(data.valid_until) : null,
                notes: data.notes || null,
                lowest_price_30d: data.lowest_price_30d || null,
                show_price: data.showPrice,
            };

            const giftCard = await prisma.giftCard.update({
                where: { id: parseInt(id) },
                data: updateData
            });

            return NextResponse.json({ success: true, giftCard });
        } catch (error) {
            console.error('[Gift Cards API] PATCH error:', error);
            return NextResponse.json({ error: 'Failed to update gift card' }, { status: 500 });
        }
    });
}

// DELETE: Remove gift card
export async function DELETE(request: NextRequest) {
    return withAuth(request, async () => {
        try {
            const { searchParams } = new URL(request.url);
            let id = searchParams.get('id');

            // If no id in searchParams, try to extract from path
            if (!id) {
                const pathParts = request.nextUrl.pathname.split('/');
                id = pathParts[pathParts.length - 1];
            }

            if (!id) {
                return NextResponse.json({ error: 'Gift card ID is required' }, { status: 400 });
            }

            await prisma.giftCard.delete({
                where: { id: parseInt(id) }
            });

            return NextResponse.json({ success: true, message: 'Gift card deleted' });
        } catch (error) {
            console.error('[Gift Cards API] DELETE error:', error);
            return NextResponse.json({ error: 'Failed to delete gift card' }, { status: 500 });
        }
    });
}
