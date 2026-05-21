import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

// Lista palet - do dropdown w outfit editor
export async function GET(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const palettes = await prisma.colorPalette.findMany({
            select: { id: true, name: true, slug: true, colors: true, season: true },
            orderBy: { display_order: 'asc' }
        });
        return NextResponse.json({ success: true, data: palettes });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
