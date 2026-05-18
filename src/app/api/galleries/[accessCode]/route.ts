// API Route: GET /api/galleries/[accessCode]
// Also handles: DELETE /api/galleries/[id] (numeric ID or access code)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ accessCode: string }> }
) {
    try {
        const { accessCode } = await params;

        // Find gallery by access code
        const gallery = await prisma.clientGallery.findUnique({
            where: { access_code: accessCode },
            include: {
                photos: {
                    orderBy: { order_index: 'asc' },
                    select: {
                        id: true,
                        file_url: true,
                        thumbnail_url: true,
                        is_standard: true,
                        file_size: true,
                        width: true,
                        height: true,
                        order_index: true,
                    }
                },
                products: {
                    where: { is_active: true }
                }
            }
        });

        if (!gallery) {
            return NextResponse.json(
                { success: false, error: 'Galeria nie znaleziona' },
                { status: 404 }
            );
        }

        // Check if gallery is active
        if (!gallery.is_active) {
            return NextResponse.json(
                { success: false, error: 'Galeria jest nieaktywna' },
                { status: 403 }
            );
        }

        // Check if expired
        if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
            return NextResponse.json(
                { success: false, error: 'Galeria wygasła' },
                { status: 403 }
            );
        }

        // Separate standard and premium photos
        const standard_photos = gallery.photos.filter(p => p.is_standard);
        const premium_photos = gallery.photos.filter(p => !p.is_standard);

        // Get paid premium photo IDs
        const paidOrders = await prisma.photoOrder.findMany({
            where: {
                gallery_id: gallery.id,
                payment_status: 'paid'
            },
            select: { photo_ids: true }
        });

        const paidPhotoIds = new Set<number>();
        paidOrders.forEach(order => {
            try {
                const ids = JSON.parse(order.photo_ids) as number[];
                ids.forEach(id => paidPhotoIds.add(id));
            } catch (e) { }
        });

        return NextResponse.json({
            success: true,
            gallery: {
                id: gallery.id,
                client_name: gallery.client_name,
                description: gallery.description,
                standard_count: gallery.standard_count,
                price_per_premium: gallery.price_per_premium,
                expires_at: gallery.expires_at,
                standard_photos,
                premium_photos,
                paid_photo_ids: Array.from(paidPhotoIds),
                products: gallery.products,
            }
        });
    } catch (error) {
        console.error('Error fetching gallery:', error);
        return NextResponse.json(
            { success: false, error: 'Nie udało się pobrać galerii' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ accessCode: string }> }
) {
    return withAuth(request, async () => {
        try {
            const { accessCode } = await params;

            // Support both numeric ID and access code
            const numericId = parseInt(accessCode);
            const where = !isNaN(numericId)
                ? { id: numericId }
                : { access_code: accessCode };

            const gallery = await prisma.clientGallery.findUnique({
                where,
                select: { id: true }
            });

            if (!gallery) {
                return NextResponse.json({ error: 'Galeria nie istnieje' }, { status: 404 });
            }

            await prisma.galleryPhoto.deleteMany({ where: { gallery_id: gallery.id } });
            await prisma.clientGallery.delete({ where: { id: gallery.id } });

            return NextResponse.json({ success: true, message: 'Galeria usunięta' });
        } catch (error) {
            console.error('Error deleting gallery:', error);
            return NextResponse.json({ error: 'Błąd usuwania galerii' }, { status: 500 });
        }
    });
}
