import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// Generate unique gift card code
function generateGiftCardCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `GIFT${timestamp}${random}`;
}

// GET: List all gift cards (with optional filtering)
export async function GET(request: NextRequest) {
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

        return NextResponse.json({ success: true, giftCards });
    } catch (error) {
        console.error('[Gift Cards API] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch gift cards' }, { status: 500 });
    }
}

// POST: Create new gift card
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            recipient_name,
            recipient_email,
            amount,
            discount_type = 'percentage',
            card_template = 'gold',
            valid_until,
            message,
            notes
        } = body;

        if (!recipient_name || !recipient_email || !amount) {
            return NextResponse.json(
                { error: 'Missing required fields: recipient_name, recipient_email, amount' },
                { status: 400 }
            );
        }

        // Generate unique code
        const code = generateGiftCardCode();

        const giftCard = await prisma.giftCard.create({
            data: {
                code,
                recipient_name,
                recipient_email,
                amount: parseInt(amount),
                discount_type,
                card_template,
                valid_until: valid_until ? new Date(valid_until) : null,
                message,
                notes
            }
        });

        return NextResponse.json({ success: true, giftCard });
    } catch (error) {
        console.error('[Gift Cards API] POST error:', error);
        return NextResponse.json({ error: 'Failed to create gift card' }, { status: 500 });
    }
}

// PATCH: Update gift card (e.g., mark as used)
export async function PATCH(request: NextRequest) {
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
}

// DELETE: Remove gift card
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

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
}
