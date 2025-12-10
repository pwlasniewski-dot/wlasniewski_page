// API Route: GET /api/galleries/[accessCode]/download/[photoId]
// Download a standard photo

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ accessCode: string; photoId: string }> }
) {
    try {
        const { accessCode, photoId } = await params;

        // Find gallery
        const gallery = await prisma.clientGallery.findUnique({
            where: { access_code: accessCode },
            select: { id: true, is_active: true, expires_at: true }
        });

        if (!gallery || !gallery.is_active) {
            return NextResponse.json(
                { success: false, error: 'Galeria niedostępna' },
                { status: 403 }
            );
        }

        // Check expiration
        if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
            return NextResponse.json(
                { success: false, error: 'Galeria wygasła' },
                { status: 403 }
            );
        }

        // Find photo
        const photo = await prisma.galleryPhoto.findFirst({
            where: {
                id: Number(photoId),
                gallery_id: gallery.id
            }
        });

        if (!photo) {
            return NextResponse.json(
                { success: false, error: 'Zdjęcie nie znalezione' },
                { status: 404 }
            );
        }

        // Check if photo is standard (free to download)
        if (!photo.is_standard) {
            // Check if photo was purchased
            const orders = await prisma.photoOrder.findMany({
                where: {
                    gallery_id: gallery.id,
                    payment_status: 'paid',
                }
            });

            let isPurchased = false;
            for (const order of orders) {
                const purchasedIds = JSON.parse(order.photo_ids) as number[];
                if (purchasedIds.includes(photo.id)) {
                    isPurchased = true;
                    break;
                }
            }

            if (!isPurchased) {
                return NextResponse.json(
                    { success: false, error: 'To zdjęcie wymaga zakupu' },
                    { status: 403 }
                );
            }
        }

        // Read file
        const filePath = path.join(process.cwd(), 'public', photo.file_url);
        const fileBuffer = await fs.readFile(filePath);

        // Return file
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': 'image/jpeg',
                'Content-Disposition': `attachment; filename="photo-${photo.id}.jpg"`,
                'Content-Length': fileBuffer.length.toString(),
            }
        });
    } catch (error) {
        console.error('Error downloading photo:', error);
        return NextResponse.json(
            { success: false, error: 'Nie udało się pobrać zdjęcia' },
            { status: 500 }
        );
    }
}
