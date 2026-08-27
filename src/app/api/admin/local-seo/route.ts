import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import prisma from '@/lib/db/prisma';
import { normalizeGoogleBusinessProfileUrl, normalizeGoogleReviewUrl } from '@/lib/marketing/gallery-trust';

const ALLOWED_KEYS = new Set([
    'google_place_id',
    'gbp_review_link',
    'gbp_profile_url',
    'gbp_categories',
    'gbp_last_post_at',
    'gbp_checklist',
    'gbp_citations_status',
    'business_phone',
    'business_address',
    'business_name',
]);

export async function POST(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const { key, value } = await request.json();

        if (typeof key !== 'string' || !ALLOWED_KEYS.has(key)) {
            return NextResponse.json({ ok: false, message: 'Invalid setting key' }, { status: 400 });
        }
        if (typeof value !== 'string') {
            return NextResponse.json({ ok: false, message: 'Value must be string' }, { status: 400 });
        }
        if (value.length > 20_000) {
            return NextResponse.json({ ok: false, message: 'Value is too long' }, { status: 400 });
        }

        let normalizedValue = value.trim();
        if (key === 'gbp_review_link' && normalizedValue) {
            const normalized = normalizeGoogleReviewUrl(normalizedValue);
            if (!normalized) {
                return NextResponse.json({ ok: false, message: 'Wklej bezpośredni link „Poproś o opinię” z Google Business Profile.' }, { status: 400 });
            }
            normalizedValue = normalized;
        }
        if (key === 'gbp_profile_url' && normalizedValue) {
            const normalized = normalizeGoogleBusinessProfileUrl(normalizedValue);
            if (!normalized) {
                return NextResponse.json({ ok: false, message: 'Wklej publiczny link do profilu firmy w Mapach Google, nie link do dodawania opinii.' }, { status: 400 });
            }
            normalizedValue = normalized;
        }

        await prisma.setting.upsert({
            where: { setting_key: key },
            update: { setting_value: normalizedValue },
            create: { setting_key: key, setting_value: normalizedValue },
        });

        return NextResponse.json({ ok: true, value: normalizedValue });
    } catch (e) {
        return NextResponse.json({ ok: false, message: String(e) }, { status: 500 });
    }
}
