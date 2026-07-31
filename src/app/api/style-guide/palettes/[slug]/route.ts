import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { publicStyleGuideCategoryFilter } from '@/lib/styleGuideAccess';

export const dynamic = 'force-dynamic';

/**
 * GET /api/style-guide/palettes/[slug]
 * Get single color palette with outfit examples
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        const palette = await prisma.colorPalette.findUnique({
            where: { slug },
            include: {
                outfit_sets: {
                    where: { is_active: true, ...publicStyleGuideCategoryFilter() },
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        description: true,
                        category: true,
                        group_size: true,
                        example_images: true
                    },
                    orderBy: { display_order: 'asc' },
                    take: 6
                }
            }
        });

        if (!palette || !palette.is_active) {
            return NextResponse.json(
                { success: false, error: 'Palette not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: palette
        });
    } catch (error: any) {
        console.error('[Style Guide API] Error fetching palette:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch palette' },
            { status: 500 }
        );
    }
}
