// API Route: GET /api/photo-challenge/gallery/public
// Pobiera publiczne galerie par

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSetting } from '@/lib/photo-challenge/settings';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        // Sprawdź czy galeria publiczna jest włączona
        const galleryEnabled = await getSetting('public_gallery_enabled');

        if (!galleryEnabled) {
            return NextResponse.json({
                success: true,
                galleries: [],
                message: 'Galeria publiczna jest obecnie wyłączona',
            });
        }

        // Pobierz galerie z cover photo
        const galleries = await prisma.challengeGallery.findMany({
            where: {
                is_published: true,
                show_in_public_gallery: true,
            },
            orderBy: {
                published_at: 'desc',
            },
            include: {
                photos: {
                    where: { is_cover: true },
                    include: {
                        media: true,
                    },
                    take: 1,
                },
            },
        });

        // Formatuj dane dla frontendu
        const formattedGalleries = galleries.map(gallery => {
            const coverPhoto = gallery.photos[0]?.media;

            return {
                id: gallery.id,
                title: gallery.title,
                couple_names: gallery.couple_names,
                session_type: gallery.session_type,
                cover_image: coverPhoto ? coverPhoto.file_path : null,
                photo_count: 0, // TODO: Count photos
                slug: `gallery-${gallery.id}`, // Simple slug for now
            };
        });

        return NextResponse.json({
            success: true,
            galleries: formattedGalleries,
        });
    } catch (error) {
        console.error('Error fetching public galleries:', error);
        return NextResponse.json(
            { success: false, error: 'Nie udało się pobrać galerii' },
            { status: 500 }
        );
    }
}
