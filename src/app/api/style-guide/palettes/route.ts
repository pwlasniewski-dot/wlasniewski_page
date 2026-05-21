import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

function normalizeForJson<T>(value: T): T {
    return JSON.parse(
        JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? Number(v) : v))
    ) as T;
}

/**
 * GET /api/style-guide/palettes
 * Get color palettes with filtering
 * Uses optimized PostgreSQL function
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        
        const season = searchParams.get('season') || null;
        const location = searchParams.get('location') || null;
        const mood = searchParams.get('mood') || null;
        const activeOnly = searchParams.get('activeOnly') !== 'false';

        let palettes: any[] = [];

        try {
            // Prefer optimized PostgreSQL function when available.
            palettes = await prisma.$queryRaw`
                SELECT * FROM get_color_palettes_filtered(
                    ${season}::VARCHAR,
                    ${location}::VARCHAR,
                    ${mood}::VARCHAR,
                    ${activeOnly}::BOOLEAN
                )
            ` as any[];
        } catch (functionError) {
            console.warn('[Style Guide API] Palette SQL function failed, using fallback:', functionError);

            palettes = await prisma.colorPalette.findMany({
                where: {
                    ...(activeOnly ? { is_active: true } : {}),
                    ...(season ? { OR: [{ season }, { season: 'all' }] } : {}),
                    ...(location ? { location_type: location as any } : {}),
                    ...(mood ? { mood: mood as any } : {}),
                },
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            });
        }

        return NextResponse.json({
            success: true,
            data: normalizeForJson(palettes),
            filters: { season, location, mood }
        });
    } catch (error: any) {
        console.error('[Style Guide API] Error fetching palettes:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch color palettes' },
            { status: 500 }
        );
    }
}
