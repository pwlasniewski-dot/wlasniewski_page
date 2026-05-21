import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/style-guide/outfits
 * Get outfit recommendations with smart filtering
 * Uses optimized PostgreSQL function for scoring
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        
        const groupSize = searchParams.get('groupSize') ? parseInt(searchParams.get('groupSize')!) : null;
        const season = searchParams.get('season') || null;
        const location = searchParams.get('location') || null;
        const category = searchParams.get('category') || null;
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;

        // Use optimized PostgreSQL function
        const outfits = await prisma.$queryRaw`
            SELECT * FROM get_outfit_recommendations(
                ${groupSize}::INTEGER,
                ${season}::VARCHAR,
                ${location}::VARCHAR,
                ${category}::VARCHAR,
                ${limit}::INTEGER
            )
        `;

        return NextResponse.json({
            success: true,
            data: outfits,
            filters: { groupSize, season, location, category }
        });
    } catch (error: any) {
        console.error('[Style Guide API] Error fetching outfits:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch outfit recommendations' },
            { status: 500 }
        );
    }
}
