import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { canAccessGuideOffer, publicStyleGuideCategoryFilter } from '@/lib/styleGuideAccess';
import {
    POSE_GUIDE_CARDS,
    WARDROBE_CHECKLISTS,
    WARDROBE_FALLBACK_FAQS,
    WARDROBE_FALLBACK_PALETTES,
    WARDROBE_FALLBACK_TIPS,
} from '@/data/preparationGuides';
import type { ClientPreparationGuideData } from '@/types/preparation-guide';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
    offerId: z.coerce.number().int().positive().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const token = extractToken(request.headers.get('authorization'))
            || request.cookies.get('client_token')?.value
            || null;
        const payload = token ? await verifyToken(token) : null;
        if (!payload) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.id },
            select: { id: true, email: true, is_active: true, deleted_at: true },
        });
        if (!user || !user.is_active || user.deleted_at) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const parsed = querySchema.safeParse(
            Object.fromEntries(request.nextUrl.searchParams.entries())
        );
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: 'Nieprawidłowy identyfikator oferty' },
                { status: 400 }
            );
        }

        const offer = parsed.data.offerId
            ? await prisma.offer.findUnique({
                where: { id: parsed.data.offerId },
                select: {
                    id: true,
                    category: true,
                    client_id: true,
                    client_email: true,
                    session_location: true,
                },
            })
            : null;

        if (parsed.data.offerId && !offer) {
            return NextResponse.json({ success: false, error: 'Oferta nie istnieje' }, { status: 404 });
        }
        if (offer && !canAccessGuideOffer(user, offer)) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const [palettes, outfits, wardrobeTips, poseTips, wardrobeFaqs, poseFaqs] = await Promise.all([
            prisma.colorPalette.findMany({
                where: { is_active: true },
                select: {
                    id: true, name: true, slug: true, description: true, season: true,
                    location_type: true, mood: true, colors: true, example_images: true,
                },
                orderBy: { display_order: 'asc' },
                take: 6,
            }),
            prisma.outfitSet.findMany({
                where: {
                    is_active: true,
                    is_featured: true,
                    ...publicStyleGuideCategoryFilter(),
                },
                include: {
                    palette: { select: { id: true, name: true, colors: true } },
                },
                orderBy: { display_order: 'asc' },
                take: 6,
            }),
            prisma.styleGuideTip.findMany({
                where: { is_active: true, ...publicStyleGuideCategoryFilter() },
                select: {
                    id: true, title: true, slug: true, content: true, tip_type: true,
                    category: true, icon: true, is_featured: true,
                },
                orderBy: [{ is_featured: 'desc' }, { display_order: 'asc' }],
                take: 12,
            }),
            prisma.styleGuideTip.findMany({
                where: { is_active: true, category: 'pose' },
                select: {
                    id: true, title: true, slug: true, content: true, tip_type: true,
                    category: true, icon: true, is_featured: true,
                },
                orderBy: { display_order: 'asc' },
            }),
            prisma.styleGuideFaq.findMany({
                where: { is_active: true, ...publicStyleGuideCategoryFilter() },
                select: { id: true, question: true, answer: true, category: true },
                orderBy: { display_order: 'asc' },
            }),
            prisma.styleGuideFaq.findMany({
                where: { is_active: true, category: 'pose' },
                select: { id: true, question: true, answer: true, category: true },
                orderBy: { display_order: 'asc' },
            }),
        ]);

        const wardrobePalettes = palettes.length ? palettes : WARDROBE_FALLBACK_PALETTES;
        const wardrobeTipsResolved = wardrobeTips.length ? wardrobeTips : WARDROBE_FALLBACK_TIPS;
        const wardrobeFaqsResolved = wardrobeFaqs.length ? wardrobeFaqs : WARDROBE_FALLBACK_FAQS;

        const data: ClientPreparationGuideData = {
            context: {
                offerId: offer?.id ?? null,
                serviceType: offer?.category ?? null,
                location: offer?.session_location ?? null,
                personalized: Boolean(offer),
            },
            wardrobe: {
                palettes: wardrobePalettes,
                outfits,
                tips: wardrobeTipsResolved,
                faqs: wardrobeFaqsResolved,
                checklists: WARDROBE_CHECKLISTS,
            },
            poses: { cards: POSE_GUIDE_CARDS, tips: poseTips, faqs: poseFaqs },
            // Temporary compatibility for the offer detail view.
            recommended_palettes: wardrobePalettes,
            recommended_outfits: outfits,
            tips: wardrobeTipsResolved,
        };

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('[Style Guide API] Error fetching client guide:', error);
        return NextResponse.json(
            { success: false, error: 'Nie udało się pobrać poradnika' },
            { status: 500 }
        );
    }
}
