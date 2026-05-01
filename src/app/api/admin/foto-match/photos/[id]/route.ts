/**
 * Admin: akcje na zdjęciu Foto-Match.
 *
 * PATCH  /api/admin/foto-match/photos/[id]
 *   body: { action: 'approve' | 'reject', notes?: string }
 *
 * DELETE /api/admin/foto-match/photos/[id]  (hard delete + S3)
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth/middleware';
import prisma from '@/lib/db/prisma';
import { deleteFromS3 } from '@/lib/storage/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
    action: z.enum(['approve', 'reject']),
    notes: z.string().max(500).optional(),
});

export async function PATCH(request: NextRequest, ctx: Ctx) {
    return withAuth(request, async (req) => {
        const { id } = await ctx.params;
        const photoId = Number(id);
        if (!Number.isFinite(photoId)) {
            return NextResponse.json({ error: 'INVALID_ID' }, { status: 400 });
        }

        let body: unknown;
        try { body = await req.json(); } catch {
            return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
        }
        const parsed = patchSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: 'VALIDATION_FAILED' }, { status: 400 });
        }

        const adminId = req.user?.id ?? null;
        const before = await prisma.fotoMatchPhoto.findUnique({ where: { id: photoId }, select: { ai_status: true, profile_id: true } });
        if (!before) {
            return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
        }

        const updated = await prisma.fotoMatchPhoto.update({
            where: { id: photoId },
            data: {
                ai_status: parsed.data.action === 'approve' ? 'APPROVED' : 'REJECTED',
                reviewed_by: adminId,
                reviewed_at: new Date(),
                review_notes: parsed.data.notes,
            },
        });

        // Decrement flagged_count gdy zdjęcie wychodzi ze stanu FLAGGED.
        if (before.ai_status === 'FLAGGED' && updated.ai_status !== 'FLAGGED') {
            await prisma.fotoMatchProfile.updateMany({
                where: { id: before.profile_id, flagged_count: { gt: 0 } },
                data: { flagged_count: { decrement: 1 } },
            });
        }

        return NextResponse.json({ ok: true, photo: updated });
    });
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
    return withAuth(request, async () => {
        const { id } = await ctx.params;
        const photoId = Number(id);
        if (!Number.isFinite(photoId)) {
            return NextResponse.json({ error: 'INVALID_ID' }, { status: 400 });
        }

        const photo = await prisma.fotoMatchPhoto.findUnique({ where: { id: photoId } });
        if (!photo) {
            return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
        }

        if (photo.url) {
            try { await deleteFromS3(photo.url); } catch (e) { /* best-effort */ }
        }
        await prisma.fotoMatchPhoto.delete({ where: { id: photoId } });

        // Decrement flagged_count jeśli usuwane zdjęcie było FLAGGED.
        if (photo.ai_status === 'FLAGGED') {
            await prisma.fotoMatchProfile.updateMany({
                where: { id: photo.profile_id, flagged_count: { gt: 0 } },
                data: { flagged_count: { decrement: 1 } },
            });
        }
        return NextResponse.json({ ok: true });
    });
}
