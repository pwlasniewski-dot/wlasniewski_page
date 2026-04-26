/**
 * API: Publiczny endpoint katalogu albumów nPhoto.
 * Używany przez:
 *  - PageRenderer (moduł NphotoShowcase na stronach)
 *  - Panel klienta (rekomendacje przy ofercie)
 *  - SEO sitemap
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const occasion = searchParams.get('occasion');
        const featured = searchParams.get('featured');
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const ids = searchParams.get('ids')?.split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n));

        const where: any = { is_active: true };
        if (category) where.category = category;
        if (featured === 'true') where.is_featured = true;
        if (occasion) where.occasion = { has: occasion };
        if (ids && ids.length > 0) where.id = { in: ids };

        const albums = await prisma.nphotoAlbum.findMany({
            where,
            orderBy: [
                { is_featured: 'desc' },
                { sort_order: 'asc' },
                { created_at: 'desc' }
            ],
            take: limit,
        });

        return NextResponse.json({ success: true, albums });
    } catch (error: any) {
        console.error('Public albums API error:', error);
        return NextResponse.json({ success: false, albums: [] }, { status: 500 });
    }
}
