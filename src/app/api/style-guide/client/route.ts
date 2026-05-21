import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

async function getFallbackStyleGuide(offerId: number | null) {
    const offer = offerId
        ? await prisma.offer.findUnique({
            where: { id: offerId },
            select: {
                id: true,
                category: true,
                template_data: true
            }
        })
        : null;

    const [recommendedPalettes, recommendedOutfits, tips] = await Promise.all([
        prisma.colorPalette.findMany({
            where: { is_active: true },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                season: true,
                location_type: true,
                mood: true,
                colors: true,
                example_images: true
            },
            orderBy: { display_order: 'asc' },
            take: 4
        }),
        prisma.outfitSet.findMany({
            where: {
                is_active: true,
                is_featured: true
            },
            include: {
                palette: {
                    select: {
                        id: true,
                        name: true,
                        colors: true
                    }
                }
            },
            orderBy: { display_order: 'asc' },
            take: 4
        }),
        prisma.styleGuideTip.findMany({
            where: {
                is_active: true,
                is_featured: true
            },
            select: {
                id: true,
                title: true,
                slug: true,
                content: true,
                tip_type: true,
                category: true,
                icon: true,
                is_featured: true
            },
            orderBy: { display_order: 'asc' },
            take: 4
        })
    ]);

    return {
        offer_id: offer?.id || offerId,
        service_type: offer?.category || null,
        recommended_palettes: recommendedPalettes,
        recommended_outfits: recommendedOutfits,
        tips,
        source: 'fallback'
    };
}

/**
 * GET /api/style-guide/client
 * Get complete style guide for client portal
 * Ultra-optimized single query using PostgreSQL function
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const offerId = searchParams.get('offerId') ? parseInt(searchParams.get('offerId')!) : null;

        let styleGuide: any = null;

        try {
            // Prefer optimized PostgreSQL function when available
            const result = await prisma.$queryRaw`
                SELECT get_client_style_guide(${offerId}::INTEGER) as data
            `;
            styleGuide = (result as any)[0]?.data;
        } catch (functionError) {
            console.warn('[Style Guide API] SQL function failed, using fallback:', functionError);
        }

        if (!styleGuide || typeof styleGuide !== 'object') {
            styleGuide = await getFallbackStyleGuide(offerId);
        }

        return NextResponse.json({
            success: true,
            data: styleGuide || {}
        });
    } catch (error: any) {
        console.error('[Style Guide API] Error fetching client style guide:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch style guide' },
            { status: 500 }
        );
    }
}
