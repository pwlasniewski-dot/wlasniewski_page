import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check auth
        const authError = await requireAuth(request);
        if (authError) return authError;

        const { id } = await params;
        const body = await request.json();
        const {
            code,
            value,
            theme,
            card_title,
            card_description,
            status,
        } = body;

        // Update gift card
        const card = await prisma.giftCard.update({
            where: { id: parseInt(id) },
            data: {
                ...(code && { code }),
                ...(value && { value: parseInt(value), amount: parseInt(value) }),
                ...(theme && { theme }),
                ...(card_title && { card_title }),
                ...(card_description && { card_description }),
                ...(status && { status }),
            },
        });

        return NextResponse.json(card);
    } catch (error: any) {
        console.error('Error updating gift card:', error);
        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Gift card not found' },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to update gift card' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check auth
        const authError = await requireAuth(request);
        if (authError) return authError;

        const { id } = await params;

        // Delete gift card
        await prisma.giftCard.delete({
            where: { id: parseInt(id) },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting gift card:', error);
        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Gift card not found' },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to delete gift card' },
            { status: 500 }
        );
    }
}
