/**
 * GET  /api/admin/photographers          \u2014 lista wszystkich fotograf\u00f3w (User+Profile)
 * PATCH /api/admin/photographers?id=N    \u2014 update toggles na profilu
 *   body: { is_active?, available_for_bookings?, available_for_foto_match?,
 *           available_for_challenges?, display_name?, slug?, bio? }
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const users = await prisma.user.findMany({
        where: { role: { in: ['PHOTOGRAPHER', 'ADMIN'] } },
        select: {
            id: true, email: true, name: true, role: true, is_active: true,
            photographer_profile_id: true,
            photographer_profile: {
                select: {
                    id: true, display_name: true, slug: true, bio: true,
                    is_active: true, available_for_bookings: true,
                    available_for_foto_match: true, available_for_challenges: true,
                    avatar_url: true, specialties: true, experience_years: true,
                    google_calendar_id: true,
                },
            },
            _count: { select: { assigned_bookings: true } },
        },
        orderBy: [{ is_active: 'desc' }, { name: 'asc' }],
    });

    return NextResponse.json({ photographers: users });
}

export async function PATCH(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('id') || '0', 10);
    if (!userId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const body = await request.json().catch(() => ({}));

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, photographer_profile_id: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Stw\u00f3rz profil je\u015bli go nie ma
    let profileId = user.photographer_profile_id;
    if (!profileId) {
        const created = await prisma.photographerProfile.create({
            data: {
                display_name: user.name || 'Fotograf',
            },
        });
        profileId = created.id;
        await prisma.user.update({
            where: { id: userId },
            data: { photographer_profile_id: profileId },
        });
    }

    const updates: any = {};
    const fields = [
        'display_name', 'slug', 'bio',
        'is_active', 'available_for_bookings',
        'available_for_foto_match', 'available_for_challenges',
        'google_calendar_id', 'specialties',
    ];
    for (const f of fields) {
        if (f in body) updates[f] = body[f];
    }

    if (updates.slug) {
        updates.slug = String(updates.slug)
            .toLowerCase()
            .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    const profile = await prisma.photographerProfile.update({
        where: { id: profileId },
        data: updates,
    });

    return NextResponse.json({ ok: true, profile });
}
