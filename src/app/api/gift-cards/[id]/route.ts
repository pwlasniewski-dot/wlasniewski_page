import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

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
