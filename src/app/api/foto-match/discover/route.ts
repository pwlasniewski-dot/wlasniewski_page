/**
 * Foto-Match: discovery (kandydaci do dopasowania).
 *
 * GET /api/foto-match/discover?limit=20
 *   Wymaga: zalogowany user z ACTIVE profilem.
 *   Stosuje 15 cech filtrujących z FotoMatchMatchSettings.
 *
 * Zwraca: { candidates: [{ id, display_name, age, city, distance_km?, photo_url, ... }] }
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getFotoMatchAuth } from '@/lib/foto-match/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const auth = await getFotoMatchAuth(request, { requireProfile: true, requireActive: true });
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const me = auth.profile!;

    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 20), 50);

    const settings = await prisma.fotoMatchMatchSettings.findFirst({ orderBy: { id: 'asc' } });
    const s = settings; // alias

    // Bazowy filtr: aktywni, nie ja, nie usunięci.
    const where: any = {
        id: { not: me.id },
        status: 'ACTIVE',
        is_active: true,
    };

    // 1+2) Gender (mutually exclusive sprawdzane w PATCH match-settings)
    if (s?.opposite_gender_only && me.gender) {
        if (me.gender === 'male') where.gender = 'female';
        else if (me.gender === 'female') where.gender = 'male';
    }
    if (s?.same_gender_only && me.gender) {
        where.gender = me.gender;
    }

    // 3) Same city
    if (s?.same_city && me.city) {
        where.city = { equals: me.city, mode: 'insensitive' };
    }

    // 5) Age range
    if (s?.age_range && me.birth_year) {
        const yrs = s.age_range_years || 5;
        where.birth_year = {
            gte: me.birth_year - yrs,
            lte: me.birth_year + yrs,
        };
    }

    // 7) Same experience level
    if (s?.same_experience_level && me.experience) {
        where.experience = me.experience;
    }
    // 8) Complementary experience: experienced ↔ never_modeled (preferowane uzupełnianie)
    if (s?.complementary_experience && me.experience) {
        const complementMap: Record<string, string[]> = {
            never_modeled: ['experienced', 'few_times'],
            few_times: ['experienced'],
            experienced: ['never_modeled', 'few_times'],
        };
        const complements = complementMap[me.experience];
        if (complements) where.experience = { in: complements };
    }
    // 9) Same comfort level
    if (s?.same_comfort_level && me.comfort_level) {
        where.comfort_level = me.comfort_level;
    }

    // 10) Verified only
    if (s?.verified_only) {
        where.verified_at = { not: null };
    }

    // 12) No flagged photos (filtruje profile z choć jednym FLAGGED)
    if (s?.no_flagged_photos) {
        where.flagged_count = 0;
    }

    // 13) Recently active
    if (s?.recently_active) {
        const cutoff = new Date(Date.now() - (s.recently_active_days || 30) * 86400_000);
        where.last_active = { gte: cutoff };
    }

    // 14+15) Exclude already seen / matched — wykluczamy id po wcześniejszych swipe.
    if (s?.exclude_already_seen || s?.exclude_already_matched) {
        const swipeFilter: any = { from_profile_id: me.id };
        if (s.exclude_already_seen && !s.exclude_already_matched) {
            // wszystkie wcześniejsze interakcje
        } else if (!s.exclude_already_seen && s.exclude_already_matched) {
            swipeFilter.is_match = true;
        }
        const seen = await prisma.fotoMatchSwipe.findMany({
            where: swipeFilter,
            select: { to_profile_id: true },
        });
        if (seen.length > 0) {
            const ids = seen.map(s => s.to_profile_id);
            where.id = { not: me.id, notIn: ids };
        }
    }

    // 16) Wykluczamy zablokowanych (w obie strony) — zawsze, bezwarunkowo.
    const blocks = await prisma.fotoMatchBlock.findMany({
        where: { OR: [{ blocker_id: me.id }, { blocked_id: me.id }] },
        select: { blocker_id: true, blocked_id: true },
    });
    if (blocks.length > 0) {
        const blockedIds = new Set<number>();
        for (const b of blocks) {
            if (b.blocker_id !== me.id) blockedIds.add(b.blocker_id);
            if (b.blocked_id !== me.id) blockedIds.add(b.blocked_id);
        }
        const existingNotIn: number[] = where.id?.notIn || [];
        where.id = { not: me.id, notIn: [...existingNotIn, ...Array.from(blockedIds)] };
    }

    // Pobierz kandydatów + zdjęcia.
    const rawCandidates = await prisma.fotoMatchProfile.findMany({
        where,
        orderBy: { last_active: 'desc' },
        take: limit * 3, // bufor pod post-filtry
        select: {
            id: true,
            display_name: true,
            birth_year: true,
            gender: true,
            city: true,
            bio: true,
            interests: true,
            experience: true,
            comfort_level: true,
            verified_at: true,
            last_active: true,
            latitude: true,
            longitude: true,
            radius_km: true,
            photos: {
                where: { ai_status: 'APPROVED' },
                orderBy: { position: 'asc' },
                select: { id: true, url: true, position: true },
            },
        },
    });

    let candidates = rawCandidates;

    // 4) Respect search radius (Haversine, jeśli oba lat/lng dostępne).
    //    Filtrujemy po większym z dwóch promieni — szanujemy zarówno mój, jak i ich.
    if (s?.respect_search_radius && me.latitude != null && me.longitude != null) {
        const myLat = me.latitude;
        const myLng = me.longitude;
        const myRadius = me.radius_km || 30;
        candidates = candidates
            .map(c => {
                if (c.latitude == null || c.longitude == null) {
                    return { ...c, _distance_km: null };
                }
                const d = haversineKm(myLat, myLng, c.latitude, c.longitude);
                return { ...c, _distance_km: d };
            })
            .filter((c: any) => {
                if (c._distance_km == null) return false;
                const maxRadius = Math.max(myRadius, c.radius_km || 30);
                return c._distance_km <= maxRadius;
            });
    }

    // 11) Min photos count (post-filter, bo Prisma nie ma count w where łatwo)
    if (s?.min_photos) {
        const minN = s.min_photos_count || 3;
        candidates = candidates.filter(c => c.photos.length >= minN);
    }

    // 6) Min shared interests (post-filter — Prisma array intersection słabo wspierane)
    if (s?.min_shared_interests && me.interests) {
        const minShared = s.min_shared_interests_count || 2;
        const myInterests = new Set((me.interests as any[]).map(String));
        candidates = candidates.filter(c => {
            const theirs = new Set((c.interests as any[]).map(String));
            let shared = 0;
            for (const i of myInterests) if (theirs.has(i)) shared++;
            return shared >= minShared;
        });
    }

    // 7) SCORING — sortuj kandydatow po dopasowaniu zamiast losowo
    const myInterestsAll = new Set(((me.interests as any[]) || []).map(String));
    const scored = candidates.map(c => {
        const theirs = new Set(((c.interests as any[]) || []).map(String));
        let shared = 0;
        for (const i of myInterestsAll) if (theirs.has(i)) shared++;
        const sameCity = !!(me.city && c.city && me.city.toLowerCase() === c.city.toLowerCase());
        const verified = !!c.verified_at;
        const complementaryExp = !!(me.experience && c.experience && me.experience !== c.experience);
        const dist = (c as any)._distance_km;
        const distScore = (typeof dist === 'number') ? Math.max(0, 50 - dist) / 10 : 0;
        const score = shared * 3
            + (sameCity ? 2 : 0)
            + (verified ? 2 : 0)
            + (complementaryExp ? 1 : 0)
            + distScore;
        return { c, score };
    });
    scored.sort((a, b) => b.score - a.score);
    candidates = scored.slice(0, limit).map(s => s.c);

    const now = new Date().getFullYear();
    const result = candidates.map(c => {
        const theirs = new Set(((c.interests as any[]) || []).map(String));
        let shared = 0;
        for (const i of myInterestsAll) if (theirs.has(i)) shared++;
        const sameCity = !!(me.city && c.city && me.city.toLowerCase() === c.city.toLowerCase());
        const dist = (c as any)._distance_km;
        const distScore = (typeof dist === 'number') ? Math.max(0, 50 - dist) / 10 : 0;
        const matchScore = shared * 3
            + (sameCity ? 2 : 0)
            + (c.verified_at ? 2 : 0)
            + ((me.experience && c.experience && me.experience !== c.experience) ? 1 : 0)
            + distScore;
        return {
            id: c.id,
            display_name: c.display_name,
            age: c.birth_year ? now - c.birth_year : null,
            gender: c.gender,
            city: c.city,
            bio: c.bio,
            interests: c.interests,
            experience: c.experience,
            comfort_level: c.comfort_level,
            verified: !!c.verified_at,
            photos: c.photos,
            distance_km: dist != null ? Math.round(dist) : null,
            match_score: Math.round(matchScore * 10) / 10,
            shared_interests: shared,
        };
    });

    return NextResponse.json({
        candidates: result,
        applied_filters: s ? {
            opposite_gender_only: s.opposite_gender_only,
            same_gender_only: s.same_gender_only,
            same_city: s.same_city,
            age_range: s.age_range,
            verified_only: s.verified_only,
            min_photos: s.min_photos,
            recently_active: s.recently_active,
        } : null,
    });
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}
