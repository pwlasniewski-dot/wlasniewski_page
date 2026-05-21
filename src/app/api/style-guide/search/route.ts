import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/style-guide/search
 * Full-text search across style guide content
 * Uses optimized PostgreSQL full-text search
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;

        if (!query || query.trim().length < 2) {
            return NextResponse.json({
                success: false,
                error: 'Query must be at least 2 characters'
            }, { status: 400 });
        }

        // Use optimized full-text search function
        const results = await prisma.$queryRaw`
            SELECT * FROM search_style_guide(
                ${query}::TEXT,
                ${limit}::INTEGER
            )
        `;

        return NextResponse.json({
            success: true,
            data: results,
            query: query
        });
    } catch (error: any) {
        console.error('[Style Guide API] Error searching:', error);
        return NextResponse.json(
            { success: false, error: 'Search failed' },
            { status: 500 }
        );
    }
}
