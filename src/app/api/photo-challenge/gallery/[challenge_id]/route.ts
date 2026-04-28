import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyUserToken } from '@/lib/photo-challenge/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ challenge_id: string }> }
) {
    try {
        const { challenge_id } = await params;
        const challengeId = parseInt(challenge_id);

        if (!Number.isFinite(challengeId) || challengeId <= 0) {
            return NextResponse.json(
                { success: false, error: 'Invalid challenge id' },
                { status: 400 }
            );
        }

        // Fetch gallery
        const gallery = await prisma.challengeGallery.findUnique({
            where: { challenge_id: challengeId },
            include: {
                photos: {
                    include: { media: true },
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

        // SECURITY: gallery is only freely accessible when explicitly published AND marked public.
        // Otherwise require a JWT belonging to the inviter (challenge_user) or the invitee.
        const isPublic = gallery.is_published && gallery.show_in_public_gallery;
        if (!isPublic) {
            const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
            const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
            const user = token ? await verifyUserToken(token) : null;

            if (!user) {
                return NextResponse.json(
                    { success: false, error: 'Unauthorized' },
                    { status: 401 }
                );
            }

            const ch = gallery.challenge;
            const isInviter = ch?.inviter_email && user.email && ch.inviter_email.toLowerCase() === user.email.toLowerCase();
            const isInvitee = ch?.invitee_user_id && ch.invitee_user_id === user.id;

            if (!isInviter && !isInvitee) {
                return NextResponse.json(
                    { success: false, error: 'Forbidden' },
                    { status: 403 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            gallery: {
                id: gallery.id,
                title: gallery.title,
                couple_names: gallery.couple_names,
                session_type: gallery.session_type,
                testimonial_text: gallery.testimonial_text,
                is_published: gallery.is_published,
                photos: gallery.photos.map(p => {
                    const photo: any = {
                        id: p.id,
                        image_url: p.media?.file_path || '',
                        caption: p.caption,
                        alt_text: p.media?.alt_text || ''
                    };
                    return photo;
                })
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
