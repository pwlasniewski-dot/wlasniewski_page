import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { isPrivateStyleGuideCategory, publicStyleGuideCategoryFilter } from '@/lib/styleGuideAccess';

export const dynamic = 'force-dynamic';

/**
 * GET /api/style-guide/faqs
 * Get frequently asked questions
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        if (isPrivateStyleGuideCategory(category)) {
            return NextResponse.json(
                { success: false, error: 'Pose content is available only in the authenticated client guide' },
                { status: 403 }
            );
        }

        const faqs = await prisma.styleGuideFaq.findMany({
            where: {
                is_active: true,
                ...(category ? { category } : publicStyleGuideCategoryFilter())
            },
            select: {
                id: true,
                question: true,
                answer: true,
                category: true
            },
            orderBy: { display_order: 'asc' }
        });

        return NextResponse.json({
            success: true,
            data: faqs
        });
    } catch (error: any) {
        console.error('[Style Guide API] Error fetching FAQs:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch FAQs' },
            { status: 500 }
        );
    }
}
