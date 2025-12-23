import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Check auth
        const authError = await requireAuth(request);
        if (authError) return authError;

        // Fetch all gift cards
        const cards = await prisma.giftCard.findMany({
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                code: true,
                value: true,
                theme: true,
                card_title: true,
                card_description: true,
                status: true,
                created_at: true,
            },
        });

        return NextResponse.json({ cards });
    } catch (error) {
        console.error('Error fetching gift cards:', error);
        return NextResponse.json(
            { error: 'Failed to fetch gift cards' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        // Check auth
        const authError = await requireAuth(request);
        if (authError) return authError;

        const body = await request.json();
        const {
            code,
            value,
            theme,
            card_title,
            card_description,
            status = 'active',
        } = body;

        // Validate
        if (!code || !value || !theme || !card_title || !card_description) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if code already exists
        const existing = await prisma.giftCard.findUnique({
            where: { code },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Code already exists' },
                { status: 400 }
            );
        }

        // Create gift card
        const card = await prisma.giftCard.create({
            data: {
                code,
                value: parseInt(value),
                theme,
                card_title,
                card_description,
                status,
                amount: parseInt(value),
                recipient_name: 'Gift Card',
                recipient_email: 'noreply@wlasniewski.pl',
            },
        });

        return NextResponse.json(card, { status: 201 });
    } catch (error) {
        console.error('Error creating gift card:', error);
        return NextResponse.json(
            { error: 'Failed to create gift card' },
            { status: 500 }
        );
    }
}
