import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email/sender';
import { getFotoMatchBaseUrl, getFotoMatchPathPrefix } from '@/lib/foto-match/base-url';
import { extractClientIpv4 } from '@/lib/payu';

/**
 * POST /api/foto-match/waitlist
 *
 * Zapis na waitlist Foto-Match (MVP: pre-launch).
 *
 * Bezpieczeństwo (zero-loss + anti-spam):
 *  - rate-limit 3/15min/IP, 1/15min/email,
 *  - upsert by email (re-zapis tej samej osoby = 200 idempotent),
 *  - double opt-in: tworzymy confirm_token + wysyłamy mail; konto zliczamy
 *    do statystyk dopiero po confirmed_at,
 *  - body parsing w try (HTML/forminvalid → 400, nigdy crash route'u),
 *  - email/honeypot validation.
 */

// In-memory rate limit (best-effort per process). Do prawdziwego SaaS przeniesc
// na Redis/Upstash, ale dla MVP/preview wystarczy.
const rlIp = new Map<string, number[]>();
const rlEmail = new Map<string, number[]>();
const WINDOW = 15 * 60 * 1000;

function ok(map: Map<string, number[]>, key: string, max: number): boolean {
    const now = Date.now();
    const arr = (map.get(key) || []).filter((t) => now - t < WINDOW);
    if (arr.length >= max) return false;
    arr.push(now);
    map.set(key, arr);
    return true;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: NextRequest) {
    let body: any;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ success: false, error: 'INVALID_BODY' }, { status: 400 });
    }

    const email = String(body?.email || '').trim().toLowerCase();
    const city = body?.city ? String(body.city).trim().slice(0, 80) : null;
    const role = body?.role ? String(body.role).trim().slice(0, 20) : null;
    const ageRange = body?.age_range ? String(body.age_range).trim().slice(0, 20) : null;
    const source = body?.source ? String(body.source).trim().slice(0, 120) : null;
    const marketingOptIn = body?.marketing_opt_in === true;
    const rulesAccepted = body?.rules_accepted === true;
    const honeypot = body?.website; // bots fill this

    if (honeypot) {
        // Cicho odpowiadamy 200 — bot myśli że się udało, nie ma sygnału do
        // dostosowania ataku. Brak DB write.
        return NextResponse.json({ success: true, status: 'queued' });
    }

    if (!email || !EMAIL_RE.test(email)) {
        return NextResponse.json({ success: false, error: 'INVALID_EMAIL' }, { status: 400 });
    }
    if (!rulesAccepted) {
        return NextResponse.json(
            { success: false, error: 'RULES_NOT_ACCEPTED', message: 'Akceptacja regulaminu jest wymagana.' },
            { status: 400 },
        );
    }

    // Rate limit
    const rawForwarded = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
    const ip = extractClientIpv4(rawForwarded) || 'unknown';
    if (!ok(rlIp, ip, 3)) {
        return NextResponse.json(
            { success: false, error: 'RATE_LIMITED', message: 'Zbyt wiele zapisów z tego adresu IP. Spróbuj za 15 minut.' },
            { status: 429 },
        );
    }
    if (!ok(rlEmail, email, 1)) {
        return NextResponse.json(
            { success: false, error: 'RATE_LIMITED', message: 'Ten email był już dziś zapisany. Sprawdź skrzynkę.' },
            { status: 429 },
        );
    }

    const userAgent = request.headers.get('user-agent') || null;
    const confirmToken = crypto.randomBytes(24).toString('hex');
    const confirmExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    let recordId: number;
    let isNew = true;

    try {
        // Upsert — re-zapis tej samej osoby tylko odświeża confirm_token,
        // nigdy nie nadpisuje confirmed_at.
        const existing = await prisma.fotoMatchWaitlist.findUnique({ where: { email } });
        if (existing) {
            isNew = false;
            // Jeśli już potwierdzony — nie wysyłamy maila ponownie.
            if (existing.confirmed_at) {
                return NextResponse.json({ success: true, status: 'already_confirmed' });
            }
            const updated = await prisma.fotoMatchWaitlist.update({
                where: { email },
                data: {
                    city: city ?? existing.city,
                    role: role ?? existing.role,
                    age_range: ageRange ?? existing.age_range,
                    source: source ?? existing.source,
                    marketing_opt_in: marketingOptIn,
                    rules_accepted_at: new Date(),
                    ip_address: ip,
                    user_agent: userAgent,
                    confirm_token: confirmToken,
                    confirm_token_expires: confirmExpires,
                },
            });
            recordId = updated.id;
        } else {
            const created = await prisma.fotoMatchWaitlist.create({
                data: {
                    email,
                    city,
                    role,
                    age_range: ageRange,
                    source,
                    marketing_opt_in: marketingOptIn,
                    rules_accepted_at: new Date(),
                    ip_address: ip,
                    user_agent: userAgent,
                    confirm_token: confirmToken,
                    confirm_token_expires: confirmExpires,
                },
            });
            recordId = created.id;
        }
    } catch (e: any) {
        console.error('[foto-match/waitlist] DB error:', e?.message || e);
        return NextResponse.json({ success: false, error: 'DB_ERROR' }, { status: 500 });
    }

    // Double opt-in email — best effort (nie blokuje sukcesu zapisu).
    try {
        const baseUrl = getFotoMatchBaseUrl();
        const prefix = getFotoMatchPathPrefix();
        const confirmLink = `${baseUrl}${prefix}/zapis-potwierdzony?t=${encodeURIComponent(confirmToken)}`;
        await sendEmail({
            to: email,
            subject: '🎯 Potwierdź zapis na Foto-Match',
            text: [
                'Cześć,',
                '',
                'Dzięki za zainteresowanie Foto-Match — projektem łączącym ludzi przez wspólne sesje fotograficzne.',
                '',
                'Aby potwierdzić zapis (i dostać dostęp jako jedna z pierwszych osób), kliknij w link:',
                confirmLink,
                '',
                'Link wygasa za 24h. Jeśli to nie Ty — zignoruj wiadomość, nic się nie stanie.',
                '',
                '— Przemek Wlasniewski',
            ].join('\n'),
        });
    } catch (e) {
        console.error('[foto-match/waitlist] confirm email failed:', e);
        // Nie zawracamy zapisu — admin widzi w bazie i może wysłać ręcznie.
    }

    return NextResponse.json({
        success: true,
        status: isNew ? 'pending_confirmation' : 'updated_pending_confirmation',
        record_id: recordId,
    });
}
