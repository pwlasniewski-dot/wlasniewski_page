/**
 * Foto-Match: publiczny widok profilu (po ID).
 * GET /api/foto-match/profile/[id]
 *
 * Wymaga aktywnego konta Foto-Match (chowamy dane przed niezalogowanymi).
 * Zwraca tylko ACTIVE & is_active profile. Łączy informację `i_liked` / `is_match`.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getFotoMatchAuth } from '@/lib/foto-match/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const auth = await getFotoMatchAuth(request, { requireActive: true });
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json({ error: 'INVALID_ID' }, { status: 400 });
    }

    const profile = await prisma.fotoMatchProfile.findUnique({
        where: { id },
        select: {
            id: true, display_name: true, birth_year: true, gender: true, city: true,
            bio: true, interests: true, experience: true, comfort_level: true,
            verified_at: true, last_active: true, status: true, is_active: true,
            photos: {
                where: { ai_status: { in: ['APPROVED', 'PENDING'] } },
                orderBy: { id: 'asc' },
                select: { id: true, url: true },
            },
        },
    });

    if (!profile || profile.status !== 'ACTIVE' || !profile.is_active) {
        return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    const me = auth.profile!;
    let iLiked = false;
    let theyLiked = false;
    let isMatch = false;

    if (id !== me.id) {
        const [outgoing, incoming] = await Promise.all([
            prisma.fotoMatchSwipe.findUnique({
                where: { from_profile_id_to_profile_id: { from_profile_id: me.id, to_profile_id: id } },
            }),
            prisma.fotoMatchSwipe.findUnique({
                where: { from_profile_id_to_profile_id: { from_profile_id: id, to_profile_id: me.id } },
            }),
        ]);
        iLiked = !!outgoing && (outgoing.action === 'LIKE' || outgoing.action === 'SUPER_LIKE');
        theyLiked = !!incoming && (incoming.action === 'LIKE' || incoming.action === 'SUPER_LIKE');
        isMatch = !!outgoing?.is_match;
    }

    const age = new Date().getFullYear() - profile.birth_year;
    return NextResponse.json({
        ok: true,
        profile: {
            id: profile.id,
            display_name: profile.display_name,
            age,
            gender: profile.gender,
            city: profile.city,
            bio: profile.bio,
            interests: profile.interests,
            experience: profile.experience,
            comfort_level: profile.comfort_level,
            verified: !!profile.verified_at,
            last_active: profile.last_active,
            photos: profile.photos.map(p => ({ id: p.id, url: p.url })),
        },
        relation: {
            is_self: id === me.id,
            i_liked: iLiked,
            they_liked: theyLiked,
            is_match: isMatch,
        },
    });
}
