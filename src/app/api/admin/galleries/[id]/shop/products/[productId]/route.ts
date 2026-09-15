import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { productEditSnapshot, validateProductEdit } from '@/lib/galleries/product-edit';
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
            if (body?.restore === true) {
                const result = await prisma.galleryProduct.updateMany({ where: { id: itemId, gallery_id: galleryId, archived_at: { not: null } }, data: { archived_at: null, is_active: false } });
                if (!result.count) return NextResponse.json({ error: 'Nie znaleziono produktu w archiwum.' }, { status: 404 });
                return NextResponse.json({ success: true });
            }
            const data = validateProductEdit(body);
            const existing = await prisma.galleryProduct.findFirst({ where: { id: itemId, gallery_id: galleryId } });
            if (!existing || existing.archived_at) return NextResponse.json({ error: 'Produkt nie należy do tej galerii.' }, { status: 404 });
            const product = await prisma.galleryProduct.update({ where: { id: itemId, gallery_id: galleryId, archived_at: null }, data });
            return NextResponse.json({ success: true, product });
        } catch (error) {
            if (error instanceof ShopValidationError) return NextResponse.json({ error: error.message }, { status: error.status });
            if (error instanceof SyntaxError) return NextResponse.json({ error: 'Nieprawidłowe dane JSON.' }, { status: 400 });
            console.error('Private gallery product update failed', error);
            return NextResponse.json({ error: 'Nie udało się zapisać produktu.' }, { status: 500 });
        }
    });
}

/** Archive instead of deleting order-linked product data. */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; productId: string }> }) {
    return withAuth(request, async () => {
        const { id, productId } = await params;
        const galleryId = id === 'default' ? null : Number(id);
        const itemId = Number(productId);
        if ((galleryId !== null && (!Number.isSafeInteger(galleryId) || galleryId < 1)) || !Number.isSafeInteger(itemId) || itemId < 1) return NextResponse.json({ error: 'Nieprawidłowy identyfikator.' }, { status: 400 });
        try {
            const body = await request.json();
            if (!body?.expected || typeof body.expected !== 'object' || Array.isArray(body.expected)) throw new ShopValidationError('Odśwież produkt przed usunięciem.');
            await prisma.$transaction(async tx => {
                const existing = await tx.galleryProduct.findFirst({ where: { id: itemId, gallery_id: galleryId } });
                if (!existing) throw new ShopValidationError('Produkt nie należy do tej galerii.', 404);
                if (existing.archived_at) return;
                if (JSON.stringify(productEditSnapshot(existing)) !== JSON.stringify(productEditSnapshot(body.expected))) throw new ShopValidationError('Produkt został zmieniony w innym oknie. Odśwież ofertę.', 409);
                await tx.galleryProduct.update({ where: { id: itemId, gallery_id: galleryId }, data: { is_active: false, archived_at: new Date() } });
            }, { isolationLevel: 'Serializable' });
            return NextResponse.json({ success: true });
        } catch (error) {
            if (error instanceof ShopValidationError) return NextResponse.json({ error: error.message }, { status: error.status });
            if (error instanceof SyntaxError) return NextResponse.json({ error: 'Nieprawidłowe dane JSON.' }, { status: 400 });
            return NextResponse.json({ error: 'Nie udało się usunąć produktu. Odśwież ofertę i spróbuj ponownie.' }, { status: 409 });
        }
    });
}
