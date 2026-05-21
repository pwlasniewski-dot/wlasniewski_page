import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

function slugify(s: string) {
    return s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ł/g, 'l')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 100) || `outfit-${Date.now()}`;
}

// GET - lista wszystkich outfitów (publiczne dla admina, ale wymaga tokenu)
export async function GET(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const outfits = await prisma.outfitSet.findMany({
            include: {
                palette: { select: { id: true, name: true, slug: true, colors: true } }
            },
            orderBy: [{ display_order: 'asc' }, { created_at: 'desc' }]
        });

        return NextResponse.json({ success: true, data: outfits });
    } catch (error: any) {
        console.error('[Admin Outfits] GET error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST - utwórz nowy outfit set
export async function POST(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const {
            title,
            slug: customSlug,
            description,
            category,
            group_size,
            age_group,
            season,
            location_type,
            palette_id,
            outfit_details = [],   // [{ image_url, name, color_hex, category, person }]
            dos_and_donts,
            example_images,
            is_featured = false,
            is_active = true,
            display_order = 0
        } = body;

        if (!title) {
            return NextResponse.json({ success: false, error: 'Title required' }, { status: 400 });
        }

        let baseSlug = customSlug || slugify(title);
        let slug = baseSlug;
        let counter = 1;
        while (await prisma.outfitSet.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter++}`;
        }

        const outfit = await prisma.outfitSet.create({
            data: {
                title,
                slug,
                description: description || null,
                category: category || null,
                group_size: group_size ? Number(group_size) : null,
                age_group: age_group || null,
                season: season || null,
                location_type: location_type || null,
                palette_id: palette_id ? Number(palette_id) : null,
                outfit_details,
                dos_and_donts: dos_and_donts || null,
                example_images: example_images || null,
                is_featured,
                is_active,
                display_order: Number(display_order) || 0
            }
        });

        return NextResponse.json({ success: true, data: outfit });
    } catch (error: any) {
        console.error('[Admin Outfits] POST error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
