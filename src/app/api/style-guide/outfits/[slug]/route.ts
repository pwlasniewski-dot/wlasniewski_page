import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { isPrivateStyleGuideCategory } from '@/lib/styleGuideAccess';

export const dynamic = 'force-dynamic';

/**
 * GET /api/style-guide/outfits/[slug]
 * Get single outfit set by slug with full details
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        const outfit = await prisma.outfitSet.findUnique({
            where: { slug },
            include: {
                palette: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        colors: true,
                        description: true,
                        season: true,
                        location_type: true
                    }
                }
            }
        });

        if (!outfit || !outfit.is_active || isPrivateStyleGuideCategory(outfit.category)) {
            return NextResponse.json(
                { success: false, error: 'Outfit not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: outfit
        });
    } catch (error: any) {
        console.error('[Style Guide API] Error fetching outfit:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch outfit' },
            { status: 500 }
        );
    }
}
