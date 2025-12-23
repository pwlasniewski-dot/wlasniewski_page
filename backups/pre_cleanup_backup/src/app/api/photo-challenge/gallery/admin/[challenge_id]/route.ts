import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ challenge_id: string }> }
) {
    try {
        const { challenge_id } = await params;
        const challengeId = parseInt(challenge_id);

        const gallery = await prisma.challengeGallery.findFirst({
            where: { challenge_id: challengeId },
            include: {
                photos: {
                    orderBy: { display_order: 'asc' }
                }
            }
        });

        if (!gallery) {
            // Create default gallery
            const newGallery = await prisma.challengeGallery.create({
                data: {
                    challenge_id: challengeId,
                    title: 'Galeria',
                    is_published: false
                },
                include: {
                    photos: true
                }
            });

            return NextResponse.json({
                success: true,
                gallery: {
                    id: newGallery.id,
                    challenge_id: newGallery.challenge_id,
                    title: newGallery.title,
                    couple_names: newGallery.couple_names,
                    testimonial: newGallery.testimonial_text,
                    is_published: newGallery.is_published,
                    photos: []
                }
            });
        }

        return NextResponse.json({
            success: true,
            gallery: {
                id: gallery.id,
                challenge_id: gallery.challenge_id,
                title: gallery.title,
                couple_names: gallery.couple_names,
                testimonial: gallery.testimonial_text,
                is_published: gallery.is_published,
                photos: gallery.photos || []
            }
        });
    } catch (error) {
        console.error('Error fetching gallery:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch gallery' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ challenge_id: string }> }
) {
    try {
        const { challenge_id } = await params;
        const body = await request.json();
        const { title, couple_names, testimonial, is_published } = body;

        const gallery = await prisma.challengeGallery.update({
            where: { challenge_id: parseInt(challenge_id) },
            data: {
                title,
                couple_names,
                testimonial_text: testimonial,
                is_published
            }
        });

        return NextResponse.json({
            success: true,
            gallery
        });
    } catch (error) {
        console.error('Error updating gallery:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update gallery' },
            { status: 500 }
        );
    }
}
