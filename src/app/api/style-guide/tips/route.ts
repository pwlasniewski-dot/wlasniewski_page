import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/style-guide/tips
 * Get styling tips and advice
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        
        const type = searchParams.get('type');
        const category = searchParams.get('category');
        const featuredOnly = searchParams.get('featured') === 'true';
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

        const tips = await prisma.styleGuideTip.findMany({
            where: {
                is_active: true,
                ...(type && { tip_type: type }),
                ...(category && { category }),
                ...(featuredOnly && { is_featured: true })
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
            orderBy: [
                { is_featured: 'desc' },
                { display_order: 'asc' }
            ],
            take: limit
        });

        return NextResponse.json({
            success: true,
            data: tips
        });
    } catch (error: any) {
        console.error('[Style Guide API] Error fetching tips:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch tips' },
            { status: 500 }
        );
    }
}
