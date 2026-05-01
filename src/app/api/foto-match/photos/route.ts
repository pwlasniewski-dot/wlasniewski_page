/**
 * Foto-Match: upload zdjęcia profilowego (multipart).
 *
 * POST /api/foto-match/photos
 *   FormData: file (image/*, max 10 MB)
 *
 * Wymaga: zalogowany user + istniejący FotoMatchProfile.
 * Limit: 6 zdjęć per profil.
 *
 * Pipeline: parse → sharp resize → S3 → AWS Rekognition → zapis w DB.
 *   ai_status = APPROVED → wpadnie do galerii natychmiast po akceptacji profilu
 *   ai_status = FLAGGED  → admin musi ręcznie zaakceptować
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getFotoMatchAuth } from '@/lib/foto-match/auth';
import { processProfilePhoto } from '@/lib/foto-match/upload';

export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_PHOTOS_PER_PROFILE = 6;

export async function POST(request: NextRequest) {
    const auth = await getFotoMatchAuth(request, { requireProfile: true });
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const profile = auth.profile!;

    // Limit liczby
    const count = await prisma.fotoMatchPhoto.count({
        where: { profile_id: profile.id },
    });
    if (count >= MAX_PHOTOS_PER_PROFILE) {
        return NextResponse.json(
            { error: 'PHOTO_LIMIT_REACHED', limit: MAX_PHOTOS_PER_PROFILE },
            { status: 400 }
        );
    }

    // Parse multipart
    let formData: FormData;
    try {
        formData = await request.formData();
    } catch {
        return NextResponse.json({ error: 'INVALID_FORM_DATA' }, { status: 400 });
    }

    const file = formData.get('file');
    if (!(file instanceof File)) {
        return NextResponse.json({ error: 'NO_FILE' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'INVALID_TYPE' }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
            { error: 'FILE_TOO_LARGE', maxBytes: MAX_FILE_BYTES },
            { status: 400 }
        );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let processed;
    try {
        processed = await processProfilePhoto(buffer, {
            profileId: profile.id,
            index: count,
        });
    } catch (err: any) {
        console.error('[FOTO_MATCH_PHOTO_UPLOAD] Failed:', err.message);
        return NextResponse.json(
            { error: 'UPLOAD_FAILED', message: err.message },
            { status: 500 }
        );
    }

    const photo = await prisma.fotoMatchPhoto.create({
        data: {
            profile_id: profile.id,
            url: processed.url,
            position: count, // pierwsze = main (0)
            ai_status: processed.moderation.status === 'APPROVED' ? 'APPROVED' : 'FLAGGED',
            ai_labels: processed.moderation.labels.length
                ? (processed.moderation.labels as any)
                : undefined,
            ai_flagged_for: processed.moderation.flaggedFor || undefined,
        },
    });

    // Aktualizuj flagged_count na profilu (admin filtruje po tym polu).
    if (photo.ai_status === 'FLAGGED') {
        await prisma.fotoMatchProfile.update({
            where: { id: profile.id },
            data: { flagged_count: { increment: 1 } },
        });
    }

    return NextResponse.json({
        ok: true,
        photo,
        moderation: {
            status: processed.moderation.status,
            flaggedFor: processed.moderation.flaggedFor,
        },
    });
}
