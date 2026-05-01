/**
 * Admin: zarządzanie 15 cechami matchingu + bonusem referralowym.
 *
 * GET   /api/admin/foto-match/match-settings  → singleton (lub default jeśli brak)
 * PATCH /api/admin/foto-match/match-settings  → update pól
 *
 * Walidacja: opposite_gender_only i same_gender_only są wzajemnie wyłączające.
 * Jeśli klient włączy oba (np. przez API) — zwracamy 400.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth/middleware';
import prisma from '@/lib/db/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
    opposite_gender_only: z.boolean().optional(),
    same_gender_only: z.boolean().optional(),
    same_city: z.boolean().optional(),
    respect_search_radius: z.boolean().optional(),
    age_range: z.boolean().optional(),
    age_range_years: z.number().int().min(1).max(50).optional(),
    min_shared_interests: z.boolean().optional(),
    min_shared_interests_count: z.number().int().min(1).max(20).optional(),
    same_experience_level: z.boolean().optional(),
    complementary_experience: z.boolean().optional(),
    same_comfort_level: z.boolean().optional(),
    verified_only: z.boolean().optional(),
    min_photos: z.boolean().optional(),
    min_photos_count: z.number().int().min(1).max(6).optional(),
    no_flagged_photos: z.boolean().optional(),
    recently_active: z.boolean().optional(),
    recently_active_days: z.number().int().min(1).max(365).optional(),
    exclude_already_seen: z.boolean().optional(),
    exclude_already_matched: z.boolean().optional(),

    referral_bonus_enabled: z.boolean().optional(),
    referral_bonus_amount_grosze: z.number().int().min(0).max(1_000_000).optional(),
    referral_bonus_percent: z.number().int().min(0).max(100).optional(),
    referral_bonus_type: z.enum(['AMOUNT', 'PERCENT', 'BOTH']).optional(),
    referral_bonus_min_to_redeem: z.number().int().min(0).optional(),
    referral_bonus_expires_days: z.number().int().min(0).max(3650).optional(),
});

async function getOrCreateSettings() {
    const existing = await prisma.fotoMatchMatchSettings.findFirst({ orderBy: { id: 'asc' } });
    if (existing) return existing;
    return prisma.fotoMatchMatchSettings.create({ data: {} });
}

export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        const settings = await getOrCreateSettings();
        return NextResponse.json({ settings });
    });
}

export async function PATCH(request: NextRequest) {
    return withAuth(request, async (req) => {
        let body: unknown;
        try { body = await req.json(); } catch {
            return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
        }

        const parsed = PatchSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'VALIDATION_FAILED', issues: parsed.error.flatten() },
                { status: 400 }
            );
        }
        const data = parsed.data;

        // Wzajemne wykluczanie: opposite_gender_only XOR same_gender_only.
        // Pobieramy aktualny stan żeby walidować całość po patchu, nie tylko delty.
        const current = await getOrCreateSettings();
        const nextOpp = data.opposite_gender_only ?? current.opposite_gender_only;
        const nextSame = data.same_gender_only ?? current.same_gender_only;
        if (nextOpp && nextSame) {
            return NextResponse.json(
                { error: 'GENDER_MUTUALLY_EXCLUSIVE', message: 'Włącz albo "tylko przeciwna płeć" albo "tylko ta sama płeć", nie oba.' },
                { status: 400 }
            );
        }

        const adminId = req.user?.id ?? null;
        const updated = await prisma.fotoMatchMatchSettings.update({
            where: { id: current.id },
            data: { ...data, updated_by: adminId },
        });

        return NextResponse.json({ ok: true, settings: updated });
    });
}
