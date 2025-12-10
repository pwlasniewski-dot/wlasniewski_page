// API Route: GET /api/effects
// Public endpoint to fetch enabled visual effects for a page

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const pageSlug = searchParams.get('page');
        const sectionName = searchParams.get('section');

        if (!pageSlug) {
            return NextResponse.json(
                { success: false, error: 'Missing page parameter' },
                { status: 400 }
            );
        }

        const where: any = {
            page_slug: pageSlug,
            is_enabled: true,
        };

        if (sectionName) {
            where.section_name = sectionName;
        }

        const effects = await prisma.pageEffect.findMany({
            where,
            orderBy: { order_index: 'asc' }
        });

        return NextResponse.json({
            success: true,
            effects
        });
    } catch (error) {
        console.error('Error fetching effects:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch effects' },
            { status: 500 }
        );
    }
}
