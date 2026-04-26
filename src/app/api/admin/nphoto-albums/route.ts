import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { logSystem } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// ─── GET: Lista albumów (publiczna albo admin) ────────────────────────────────
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const occasion = searchParams.get('occasion'); // wedding, communion, birthday...
        const featured = searchParams.get('featured');
        const activeOnly = searchParams.get('all') !== 'true'; // domyślnie tylko aktywne

        const where: any = {};
        if (activeOnly) where.is_active = true;
        if (category) where.category = category;
        if (featured === 'true') where.is_featured = true;
        if (occasion) where.occasion = { has: occasion };

        const albums = await prisma.nphotoAlbum.findMany({
            where,
            orderBy: [
                { is_featured: 'desc' },
                { sort_order: 'asc' },
                { created_at: 'desc' }
            ]
        });

        return NextResponse.json({ success: true, albums });
    } catch (error: any) {
        console.error('Get nPhoto albums error:', error);
        return NextResponse.json({ error: 'Failed to load albums' }, { status: 500 });
    }
}

// ─── POST: Utwórz album (admin only) ──────────────────────────────────────────
export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const body = await req.json();
            const {
                title, slug, subtitle, description,
                category, occasion, price, price_from, currency,
                format, pages_count, cover_type, paper_type,
                cover_image_url, preview_images, sample_pages,
                video_url, video_thumbnail, gallery_3d_url,
                nphoto_product_id, nphoto_shop_url, nphoto_embed_code,
                seo_title, seo_description, seo_keywords,
                is_active, is_featured, sort_order
            } = body;

            if (!title || !slug) {
                return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 });
            }

            const finalSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

            const album = await prisma.nphotoAlbum.create({
                data: {
                    title,
                    slug: finalSlug,
                    subtitle: subtitle || null,
                    description: description || null,
                    category: category || 'album',
                    occasion: Array.isArray(occasion) ? occasion : [],
                    price: price || 0,
                    price_from: price_from || null,
                    currency: currency || 'PLN',
                    format: format || null,
                    pages_count: pages_count || null,
                    cover_type: cover_type || null,
                    paper_type: paper_type || null,
                    cover_image_url: cover_image_url || null,
                    preview_images: preview_images || [],
                    sample_pages: sample_pages || [],
                    video_url: video_url || null,
                    video_thumbnail: video_thumbnail || null,
                    gallery_3d_url: gallery_3d_url || null,
                    nphoto_product_id: nphoto_product_id || null,
                    nphoto_shop_url: nphoto_shop_url || null,
                    nphoto_embed_code: nphoto_embed_code || null,
                    seo_title: seo_title || title,
                    seo_description: seo_description || subtitle || description?.substring(0, 160) || null,
                    seo_keywords: seo_keywords || null,
                    is_active: is_active !== false,
                    is_featured: !!is_featured,
                    sort_order: sort_order || 0,
                    schema_markup: buildJsonLdProduct({ title, description, price, cover_image_url, currency: currency || 'PLN' }),
                }
            });

            await logSystem('INFO', 'SYSTEM', `Created nPhoto album: ${title}`, { albumId: album.id });
            return NextResponse.json({ success: true, album });
        } catch (error: any) {
            console.error('Create album error:', error);
            if (error.code === 'P2002') {
                return NextResponse.json({ error: 'Album with this slug already exists' }, { status: 400 });
            }
            return NextResponse.json({ error: 'Failed to create album' }, { status: 500 });
        }
    });
}

function buildJsonLdProduct(data: { title: string; description?: string; price?: number; cover_image_url?: string; currency: string }) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: data.title,
        description: data.description || data.title,
        image: data.cover_image_url || undefined,
        brand: {
            '@type': 'Brand',
            name: 'Wlasniewski Photography x nPhoto'
        },
        offers: data.price ? {
            '@type': 'Offer',
            price: (data.price / 100).toFixed(2),
            priceCurrency: data.currency,
            availability: 'https://schema.org/InStock',
        } : undefined,
    };
}
