/**
 * Foto-Match: wysyłka kodu OTP na numer telefonu.
 *
 * POST /api/foto-match/phone/send-code
 *   Body: { phone: string }
 *
 * Generuje 6-cyfrowy kod, hashuje (bcrypt), zapisuje na profilu z TTL 10 min,
 * resetuje attempts=0 i wysyła SMS (mock/Twilio wg env).
 *
 * Rate-limit: 3 wysyłki / 1h per profil + 5 / 1h per IP.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db/prisma';
import { getFotoMatchAuth } from '@/lib/foto-match/auth';
import { normalizePolishPhone, sendSms } from '@/lib/sms/sender';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { logSystem } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
    phone: z.string().min(6).max(30),
});

export async function POST(request: NextRequest) {
    const auth = await getFotoMatchAuth(request, { requireProfile: true });
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const profile = auth.profile!;

    const ip = getClientIp(request);
    const rlIp = rateLimit(`fmphone:ip:${ip}`, 5, 60 * 60 * 1000);
    if (!rlIp.ok) {
        return NextResponse.json({ error: 'RATE_LIMITED', retry_after_ms: rlIp.resetMs }, { status: 429 });
    }
    const rlProfile = rateLimit(`fmphone:profile:${profile.id}`, 3, 60 * 60 * 1000);
    if (!rlProfile.ok) {
        return NextResponse.json({ error: 'RATE_LIMITED', retry_after_ms: rlProfile.resetMs }, { status: 429 });
    }

    let body: any;
    try { body = await request.json(); } catch { return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 }); }
    const parsed = Body.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: 'INVALID_BODY', details: parsed.error.flatten() }, { status: 400 });
    }
    const phoneE164 = normalizePolishPhone(parsed.data.phone);
    if (!phoneE164) {
        return NextResponse.json({ error: 'INVALID_PHONE', message: 'Wymagany polski numer (9 cyfr).' }, { status: 400 });
    }

    // Generuj 6-cyfrowy kod (cryptographically random)
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const hash = await bcrypt.hash(code, 8);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.fotoMatchProfile.update({
        where: { id: profile.id },
        data: {
            phone: phoneE164,
            phone_verification_code_hash: hash,
            phone_verification_expires_at: expiresAt,
            phone_verification_attempts: 0,
            // jeśli zmienia numer po wcześniejszej weryfikacji — reset
            phone_verified_at: null,
        } as any,
    });

    const smsBody = `Kod weryfikacyjny Foto-Match: ${code}. Ważny 10 minut. Nie udostępniaj nikomu.`;
    const smsRes = await sendSms(phoneE164, smsBody);
    if (!smsRes.ok) {
        await logSystem('ERROR', 'FOTO_MATCH', `Phone OTP send failed profile #${profile.id}`, { provider: smsRes.provider, error: smsRes.error });
        return NextResponse.json({ error: 'SMS_FAILED', provider: smsRes.provider }, { status: 502 });
    }

    await logSystem('INFO', 'FOTO_MATCH', `Phone OTP sent profile #${profile.id}`, { provider: smsRes.provider });

    return NextResponse.json({
        ok: true,
        expires_at: expiresAt.toISOString(),
        provider: smsRes.provider,
        // w trybie mock zwracamy kod, żeby dało się testować bez prawdziwego SMS
        ...(smsRes.provider === 'mock' ? { dev_code: code } : {}),
    });
}
