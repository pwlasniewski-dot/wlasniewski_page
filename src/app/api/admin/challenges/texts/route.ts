/**
 * GET /api/admin/challenges/texts → { success, texts: { key: value } }
 * POST /api/admin/challenges/texts { key: value, ... } → upsert do challengeSetting
 *
 * Wszystkie klucze rozpoznawane z TEXT_FIELDS — inne odrzucamy aby nie
 * zaśmiecić ChallengeSetting przypadkowymi wartościami.
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import prisma from '@/lib/db/prisma';
import { TEXT_FIELDS, TEXT_DEFAULTS } from '@/lib/photo-challenge/texts';
import { logSystem } from '@/lib/logger';
import { revalidatePath } from 'next/cache';

const ALLOWED_KEYS = new Set(TEXT_FIELDS.map(f => f.key));

export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        try {
            const rows = await prisma.challengeSetting.findMany({
                where: { setting_key: { in: Array.from(ALLOWED_KEYS) } },
            });
            const stored: Record<string, string> = {};
            for (const r of rows) stored[r.setting_key] = r.setting_value || '';

            // Wypełnij brakujące defaultami (UI dostaje pełną mapę)
            const texts: Record<string, string> = { ...TEXT_DEFAULTS, ...stored };

            return NextResponse.json({ success: true, texts });
        } catch (e: any) {
            await logSystem('ERROR', 'CHALLENGE', 'GET /admin/challenges/texts failed', { error: e?.message });
            return NextResponse.json({ success: false, error: 'Nie udało się pobrać tekstów' }, { status: 500 });
        }
    });
}

export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const body = await req.json() as Record<string, unknown>;
            const updates: { key: string; value: string }[] = [];

            for (const [key, value] of Object.entries(body)) {
                if (!ALLOWED_KEYS.has(key)) continue;
                if (typeof value !== 'string') continue;
                updates.push({ key, value });
            }

            if (updates.length === 0) {
                return NextResponse.json({ success: false, error: 'Brak prawidłowych pól do zapisania' }, { status: 400 });
            }

            for (const u of updates) {
                await prisma.challengeSetting.upsert({
                    where: { setting_key: u.key },
                    update: { setting_value: u.value, setting_type: 'text' },
                    create: { setting_key: u.key, setting_value: u.value, setting_type: 'text' },
                });
            }

            // Bust ISR cache
            revalidatePath('/foto-wyzwanie');

            await logSystem('INFO', 'CHALLENGE', 'Foto Wyzwanie texts updated', { count: updates.length, keys: updates.map(u => u.key) });

            return NextResponse.json({ success: true, updated: updates.length });
        } catch (e: any) {
            await logSystem('ERROR', 'CHALLENGE', 'POST /admin/challenges/texts failed', { error: e?.message });
            return NextResponse.json({ success: false, error: 'Nie udało się zapisać tekstów' }, { status: 500 });
        }
    });
}
