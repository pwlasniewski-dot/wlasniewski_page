import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

// POST { ids: number[] }  -> persists the order as display_order = index (0-based)
export async function POST(request: NextRequest) {
    return withAuth(request, async () => {
        try {
            const { ids } = await request.json();
            if (!Array.isArray(ids) || ids.some((v) => typeof v !== 'number')) {
                return NextResponse.json({ success: false, error: 'ids must be number[]' }, { status: 400 });
            }
            await prisma.$transaction(
                ids.map((id, index) =>
                    prisma.challengeLocation.update({
                        where: { id: Number(id) },
                        data: { display_order: index },
                    })
                )
            );
            return NextResponse.json({ success: true });
        } catch (e) {
            console.error('reorder locations failed', e);
            return NextResponse.json({ success: false, error: 'reorder failed' }, { status: 500 });
        }
    });
}
