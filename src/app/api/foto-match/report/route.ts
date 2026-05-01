/**
 * POST /api/foto-match/report
 * Body: { reported_profile_id: number, category: string, description?: string }
 * Wymaga: ACTIVE profil. Zapisuje zgłoszenie do moderacji.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { getFotoMatchAuth } from '@/lib/foto-match/auth';
import { logSystem } from '@/lib/logger';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
    reported_profile_id: z.number().int().positive(),
    category: z.enum(['FAKE', 'INAPPROPRIATE', 'HARASSMENT', 'SPAM', 'OTHER']),
    description: z.string().trim().max(2000).optional(),
});

export async function POST(request: NextRequest) {
    const auth = await getFotoMatchAuth(request, { requireProfile: true, requireActive: true });
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const me = auth.profile!;

    const ip = getClientIp(request);
    const limit = rateLimit(`report:${me.id}`, 5, 60 * 60_000);
    if (!limit.ok) return NextResponse.json({ error: 'RATE_LIMITED', message: 'Za dużo zgłoszeń. Spróbuj za godzinę.' }, { status: 429 });

    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 }); }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_FAILED', issues: parsed.error.flatten() }, { status: 400 });

    const { reported_profile_id, category, description } = parsed.data;
    if (reported_profile_id === me.id) {
        return NextResponse.json({ error: 'CANNOT_REPORT_SELF' }, { status: 400 });
    }

    const target = await prisma.fotoMatchProfile.findUnique({ where: { id: reported_profile_id } });
    if (!target) return NextResponse.json({ error: 'TARGET_NOT_FOUND' }, { status: 404 });

    const report = await prisma.fotoMatchReport.create({
        data: {
            reporter_id: me.id,
            reported_id: reported_profile_id,
            category,
            description: description || null,
        },
    });

    // Auto-suspend po 3 zgłoszeniach z różnych źródeł
    const reportCount = await prisma.fotoMatchReport.count({
        where: { reported_id: reported_profile_id, status: 'PENDING' },
    });
    if (reportCount >= 3) {
        await prisma.fotoMatchProfile.update({
            where: { id: reported_profile_id },
            data: { is_active: false, status: 'SUSPENDED' },
        });
        await logSystem('WARN', 'FOTO_MATCH', `AUTO_SUSPENDED profile ${reported_profile_id} after ${reportCount} reports`, { ip });
    }

    await logSystem('INFO', 'FOTO_MATCH', 'REPORT_CREATED', {
        reportId: report.id, reporterId: me.id, reportedId: reported_profile_id, category, ip,
    });

    return NextResponse.json({ ok: true, report_id: report.id });
}
