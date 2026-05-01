/**
 * Foto-Match: weryfikacja tożsamości (selfie + oświadczenie 18+).
 *
 * POST /api/foto-match/verify
 *   FormData: selfie (image/*), age_declaration (string '1' = oświadczam że mam 18+)
 *
 * RODO data minimization: NIE przechowujemy skanu dowodu osobistego.
 * Selfie wystarcza do weryfikacji że konto = realna osoba (porównanie ze zdjęciami profilu).
 * Pełnoletność weryfikowana przez:
 *   - oświadczenie checkbox (zapisane w age_declared_at + ip),
 *   - AI age estimation na selfie (AWS Rekognition AgeRange.Low >= 18),
 *   - manualną akceptację admina przy zatwierdzeniu profilu.
 *
 * Po uploadzie: profile.selfie_url + age_declared_at, status pozostaje PENDING.
 * Admin akceptuje w panelu → ustawia verified_at + verified_by + status=ACTIVE.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getFotoMatchAuth } from '@/lib/foto-match/auth';
import { processVerificationPhoto } from '@/lib/foto-match/upload';
import { logSystem } from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const MAX_FILE_BYTES = 12 * 1024 * 1024; // 12 MB

export async function POST(request: NextRequest) {
    const auth = await getFotoMatchAuth(request, { requireProfile: true });
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const profile = auth.profile! as any;

    // Wymagamy weryfikacji numeru telefonu (zastępuje skan dowodu — RODO data minimization)
    if (!profile.phone_verified_at) {
        return NextResponse.json({ error: 'PHONE_NOT_VERIFIED', message: 'Najpierw zweryfikuj numer telefonu.' }, { status: 400 });
    }

    let formData: FormData;
    try {
        formData = await request.formData();
    } catch {
        return NextResponse.json({ error: 'INVALID_FORM_DATA' }, { status: 400 });
    }

    const selfie = formData.get('selfie');
    const ageDecl = String(formData.get('age_declaration') || '');
    if (!(selfie instanceof File)) {
        return NextResponse.json({ error: 'MISSING_SELFIE' }, { status: 400 });
    }
    if (ageDecl !== '1' && ageDecl !== 'true') {
        return NextResponse.json({ error: 'AGE_DECLARATION_REQUIRED', message: 'Wymagane oświadczenie pełnoletności (18+).' }, { status: 400 });
    }
    if (!selfie.type.startsWith('image/')) {
        return NextResponse.json({ error: 'INVALID_TYPE', field: 'selfie' }, { status: 400 });
    }
    if (selfie.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: 'FILE_TOO_LARGE', field: 'selfie', maxBytes: MAX_FILE_BYTES }, { status: 400 });
    }

    try {
        const selfieBuf = Buffer.from(await selfie.arrayBuffer());
        const selfieRes = await processVerificationPhoto(selfieBuf, { profileId: profile.id, kind: 'selfie' });

        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';

        const updated = await prisma.fotoMatchProfile.update({
            where: { id: profile.id },
            data: {
                selfie_url: selfieRes.url,
                id_doc_url: null, // celowo NIE zapisujemy skanu dowodu (RODO)
                age_declared_at: new Date(),
                age_declared_ip: ip,
                rejection_reason: null,
            } as any,
        });

        await logSystem('INFO', 'FOTO_MATCH', `VERIFY_SUBMITTED profile #${profile.id}`, { ip, hasSelfie: true });

        return NextResponse.json({ ok: true, profile: updated });
    } catch (err: any) {
        console.error('[FOTO_MATCH_VERIFY] Upload failed:', err.message);
        return NextResponse.json(
            { error: 'UPLOAD_FAILED', message: err.message },
            { status: 500 }
        );
    }
}
