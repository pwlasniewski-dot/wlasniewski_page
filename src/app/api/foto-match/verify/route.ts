/**
 * Foto-Match: weryfikacja tożsamości (selfie + dowód).
 *
 * POST /api/foto-match/verify
 *   FormData: selfie (image/*), id_doc (image/*)
 *
 * Wymaga: profil istnieje (PENDING/ACTIVE).
 * Po uploadzie: profile.selfie_url + profile.id_doc_url, status pozostaje PENDING.
 * Admin akceptuje w panelu → ustawia verified_at + verified_by + status=ACTIVE.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getFotoMatchAuth } from '@/lib/foto-match/auth';
import { processVerificationPhoto } from '@/lib/foto-match/upload';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const MAX_FILE_BYTES = 12 * 1024 * 1024; // 12 MB

export async function POST(request: NextRequest) {
    const auth = await getFotoMatchAuth(request, { requireProfile: true });
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const profile = auth.profile!;

    let formData: FormData;
    try {
        formData = await request.formData();
    } catch {
        return NextResponse.json({ error: 'INVALID_FORM_DATA' }, { status: 400 });
    }

    const selfie = formData.get('selfie');
    const idDoc = formData.get('id_doc');
    if (!(selfie instanceof File) || !(idDoc instanceof File)) {
        return NextResponse.json({ error: 'MISSING_FILES' }, { status: 400 });
    }
    for (const [name, f] of [['selfie', selfie], ['id_doc', idDoc]] as const) {
        if (!f.type.startsWith('image/')) {
            return NextResponse.json({ error: 'INVALID_TYPE', field: name }, { status: 400 });
        }
        if (f.size > MAX_FILE_BYTES) {
            return NextResponse.json(
                { error: 'FILE_TOO_LARGE', field: name, maxBytes: MAX_FILE_BYTES },
                { status: 400 }
            );
        }
    }

    try {
        const selfieBuf = Buffer.from(await selfie.arrayBuffer());
        const idDocBuf = Buffer.from(await idDoc.arrayBuffer());

        const [selfieRes, idDocRes] = await Promise.all([
            processVerificationPhoto(selfieBuf, { profileId: profile.id, kind: 'selfie' }),
            processVerificationPhoto(idDocBuf, { profileId: profile.id, kind: 'id_doc' }),
        ]);

        const updated = await prisma.fotoMatchProfile.update({
            where: { id: profile.id },
            data: {
                selfie_url: selfieRes.url,
                id_doc_url: idDocRes.url,
                // resetujemy potencjalne wcześniejsze odrzucenie
                rejection_reason: null,
            },
        });

        return NextResponse.json({ ok: true, profile: updated });
    } catch (err: any) {
        console.error('[FOTO_MATCH_VERIFY] Upload failed:', err.message);
        return NextResponse.json(
            { error: 'UPLOAD_FAILED', message: err.message },
            { status: 500 }
        );
    }
}
