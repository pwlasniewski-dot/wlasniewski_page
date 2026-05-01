/**
 * GET /api/foto-match/profile/me — zwraca profil + zdjęcia zalogowanego klienta.
 * Brak profilu = { profile: null }.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getFotoMatchAuth } from '@/lib/foto-match/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const auth = await getFotoMatchAuth(request);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (!auth.profile) {
        return NextResponse.json({ profile: null, photos: [] });
    }

    const photos = await prisma.fotoMatchPhoto.findMany({
        where: { profile_id: auth.profile.id },
        orderBy: [{ position: 'asc' }, { created_at: 'asc' }],
    });

    return NextResponse.json({ profile: auth.profile, photos });
}
