import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { logSystem } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// ─── GET: Pojedynczy album ────────────────────────────────────────────────────
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr, 10);
        if (isNaN(id)) {
            // Spróbuj jako slug
            const bySlug = await prisma.nphotoAlbum.findUnique({ where: { slug: idStr } });
            if (!bySlug) return NextResponse.json({ error: 'Not found' }, { status: 404 });
            return NextResponse.json({ success: true, album: bySlug });
        }
        const album = await prisma.nphotoAlbum.findUnique({ where: { id } });
        if (!album) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ success: true, album });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to load album' }, { status: 500 });
    }
}

// ─── PATCH: Aktualizacja ──────────────────────────────────────────────────────
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req) => {
        try {
            const { id: idStr } = await params;
            const id = parseInt(idStr, 10);
            if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

            const body = await req.json();
            const data: any = {};

            const allowedFields = [
                'title', 'subtitle', 'description', 'category', 'occasion',
                'price', 'price_from', 'currency', 'format', 'pages_count', 'price_per_spread',
                'smaller_format_label', 'smaller_format_discount_pct',
                'cover_type', 'paper_type', 'cover_image_url',
                'preview_images', 'sample_pages', 'video_url', 'video_thumbnail',
                'additional_videos',
                'gallery_3d_url', 'nphoto_product_id', 'nphoto_shop_url', 'nphoto_embed_code',
                'seo_title', 'seo_description', 'seo_keywords',
                'is_active', 'is_featured', 'sort_order'
            ];

            for (const field of allowedFields) {
                if (body[field] !== undefined) data[field] = body[field];
            }

            if (body.slug) {
                data.slug = body.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            }

            const album = await prisma.nphotoAlbum.update({ where: { id }, data });
            await logSystem('INFO', 'SYSTEM', `Updated nPhoto album: ${album.title}`, { albumId: id });
            return NextResponse.json({ success: true, album });
        } catch (error: any) {
            console.error('Update album error:', error);
            return NextResponse.json({ error: error.message || 'Failed to update' }, { status: 500 });
        }
    });
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async () => {
        try {
            const { id: idStr } = await params;
            const id = parseInt(idStr, 10);
            if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

            await prisma.nphotoAlbum.delete({ where: { id } });
            await logSystem('INFO', 'SYSTEM', `Deleted nPhoto album ID=${id}`, { albumId: id });
            return NextResponse.json({ success: true });
        } catch (error: any) {
            return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
        }
    });
}
