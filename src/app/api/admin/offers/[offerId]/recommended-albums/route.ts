/**
 * API: Albumy rekomendowane do oferty
 * - GET: lista rekomendowanych albumów (publiczna - klient widzi przy podglądzie oferty)
 * - POST: dodaj rekomendację (admin)
 * - DELETE: usuń rekomendację (admin)
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

// GET: lista rekomendowanych albumów dla oferty
export async function GET(_request: NextRequest, { params }: { params: Promise<{ offerId: string }> }) {
    try {
        const { offerId: offerIdStr } = await params;
        const offerId = parseInt(offerIdStr, 10);
        if (isNaN(offerId)) return NextResponse.json({ error: 'Invalid offer ID' }, { status: 400 });

        const recommendations = await prisma.offerRecommendedAlbum.findMany({
            where: { offer_id: offerId },
            include: { album: true },
            orderBy: { position: 'asc' }
        });

        return NextResponse.json({
            success: true,
            recommendations: recommendations
                .filter(r => r.album?.is_active)
                .map(r => ({
                    id: r.id,
                    position: r.position,
                    custom_note: r.custom_note,
                    is_highlighted: r.is_highlighted,
                    album: r.album
                }))
        });
    } catch (error: any) {
        console.error('Get recommendations error:', error);
        return NextResponse.json({ error: 'Failed to load recommendations' }, { status: 500 });
    }
}

// POST: dodaj album do rekomendacji oferty
export async function POST(request: NextRequest, { params }: { params: Promise<{ offerId: string }> }) {
    return withAuth(request, async (req) => {
        try {
            const { offerId: offerIdStr } = await params;
            const offerId = parseInt(offerIdStr, 10);
            if (isNaN(offerId)) return NextResponse.json({ error: 'Invalid offer ID' }, { status: 400 });

            const body = await req.json();
            const { album_id, custom_note, is_highlighted, position } = body;

            if (!album_id) return NextResponse.json({ error: 'album_id required' }, { status: 400 });

            // Upsert: jeśli już istnieje, aktualizuj
            const recommendation = await prisma.offerRecommendedAlbum.upsert({
                where: { offer_id_album_id: { offer_id: offerId, album_id } },
                update: {
                    custom_note: custom_note || null,
                    is_highlighted: !!is_highlighted,
                    position: position ?? 0
                },
                create: {
                    offer_id: offerId,
                    album_id,
                    custom_note: custom_note || null,
                    is_highlighted: !!is_highlighted,
                    position: position ?? 0
                },
                include: { album: true }
            });

            return NextResponse.json({ success: true, recommendation });
        } catch (error: any) {
            console.error('Add recommendation error:', error);
            return NextResponse.json({ error: 'Failed to add recommendation' }, { status: 500 });
        }
    });
}

// DELETE: usuń rekomendację (przez ?recommendation_id=X albo ?album_id=X)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ offerId: string }> }) {
    return withAuth(request, async () => {
        try {
            const { offerId: offerIdStr } = await params;
            const offerId = parseInt(offerIdStr, 10);
            const { searchParams } = new URL(request.url);
            const recommendationId = searchParams.get('recommendation_id');
            const albumId = searchParams.get('album_id');

            if (recommendationId) {
                await prisma.offerRecommendedAlbum.delete({ where: { id: parseInt(recommendationId, 10) } });
            } else if (albumId) {
                await prisma.offerRecommendedAlbum.delete({
                    where: { offer_id_album_id: { offer_id: offerId, album_id: parseInt(albumId, 10) } }
                });
            } else {
                return NextResponse.json({ error: 'recommendation_id or album_id required' }, { status: 400 });
            }
            return NextResponse.json({ success: true });
        } catch (error: any) {
            return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
        }
    });
}
