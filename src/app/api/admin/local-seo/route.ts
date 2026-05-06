import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import prisma from '@/lib/db/prisma';

const ALLOWED_KEYS = new Set([
    'google_place_id',
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

        await prisma.setting.upsert({
            where: { setting_key: key },
            update: { setting_value: value },
            create: { setting_key: key, setting_value: value },
        });

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ ok: false, message: String(e) }, { status: 500 });
    }
}
