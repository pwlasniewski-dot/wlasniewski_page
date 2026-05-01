/**
 * DELETE /api/foto-match/photos/[id] — usuń zdjęcie własne (S3 + DB).
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getFotoMatchAuth } from '@/lib/foto-match/auth';
import { deleteFromS3 } from '@/lib/storage/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await getFotoMatchAuth(request, { requireProfile: true });
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const profile = auth.profile!;
    const { id } = await params;
    const photoId = parseInt(id, 10);
    if (Number.isNaN(photoId)) {
        return NextResponse.json({ error: 'INVALID_ID' }, { status: 400 });
    }

    const photo = await prisma.fotoMatchPhoto.findUnique({ where: { id: photoId } });
    if (!photo || photo.profile_id !== profile.id) {
        return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    // Best-effort S3 delete — nie wywalamy całego endpointu jeśli S3 odmówi
    try {
        await deleteFromS3(photo.url);
    } catch (err: any) {
        console.warn('[FOTO_MATCH_PHOTO_DELETE] S3 delete failed:', err.message);
    }

    await prisma.fotoMatchPhoto.delete({ where: { id: photoId } });

    return NextResponse.json({ ok: true });
}
