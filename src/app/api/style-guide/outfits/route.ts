import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { isPrivateStyleGuideCategory, publicStyleGuideCategoryFilter } from '@/lib/styleGuideAccess';

export const dynamic = 'force-dynamic';

const filtersSchema = z.object({
    groupSize: z.coerce.number().int().positive().max(100).optional(),
    season: z.string().trim().max(50).optional(),
    location: z.string().trim().max(50).optional(),
    category: z.string().trim().max(50).optional(),
    limit: z.coerce.number().int().positive().max(50).default(10),
});

export async function GET(request: NextRequest) {
    try {
        const parsed = filtersSchema.safeParse(
            Object.fromEntries(request.nextUrl.searchParams.entries())
        );
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: 'Invalid filters' }, { status: 400 });
        }
        const { groupSize, season, location, category, limit } = parsed.data;
        if (isPrivateStyleGuideCategory(category)) {
            return NextResponse.json(
                { success: false, error: 'Pose content is available only in the authenticated client guide' },
                { status: 403 }
            );
        }
        const outfits = await prisma.outfitSet.findMany({
            where: {
                is_active: true,
                AND: [
                    publicStyleGuideCategoryFilter(),
                    ...(groupSize ? [{ OR: [{ group_size: null }, { group_size: groupSize }] }] : []),
                    ...(season ? [{ OR: [{ season: null }, { season }] }] : []),
                    ...(location ? [{ OR: [{ location_type: null }, { location_type: location }] }] : []),
                    ...(category ? [{ category }] : []),
                ],
            },
            include: {
                palette: { select: { id: true, name: true, colors: true } },
            },
            orderBy: [{ is_featured: 'desc' }, { display_order: 'asc' }],
            take: limit,
        });

        return NextResponse.json({
            success: true,
            data: outfits,
            filters: { groupSize, season, location, category },
        });
    } catch (error) {
        console.error('[Style Guide API] Error fetching outfits:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch outfit recommendations' },
            { status: 500 }
        );
    }
}
