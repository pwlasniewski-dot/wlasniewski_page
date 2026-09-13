import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { isProductImageUrl, readProductImages } from '@/lib/galleries/product-media';

/** Only edits the gallery's private product; never edits the shared nPhoto source. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; productId: string }> }) {
    return withAuth(request, async () => {
        const { id, productId } = await params;
        const galleryId = id === 'default' ? null : Number(id);
        const itemId = Number(productId);
        if ((galleryId !== null && (!Number.isSafeInteger(galleryId) || galleryId < 1)) || !Number.isSafeInteger(itemId) || itemId < 1) return NextResponse.json({ error: 'Nieprawidłowy identyfikator.' }, { status: 400 });
        try {
            const body = await request.json();
            if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Nieprawidłowe dane.' }, { status: 400 });
            const { title, description, image_url, preview_images, price, is_active } = body;
            if (typeof title !== 'string' || !title.trim() || title.length > 200 || !Number.isSafeInteger(price) || price < (is_active ? 1 : 0) || price > 100000000 || typeof is_active !== 'boolean' || (description != null && (typeof description !== 'string' || description.length > 5000)) || (image_url != null && typeof image_url !== 'string')) return NextResponse.json({ error: 'Sprawdź nazwę, cenę, opis i widoczność produktu.' }, { status: 400 });
            if (image_url && !isProductImageUrl(image_url)) return NextResponse.json({ error: 'Nieprawidłowy adres zdjęcia.' }, { status: 400 });
            if (preview_images !== undefined && (!Array.isArray(preview_images) || preview_images.length > 12 || !preview_images.every(isProductImageUrl))) return NextResponse.json({ error: 'Dodaj maksymalnie 12 poprawnych adresów zdjęć podglądu.' }, { status: 400 });
            const existing = await prisma.galleryProduct.findFirst({ where: { id: itemId, gallery_id: galleryId } });
            if (!existing) return NextResponse.json({ error: 'Produkt nie należy do tej galerii.' }, { status: 404 });
            const product = await prisma.galleryProduct.update({ where: { id: itemId }, data: { title: title.trim(), description: description || null, image_url: image_url || null, ...(preview_images === undefined ? {} : { preview_images: readProductImages(preview_images) }), price, is_active } });
            return NextResponse.json({ success: true, product });
        } catch (error) {
            if (error instanceof SyntaxError) return NextResponse.json({ error: 'Nieprawidłowe dane JSON.' }, { status: 400 });
            console.error('Private gallery product update failed', error);
            return NextResponse.json({ error: 'Nie udało się zapisać produktu.' }, { status: 500 });
        }
    });
}
