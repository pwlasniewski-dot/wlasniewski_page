import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

// Generate unique gift card code
function generateGiftCardCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `GIFT${timestamp}${random}`;
}

// GET: List all gift cards (with optional filtering)
export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        try {
            const { searchParams } = new URL(request.url);
            const status = searchParams.get('status'); // 'active' | 'used' | 'expired' | 'all'

        const where: any = {};

        if (status === 'used') {
            where.is_used = true;
        } else if (status === 'active') {
            where.is_used = false;
            where.OR = [
                { valid_until: null },
                { valid_until: { gte: new Date() } }
            ];
        } else if (status === 'expired') {
            where.is_used = false;
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
            const body = await request.json();
            const {
                code,
                value,
                theme = 'christmas',
                recipientName,
                recipientEmail,
                senderName,
                message,
                card_title,
                card_description,
                // Legacy support
                recipient_name,
                recipient_email,
                amount,
                discount_type = 'percentage',
                card_template = 'gold',
                valid_until,
                notes
            } = body;

            // Use new fields if provided, fall back to legacy fields
            const finalCode = code;
            const finalValue = value || amount;
            const finalRecipientName = recipientName || recipient_name;
            const finalRecipientEmail = recipientEmail || recipient_email;
            const finalMessage = message;
            const finalSenderName = senderName;
            const finalTheme = theme;
            const finalCardTitle = card_title;
            const finalCardDescription = card_description;

            if (!finalCode || !finalValue || !finalRecipientEmail) {
                return NextResponse.json(
                    { error: 'Missing required fields: code, value, recipientEmail' },
                    { status: 400 }
                );
            }

            const giftCard = await prisma.giftCard.create({
                data: {
                    code: finalCode,
                    recipient_name: finalRecipientName,
                    recipient_email: finalRecipientEmail,
                    amount: parseInt(finalValue),
                    discount_type,
                    card_template,
                    theme: finalTheme,
                    sender_name: finalSenderName,
                    message: finalMessage,
                    valid_until: valid_until ? new Date(valid_until) : null,
                    value: parseInt(finalValue),
                    notes,
                    card_title: finalCardTitle,
                    card_description: finalCardDescription
    return withAuth(request, async () => {
        try {
            const body = await request.json();
            const { id, is_used, notes } = body;

            if (!id) {
                return NextResponse.json({ error: 'Gift card ID is required' }, { status: 400 });
            }

            const updateData: any = {};
        if (typeof is_used === 'boolean') {
            updateData.is_used = is_used;
            if (is_used) {
                updateData.used_at = new Date();
            }
        }
        if (notes !== undefined) {
            updateData.notes = notes;
        }

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
