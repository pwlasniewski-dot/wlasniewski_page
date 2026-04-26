/**
 * API: Publiczne rekomendacje albumów dla oferty.
 * Używane w panelu klienta (/konto) gdy klient ogląda swoją ofertę.
 * Klient widzi rekomendowane albumy DOPASOWANE do typu sesji (komunia, ślub, urodziny).
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: offerIdStr } = await params;
        const offerId = parseInt(offerIdStr, 10);
        if (isNaN(offerId)) return NextResponse.json({ error: 'Invalid offer ID' }, { status: 400 });

        // 1. Pobierz konkretne rekomendacje przypięte do oferty
        const explicit = await prisma.offerRecommendedAlbum.findMany({
            where: { offer_id: offerId },
            include: { album: true },
            orderBy: { position: 'asc' }
        });

        const explicitAlbums = explicit
            .filter(r => r.album?.is_active)
            .map(r => ({
                ...r.album,
                _custom_note: r.custom_note,
                _is_highlighted: r.is_highlighted,
                _position: r.position,
            }));

        // 2. Jeśli admin nie przypiął konkretnych albumów - pokaż dopasowane do kategorii oferty
        let suggested: any[] = [];
        if (explicitAlbums.length === 0) {
            const offer = await prisma.offer.findUnique({
                where: { id: offerId },
                select: { category: true, template_data: true }
            });

            const offerCategory = offer?.category || (offer?.template_data as any)?.category;
            const occasionMap: Record<string, string> = {
                'wedding': 'wedding', 'ślub': 'wedding', 'slub': 'wedding',
                'communion': 'communion', 'komunia': 'communion',
                'birthday': 'birthday', 'urodziny': 'birthday',
                'family': 'family', 'rodzinna': 'family',
                'newborn': 'newborn', 'noworodki': 'newborn',
            };
            const matchedOccasion = offerCategory
                ? Object.entries(occasionMap).find(([k]) => offerCategory.toLowerCase().includes(k))?.[1]
                : null;

            const where: any = { is_active: true };
            if (matchedOccasion) where.occasion = { has: matchedOccasion };

            suggested = await prisma.nphotoAlbum.findMany({
                where,
                orderBy: [{ is_featured: 'desc' }, { sort_order: 'asc' }],
                take: 6,
            });
        }

        return NextResponse.json({
            success: true,
            albums: explicitAlbums.length > 0 ? explicitAlbums : suggested,
            source: explicitAlbums.length > 0 ? 'admin_curated' : 'auto_matched'
        });
    } catch (error: any) {
        console.error('Public album recommendations error:', error);
        return NextResponse.json({ success: false, albums: [] }, { status: 500 });
    }
}
