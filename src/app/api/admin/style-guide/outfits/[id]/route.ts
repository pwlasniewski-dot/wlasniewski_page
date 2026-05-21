import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const { id } = await params;
    try {
        const outfit = await prisma.outfitSet.findUnique({
            where: { id: Number(id) },
            include: { palette: true }
        });
        if (!outfit) {
            return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: outfit });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const { id } = await params;
    try {
        const body = await request.json();
        const data: any = {};
        const allowed = [
            'title', 'description', 'category', 'age_group', 'season',
            'location_type', 'outfit_details', 'dos_and_donts',
            'example_images', 'is_featured', 'is_active'
        ];
        for (const key of allowed) {
            if (key in body) data[key] = body[key];
        }
        if ('group_size' in body) data.group_size = body.group_size ? Number(body.group_size) : null;
        if ('palette_id' in body) data.palette_id = body.palette_id ? Number(body.palette_id) : null;
        if ('display_order' in body) data.display_order = Number(body.display_order) || 0;

        const outfit = await prisma.outfitSet.update({
            where: { id: Number(id) },
            data
        });
        return NextResponse.json({ success: true, data: outfit });
    } catch (error: any) {
        console.error('[Admin Outfits] PUT error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const { id } = await params;
    try {
        await prisma.outfitSet.delete({ where: { id: Number(id) } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
