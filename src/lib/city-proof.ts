import prisma from '@/lib/db/prisma';

export interface CityProof {
    sessionsCount: number;          // ile zrealizowanych sesji w mieście (REALNE)
    lastSessionDaysAgo: number | null; // ile dni temu była ostatnia sesja (REALNE)
    upcomingFreeWeekends: number | null; // wolne weekendy w nadchodzących 8 (REALNE)
    nextBookedDate: string | null;  // data najbliższego zajętego terminu
    testimonials: Array<{ name: string; text: string; rating: number | null; source: string | null }>;
    googleReviewsUrl: string;
    averageRating: number | null;   // średnia z testimoniali w bazie (REALNE)
    reviewsTotal: number;           // łączna liczba opinii w bazie (REALNE)
}

/**
 * Zbiera prawdziwe dane społecznego dowodu (social proof) dla strony miasta.
 * Wszystko bazuje na faktach z bazy — bez wymyślania liczb.
 */
export async function getCityProof(cityName: string): Promise<CityProof> {
    const cityLower = cityName.toLowerCase();
    const cityVariants = [cityName, cityLower, cityLower.replace('ą', 'a').replace('ę', 'e').replace('ó', 'o').replace('ł', 'l').replace('ń', 'n').replace('ś', 's').replace('ż', 'z').replace('ź', 'z')];

    // 1. Realne sesje portfolio z lokalizacją zawierającą nazwę miasta
    const sessions = await prisma.portfolioSession.findMany({
        where: {
            is_published: true,
            OR: cityVariants.map(v => ({ location: { contains: v, mode: 'insensitive' as const } })),
        },
        select: { session_date: true, created_at: true },
        orderBy: { session_date: 'desc' },
    }).catch(() => []);

    const sessionsCount = sessions.length;
    let lastSessionDaysAgo: number | null = null;
    if (sessions.length > 0) {
        const lastDate = sessions[0].session_date || sessions[0].created_at;
        if (lastDate) {
            const diff = Date.now() - new Date(lastDate).getTime();
            lastSessionDaysAgo = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
        }
    }

    // 2. Realne zajęte weekendy w nadchodzących 8 weekendach
    const now = new Date();
    const eightWeekendsFromNow = new Date(now.getTime() + 56 * 24 * 60 * 60 * 1000);
    const upcomingBookings = await prisma.booking.findMany({
        where: {
            date: { gte: now, lte: eightWeekendsFromNow },
            status: { in: ['confirmed', 'paid', 'completed', 'pending'] },
        },
        select: { date: true },
        orderBy: { date: 'asc' },
    }).catch(() => []);

    const bookedWeekends = new Set<string>();
    for (const b of upcomingBookings) {
        const d = new Date(b.date);
        const day = d.getDay();
        if (day === 0 || day === 5 || day === 6) {
            // grupuj po roku-tygodniu
            const weekKey = `${d.getFullYear()}-W${Math.floor(d.getDate() / 7)}-${d.getMonth()}`;
            bookedWeekends.add(weekKey);
        }
    }
    const upcomingFreeWeekends = Math.max(0, 8 - bookedWeekends.size);
    const nextBookedDate = upcomingBookings.length > 0
        ? new Date(upcomingBookings[0].date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })
        : null;

    // 3. Realne opinie z bazy (preferuj zawierające nazwę miasta, fallback featured)
    let testimonials = await prisma.testimonial.findMany({
        where: {
            OR: cityVariants.map(v => ({ testimonial_text: { contains: v, mode: 'insensitive' as const } })),
        },
        orderBy: [{ is_featured: 'desc' }, { display_order: 'asc' }],
        take: 3,
        select: { client_name: true, testimonial_text: true, rating: true, source: true },
    }).catch(() => []);

    if (testimonials.length === 0) {
        testimonials = await prisma.testimonial.findMany({
            where: { is_featured: true },
            orderBy: { display_order: 'asc' },
            take: 3,
            select: { client_name: true, testimonial_text: true, rating: true, source: true },
        }).catch(() => []);
    }

    // 4. Średnia ocen z wszystkich opinii (REALNE)
    const allRated = await prisma.testimonial.findMany({
        where: { rating: { not: null } },
        select: { rating: true },
    }).catch(() => []);
    const reviewsTotal = allRated.length;
    const averageRating = reviewsTotal > 0
        ? Math.round((allRated.reduce((a, t) => a + (t.rating || 0), 0) / reviewsTotal) * 10) / 10
        : null;

    return {
        sessionsCount,
        lastSessionDaysAgo,
        upcomingFreeWeekends,
        nextBookedDate,
        testimonials: testimonials.map(t => ({
            name: t.client_name,
            text: t.testimonial_text,
            rating: t.rating,
            source: t.source,
        })),
        googleReviewsUrl: 'https://g.page/r/wlasniewski-fotografia/review',
        averageRating,
        reviewsTotal,
    };
}
