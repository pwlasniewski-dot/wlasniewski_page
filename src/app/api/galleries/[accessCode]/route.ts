// API Route: GET /api/galleries/[accessCode]
// Client access to gallery

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

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
                        thumbnail_url: true,
                        is_standard: true,
                        file_size: true,
                        width: true,
                        height: true,
                        order_index: true,
                        // Don't expose file_url for premium photos yet
                    }
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

        return NextResponse.json({
            success: true,
            gallery: {
                id: gallery.id,
                client_name: gallery.client_name,
                standard_count: gallery.standard_count,
                price_per_premium: gallery.price_per_premium,
                expires_at: gallery.expires_at,
                standard_photos,
                premium_photos,
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
