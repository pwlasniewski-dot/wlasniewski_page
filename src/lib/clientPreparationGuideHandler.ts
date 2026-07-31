import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
    POSE_GUIDE_CARDS,
    WARDROBE_CHECKLISTS,
    WARDROBE_FALLBACK_FAQS,
    WARDROBE_FALLBACK_TIPS,
} from '@/data/preparationGuides';
import { canAccessGuideOffer } from '@/lib/styleGuideAccess';
import { addWardrobeTipImages } from '@/lib/wardrobeTipImages';
import { mergeWardrobePalettes } from '@/lib/wardrobePaletteImages';
import type {
    ClientPreparationGuideData,
    PreparationGuideFaq,
    PreparationGuideOutfit,
    PreparationGuidePalette,
    PreparationGuideTip,
} from '@/types/preparation-guide';

type AuthPayload = { id: number; email: string };

export type PreparationGuideUser = AuthPayload & {
    is_active: boolean;
    deleted_at: Date | null;
};

export type PreparationGuideOffer = {
    id: number;
    category: string | null;
    client_id: number | null;
    client_email: string | null;
    session_location: string | null;
};

export type ClientPreparationGuideDependencies = {
    verifyToken: (token: string) => Promise<AuthPayload | null>;
    findUser: (id: number) => Promise<PreparationGuideUser | null>;
    findOffer: (id: number) => Promise<PreparationGuideOffer | null>;
    findPalettes: () => Promise<PreparationGuidePalette[]>;
    findOutfits: () => Promise<PreparationGuideOutfit[]>;
    findWardrobeTips: () => Promise<PreparationGuideTip[]>;
    findPoseTips: () => Promise<PreparationGuideTip[]>;
    findWardrobeFaqs: () => Promise<PreparationGuideFaq[]>;
    findPoseFaqs: () => Promise<PreparationGuideFaq[]>;
};

const querySchema = z.object({
    offerId: z.coerce.number().int().positive().optional(),
});

function bearerToken(authorization: string | null): string | null {
    if (!authorization?.startsWith('Bearer ')) return null;
    return authorization.slice(7);
}

export function createClientPreparationGuideGetHandler(
    dependencies: ClientPreparationGuideDependencies
) {
    return async function getClientPreparationGuide(request: NextRequest) {
        try {
            const token = bearerToken(request.headers.get('authorization'))
                || request.cookies.get('client_token')?.value
                || null;
            const payload = token ? await dependencies.verifyToken(token) : null;
            if (!payload) {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
            }

            const user = await dependencies.findUser(payload.id);
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
                ? await dependencies.findOffer(parsed.data.offerId)
                : null;

            if (parsed.data.offerId && !offer) {
                return NextResponse.json(
                    { success: false, error: 'Oferta nie istnieje' },
                    { status: 404 }
                );
            }
            if (offer && !canAccessGuideOffer(user, offer)) {
                return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
            }

            const [palettes, outfits, wardrobeTips, poseTips, wardrobeFaqs, poseFaqs] =
                await Promise.all([
                    dependencies.findPalettes(),
                    dependencies.findOutfits(),
                    dependencies.findWardrobeTips(),
                    dependencies.findPoseTips(),
                    dependencies.findWardrobeFaqs(),
                    dependencies.findPoseFaqs(),
                ]);

            const wardrobePalettes = mergeWardrobePalettes(palettes);
            const wardrobeTipsResolved = addWardrobeTipImages(
                wardrobeTips.length ? wardrobeTips : WARDROBE_FALLBACK_TIPS
            );
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
    };
}
