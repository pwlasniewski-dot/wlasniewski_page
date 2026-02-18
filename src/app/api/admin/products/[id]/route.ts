import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async () => {
        try {
            const { id } = await params;
            const productId = parseInt(id);

            if (isNaN(productId)) {
                return NextResponse.json({ error: 'Nieprawidłowe ID' }, { status: 400 });
            }

            await prisma.galleryProduct.delete({
                where: { id: productId }
            });

            return NextResponse.json({ success: true });
        } catch (error) {
            console.error('Error deleting product:', error);
            return NextResponse.json({ error: 'Błąd usuwania produktu' }, { status: 500 });
        }
    });
}
