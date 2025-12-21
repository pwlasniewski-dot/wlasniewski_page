// API Route: GET /api/galleries/[accessCode]/download/[photoId]
// Download a photo - redirect to S3 URL

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

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
            },
            select: {
                id: true,
                is_standard: true,
                file_url: true,
                s3_url: true
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

        // Read file from S3
        // Photos are stored in S3, redirect to the S3 URL for download
        const downloadUrl = photo.s3_url || photo.file_url;
        
        // Return redirect to S3 with download parameter
        return NextResponse.redirect(downloadUrl, {
            headers: {
                'Content-Disposition': `attachment; filename="photo-${photo.id}.jpg"`,
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
