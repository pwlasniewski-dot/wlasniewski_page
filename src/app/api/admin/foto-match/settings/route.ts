/**
 * Admin: foto-match global settings.
 * GET   — zwraca aktualny stan { enabled }
 * PATCH — body { enabled: boolean } → update + invalidate cache
 *
 * Wymaga AdminUser (withAuth z @/lib/auth/middleware).
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth/middleware';
import prisma from '@/lib/db/prisma';
import { invalidateFotoMatchEnabledCache } from '@/lib/foto-match/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        const setting = await prisma.setting.findFirst({
            orderBy: { id: 'asc' },
            select: { id: true, foto_match_enabled: true, updated_at: true },
        });
        return NextResponse.json({
            enabled: !!setting?.foto_match_enabled,
            updated_at: setting?.updated_at ?? null,
        });
    });
}

const patchSchema = z.object({ enabled: z.boolean() });

export async function PATCH(request: NextRequest) {
    return withAuth(request, async (req) => {
        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
        }
        const parsed = patchSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: 'VALIDATION_FAILED' }, { status: 400 });
        }

        const setting = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
        if (!setting) {
            return NextResponse.json({ error: 'NO_SETTINGS_ROW' }, { status: 500 });
        }

        const updated = await prisma.setting.update({
            where: { id: setting.id },
            data: { foto_match_enabled: parsed.data.enabled },
            select: { foto_match_enabled: true, updated_at: true },
        });

        invalidateFotoMatchEnabledCache();

        return NextResponse.json({
            ok: true,
            enabled: updated.foto_match_enabled,
            updated_at: updated.updated_at,
        });
    });
}
