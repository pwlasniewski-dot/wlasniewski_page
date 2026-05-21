import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/style-guide/faqs
 * Get frequently asked questions
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        const faqs = await prisma.styleGuideFaq.findMany({
            where: {
                is_active: true,
                ...(category && { category })
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
