import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { validateProductEdit } from '@/lib/galleries/product-edit';
import { ShopValidationError } from '@/lib/galleries/merchandise';

/** Only edits the gallery's private product; never edits the shared nPhoto source. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; productId: string }> }) {
    return withAuth(request, async () => {
        const { id, productId } = await params;
        const galleryId = id === 'default' ? null : Number(id);
        const itemId = Number(productId);
        if ((galleryId !== null && (!Number.isSafeInteger(galleryId) || galleryId < 1)) || !Number.isSafeInteger(itemId) || itemId < 1) return NextResponse.json({ error: 'Nieprawidłowy identyfikator.' }, { status: 400 });
        try {
            const body = await request.json();
            const data = validateProductEdit(body);
            const existing = await prisma.galleryProduct.findFirst({ where: { id: itemId, gallery_id: galleryId } });
            if (!existing) return NextResponse.json({ error: 'Produkt nie należy do tej galerii.' }, { status: 404 });
            const product = await prisma.galleryProduct.update({ where: { id: itemId, gallery_id: galleryId }, data });
            return NextResponse.json({ success: true, product });
        } catch (error) {
            if (error instanceof ShopValidationError) return NextResponse.json({ error: error.message }, { status: error.status });
            if (error instanceof SyntaxError) return NextResponse.json({ error: 'Nieprawidłowe dane JSON.' }, { status: 400 });
            console.error('Private gallery product update failed', error);
            return NextResponse.json({ error: 'Nie udało się zapisać produktu.' }, { status: 500 });
        }
    });
}
