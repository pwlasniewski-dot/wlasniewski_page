import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/workshops/[id]/uploads/[uploadId]  body: { feedback?: string, rating?: 1..5 }
 * Prowadzący ocenia zdjęcie uczestnika.
 *
 * DELETE /api/admin/workshops/[id]/uploads/[uploadId]  — admin może skasować nieodpowiednie.
 */
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string; uploadId: string }> }) {
    return withAuth(request, async (req) => {
        const { id, uploadId } = await ctx.params;
        const wid = parseInt(id, 10);
        const uid = parseInt(uploadId, 10);
        if (!wid || !uid) return NextResponse.json({ error: 'Bad id' }, { status: 400 });
        const body = await req.json().catch(() => ({}));
        const data: any = {};
        if (typeof body.feedback === 'string') data.feedback = body.feedback;
        if (body.rating === null) data.rating = null;
        else if (typeof body.rating === 'number' && body.rating >= 1 && body.rating <= 5) data.rating = Math.round(body.rating);
        const upload = await prisma.workshopUpload.updateMany({
            where: { id: uid, workshop_id: wid },
            data,
        });
        if (upload.count === 0) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
        return NextResponse.json({ ok: true });
    });
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string; uploadId: string }> }) {
    return withAuth(request, async () => {
        const { id, uploadId } = await ctx.params;
        const wid = parseInt(id, 10);
        const uid = parseInt(uploadId, 10);
        if (!wid || !uid) return NextResponse.json({ error: 'Bad id' }, { status: 400 });
        const r = await prisma.workshopUpload.deleteMany({ where: { id: uid, workshop_id: wid } });
        if (r.count === 0) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
        return NextResponse.json({ ok: true });
    });
}
