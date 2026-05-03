import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyParticipantToken } from '@/lib/workshops/auth';
import { uploadToS3 } from '@/lib/storage/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getToken(req: NextRequest): string | null {
    const h = req.headers.get('authorization') || '';
    if (h.startsWith('Bearer ')) return h.slice(7);
    return null;
}

/**
 * GET /api/workshops/[slug]/uploads
 * Auth: Bearer <participant token>
 * Zwraca zdjęcia ZALOGOWANEGO uczestnika (tylko własne).
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
    const { slug } = await ctx.params;
    const tk = getToken(request);
    if (!tk) return NextResponse.json({ error: 'Brak tokenu' }, { status: 401 });
    const payload = await verifyParticipantToken(tk);
    if (!payload) return NextResponse.json({ error: 'Token nieważny' }, { status: 401 });

    const ws = await prisma.workshop.findUnique({ where: { slug }, select: { id: true } });
    if (!ws || ws.id !== payload.wid) {
        return NextResponse.json({ error: 'Nie pasuje do warsztatu' }, { status: 403 });
    }

    const uploads = await prisma.workshopUpload.findMany({
        where: { workshop_id: ws.id, participant_id: payload.pid },
        orderBy: { created_at: 'desc' },
        select: {
            id: true, file_url: true, thumb_url: true, caption: true,
            feedback: true, rating: true, created_at: true,
        },
    });
    return NextResponse.json({ uploads });
}

/**
 * POST /api/workshops/[slug]/uploads
 * Auth: Bearer <participant token>
 * multipart/form-data: { file: File, caption?: string }
 * Limit: 10 MB, image/* only, max 50 zdjęć na uczestnika.
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await ctx.params;
        const tk = getToken(request);
        if (!tk) return NextResponse.json({ error: 'Brak tokenu' }, { status: 401 });
        const payload = await verifyParticipantToken(tk);
        if (!payload) return NextResponse.json({ error: 'Token nieważny' }, { status: 401 });

        const ws = await prisma.workshop.findUnique({ where: { slug }, select: { id: true, slug: true } });
        if (!ws || ws.id !== payload.wid) {
            return NextResponse.json({ error: 'Nie pasuje do warsztatu' }, { status: 403 });
        }

        const existing = await prisma.workshopUpload.count({
            where: { workshop_id: ws.id, participant_id: payload.pid },
        });
        if (existing >= 50) {
            return NextResponse.json({ error: 'Limit 50 zdjęć — usuń stare przed dodaniem nowych' }, { status: 429 });
        }

        const fd = await request.formData();
        const file = fd.get('file') as File | null;
        const caption = (fd.get('caption') as string) || null;
        if (!file) return NextResponse.json({ error: 'Brak pliku' }, { status: 400 });
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'Zdjęcie za duże (max 10 MB)' }, { status: 413 });
        }
        if (!/^image\//.test(file.type)) {
            return NextResponse.json({ error: 'Dozwolone tylko obrazy' }, { status: 415 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const safe = file.name.replace(/[^\w.\-]+/g, '_').toLowerCase();
        const key = `workshops/uploads/${ws.slug}/${payload.pid}/${Date.now()}-${safe}`;
        const url = await uploadToS3(buffer, key, file.type);

        const row = await prisma.workshopUpload.create({
            data: {
                workshop_id: ws.id,
                participant_id: payload.pid,
                file_url: url,
                caption,
            },
        });
        return NextResponse.json({ upload: row }, { status: 201 });
    } catch (e: any) {
        console.error('[POST workshops/uploads]', e);
        return NextResponse.json({ error: e.message || 'Internal' }, { status: 500 });
    }
}

/**
 * DELETE /api/workshops/[slug]/uploads?id=123
 * Auth: Bearer <participant token>. Tylko własne zdjęcia.
 */
export async function DELETE(request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
    const { slug } = await ctx.params;
    const tk = getToken(request);
    if (!tk) return NextResponse.json({ error: 'Brak tokenu' }, { status: 401 });
    const payload = await verifyParticipantToken(tk);
    if (!payload) return NextResponse.json({ error: 'Token nieważny' }, { status: 401 });

    const ws = await prisma.workshop.findUnique({ where: { slug }, select: { id: true } });
    if (!ws || ws.id !== payload.wid) {
        return NextResponse.json({ error: 'Nie pasuje do warsztatu' }, { status: 403 });
    }

    const url = new URL(request.url);
    const idStr = url.searchParams.get('id');
    const id = idStr ? parseInt(idStr, 10) : 0;
    if (!id) return NextResponse.json({ error: 'Brak id' }, { status: 400 });

    const u = await prisma.workshopUpload.findFirst({
        where: { id, workshop_id: ws.id, participant_id: payload.pid },
    });
    if (!u) return NextResponse.json({ error: 'Nie znaleziono lub brak praw' }, { status: 404 });

    await prisma.workshopUpload.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}
