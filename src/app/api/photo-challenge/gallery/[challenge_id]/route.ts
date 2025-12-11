import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: { challenge_id: string } }
) {
    try {
        const challengeId = parseInt(params.challenge_id);

        // Fetch gallery
        const gallery = await prisma.challengeGallery.findUnique({
            where: { challenge_id: challengeId },
            include: {
                photos: {
                    orderBy: { created_at: 'asc' }
                },
                challenge: true
            }
        });

        if (!gallery) {
            return NextResponse.json(
                { success: false, error: 'Gallery not found' },
                { status: 404 }
            );
        }

        // For now, allow public access. In production, verify token/email
        // TODO: Add authentication check

        return NextResponse.json({
            success: true,
            gallery: {
                id: gallery.id,
                title: gallery.title,
                couple_names: gallery.couple_names,
                session_type: gallery.session_type,
                testimonial_text: gallery.testimonial_text,
                is_published: gallery.is_published,
                photos: gallery.photos.map(p => ({
                    id: p.id,
                    image_url: p.image_url,
                    caption: p.caption,
                    alt_text: p.alt_text
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching gallery:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
