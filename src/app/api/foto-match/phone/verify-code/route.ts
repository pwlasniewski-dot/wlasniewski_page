/**
 * Foto-Match: weryfikacja kodu OTP wysłanego na numer telefonu.
 *
 * POST /api/foto-match/phone/verify-code
 *   Body: { code: string (6 digits) }
 *
 * Sprawdza hash + ważność (10 min), max 5 prób.
 * Sukces -> phone_verified_at = now, czyści hash/expires/attempts.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db/prisma';
import { getFotoMatchAuth } from '@/lib/foto-match/auth';
import { logSystem } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
    code: z.string().regex(/^\d{6}$/, 'Kod musi mieć 6 cyfr.'),
});

const MAX_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
    const auth = await getFotoMatchAuth(request, { requireProfile: true });
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const profile = auth.profile!;

    let body: any;
    try { body = await request.json(); } catch { return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 }); }
    const parsed = Body.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: 'INVALID_BODY', details: parsed.error.flatten() }, { status: 400 });
    }

    const fresh = await prisma.fotoMatchProfile.findUnique({
        where: { id: profile.id },
        select: {
            id: true,
            phone: true,
            phone_verified_at: true,
            phone_verification_code_hash: true,
            phone_verification_expires_at: true,
            phone_verification_attempts: true,
        } as any,
    }) as any;

    if (!fresh?.phone_verification_code_hash || !fresh?.phone_verification_expires_at) {
        return NextResponse.json({ error: 'NO_PENDING_CODE', message: 'Najpierw wyślij kod.' }, { status: 400 });
    }
    if (new Date(fresh.phone_verification_expires_at).getTime() < Date.now()) {
        return NextResponse.json({ error: 'CODE_EXPIRED', message: 'Kod wygasł, wyślij nowy.' }, { status: 400 });
    }
    if ((fresh.phone_verification_attempts ?? 0) >= MAX_ATTEMPTS) {
        return NextResponse.json({ error: 'TOO_MANY_ATTEMPTS', message: 'Przekroczono limit prób, wyślij nowy kod.' }, { status: 429 });
    }

    const match = await bcrypt.compare(parsed.data.code, fresh.phone_verification_code_hash);
    if (!match) {
        await prisma.fotoMatchProfile.update({
            where: { id: profile.id },
            data: { phone_verification_attempts: { increment: 1 } } as any,
        });
        const left = MAX_ATTEMPTS - ((fresh.phone_verification_attempts ?? 0) + 1);
        return NextResponse.json({ error: 'INVALID_CODE', attempts_left: Math.max(0, left) }, { status: 400 });
    }

    await prisma.fotoMatchProfile.update({
        where: { id: profile.id },
        data: {
            phone_verified_at: new Date(),
            phone_verification_code_hash: null,
            phone_verification_expires_at: null,
            phone_verification_attempts: 0,
        } as any,
    });

    await logSystem('INFO', 'FOTO_MATCH', `Phone verified profile #${profile.id}`, { phone_masked: fresh.phone?.slice(0, 5) + '***' });

    return NextResponse.json({ ok: true, phone: fresh.phone, phone_verified_at: new Date().toISOString() });
}
