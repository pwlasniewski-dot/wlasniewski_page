/**
 * Foto-Match: profil zalogowanego klienta.
 *
 * GET  /api/foto-match/profile/me — zwraca aktualny profil (lub null)
 * POST /api/foto-match/profile     — create or update (idempotent po user_id)
 *
 * Reguły:
 *   - 1 user → 1 profile (unique).
 *   - Status nowo utworzonego profilu = PENDING (wymaga akceptacji admina).
 *   - Edycja po PENDING możliwa zawsze; po ACTIVE — niektóre pola wracają do PENDING
 *     (np. zmiana zdjęć — TODO w fazie 2).
 *   - Klient nigdy nie ustawia: status, is_active, verified_at, verified_by, flagged_count.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { getFotoMatchAuth } from '@/lib/foto-match/auth';
import { isFotoMatchEnabled } from '@/lib/foto-match/settings';
import { sendProfileSubmitted } from '@/lib/foto-match/notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// --- Walidacja ---
const profileSchema = z.object({
    display_name: z.string().trim().min(2).max(60),
    birth_year: z
        .number()
        .int()
        .min(1920)
        .max(new Date().getFullYear() - 18, { message: 'Musisz mieć ukończone 18 lat' }),
    gender: z.enum(['male', 'female', 'other']),
    city: z.string().trim().min(2).max(60),
    radius_km: z.number().int().min(5).max(200).default(30),
    bio: z.string().trim().max(1500).optional().nullable(),
    interests: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
    experience: z.enum(['never_modeled', 'few_times', 'experienced']).optional().nullable(),
    comfort_level: z.enum(['shy', 'neutral', 'open']).optional().nullable(),
    accept_terms: z.boolean().optional(),
    accept_gdpr: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
    const auth = await getFotoMatchAuth(request);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
    }

    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: 'VALIDATION_FAILED', issues: parsed.error.flatten() },
            { status: 400 }
        );
    }

    const data = parsed.data;
    const existing = auth.profile;

    // Nowe profile tylko gdy program globalnie włączony.
    // Edycja istniejących zawsze dostępna (admin mógł wyłączyć po onboardingu).
    if (!existing) {
        const enabled = await isFotoMatchEnabled();
        if (!enabled) {
            return NextResponse.json(
                { error: 'FOTO_MATCH_DISABLED' },
                { status: 403 }
            );
        }
    }

    if (existing) {
        // Recovery po REJECTED: gdy klient ponownie wysyła profil po odrzuceniu,
        // status wraca do PENDING, czyścimy rejection_reason i is_active=false (już jest false).
        // ACTIVE / SUSPENDED zostawiamy bez zmian — klient może edytować dane bez utraty statusu.
        const shouldResetToPending = existing.status === 'REJECTED';

        const updated = await prisma.fotoMatchProfile.update({
            where: { id: existing.id },
            data: {
                display_name: data.display_name,
                birth_year: data.birth_year,
                gender: data.gender,
                city: data.city,
                radius_km: data.radius_km,
                bio: data.bio ?? null,
                interests: data.interests,
                experience: data.experience ?? null,
                comfort_level: data.comfort_level ?? null,
                last_active: new Date(),
                ...(shouldResetToPending
                    ? { status: 'PENDING', rejection_reason: null, is_active: false }
                    : {}),
            },
        });
        return NextResponse.json({
            ok: true,
            profile: updated,
            created: false,
            resubmitted: shouldResetToPending,
        });
    }

    const created = await prisma.fotoMatchProfile.create({
        data: {
            user_id: auth.user.id,
            display_name: data.display_name,
            birth_year: data.birth_year,
            gender: data.gender,
            city: data.city,
            radius_km: data.radius_km,
            bio: data.bio ?? null,
            interests: data.interests,
            experience: data.experience ?? null,
            comfort_level: data.comfort_level ?? null,
            status: 'PENDING',
            is_active: false,
            last_active: new Date(),
        },
    });

    // Zapisz consent (jeśli przekazany przy pierwszym tworzeniu profilu Foto-Match)
    if (data.accept_terms && data.accept_gdpr) {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';
        const ua = (request.headers.get('user-agent') || '').slice(0, 255);
        await prisma.user.update({
            where: { id: auth.user.id },
            data: {
                terms_accepted_at: new Date(),
                gdpr_consent_at: new Date(),
                consent_ip: ip,
                consent_user_agent: ua,
            } as any,
        }).catch(() => null);
    }

    // Best-effort mail powitalny + info o weryfikacji
    void sendProfileSubmitted({ to: auth.user.email, name: auth.user.name });
    return NextResponse.json({ ok: true, profile: created, created: true });
}
