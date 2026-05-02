import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET /api/photographers/public — lista aktywnych fotografów do wyświetlenia w katalogu
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const purpose = searchParams.get('purpose'); // bookings | foto_match | challenges

    const where: Record<string, unknown> = { is_active: true, slug: { not: null } };
    if (purpose === 'bookings') where.available_for_bookings = true;
    if (purpose === 'foto_match') where.available_for_foto_match = true;
    if (purpose === 'challenges') where.available_for_challenges = true;

    const profiles = await prisma.photographerProfile.findMany({
        where,
        include: { user: { select: { id: true, name: true, city: true } } },
        orderBy: { rating: 'desc' },
    });

    const items = profiles.map(p => ({
        id: p.id,
        slug: p.slug,
        display_name: p.display_name || p.user?.name || 'Fotograf',
        city: p.user?.city || null,
        bio: p.bio,
        specialties: p.specialties,
        experience_years: p.experience_years,
        rating: p.rating,
        avatar_url: p.avatar_url,
        available_for_bookings: p.available_for_bookings,
        available_for_foto_match: p.available_for_foto_match,
        available_for_challenges: p.available_for_challenges,
    }));

    return NextResponse.json({ items });
}
