/**
 * GET  /api/admin/photographers          \u2014 lista wszystkich fotograf\u00f3w (User+Profile)
 * PATCH /api/admin/photographers?id=N    \u2014 update toggles na profilu
 *   body: { is_active?, available_for_bookings?, available_for_foto_match?,
 *           available_for_challenges?, display_name?, slug?, bio? }
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';
import { hashPassword } from '@/lib/auth/jwt';
import { randomBytes } from 'crypto';

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

/**
 * POST /api/admin/photographers — utwórz nowego fotografa (User + PhotographerProfile)
 * body: { email, name, phone?, password?, display_name?, slug?, bio? }
 * Jeśli password nie podane — generuje losowe i zwraca w odpowiedzi.
 */
export async function POST(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const name = String(body.name || '').trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Nieprawidłowy email' }, { status: 400 });
    }
    if (!name) {
        return NextResponse.json({ error: 'Imię i nazwisko wymagane' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        return NextResponse.json({ error: 'Użytkownik z tym emailem już istnieje' }, { status: 409 });
    }

    // Wygeneruj hasło (jeśli nie podane) — admin przekaże je fotografowi.
    const generatedPassword = body.password ? String(body.password) : randomBytes(8).toString('base64url');
    const passwordHash = await hashPassword(generatedPassword);

    // Slug (z display_name lub name)
    const baseSlug = String(body.display_name || name)
        .toLowerCase()
        .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `fotograf-${Date.now()}`;

    // Sprawdź czy slug wolny — jeśli nie, dopisz losowy sufiks
    let slug = baseSlug;
    const slugTaken = await prisma.photographerProfile.findUnique({ where: { slug } });
    if (slugTaken) slug = `${baseSlug}-${randomBytes(2).toString('hex')}`;

    const profile = await prisma.photographerProfile.create({
        data: {
            display_name: body.display_name || name,
            slug,
            bio: body.bio || null,
            is_active: true,
            available_for_bookings: true,
            available_for_foto_match: false,
            available_for_challenges: false,
        },
    });

    const user = await prisma.user.create({
        data: {
            email,
            name,
            phone: body.phone || null,
            password_hash: passwordHash,
            role: 'PHOTOGRAPHER',
            is_active: true,
            photographer_profile_id: profile.id,
        },
        select: { id: true, email: true, name: true, role: true },
    });

    return NextResponse.json({
        ok: true,
        user,
        profile,
        generated_password: body.password ? null : generatedPassword,
        login_url: '/strefa-klienta/login',
    });
}
