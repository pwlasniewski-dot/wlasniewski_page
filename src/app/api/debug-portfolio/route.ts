import { NextRequest, NextResponse } from 'next/server';
import { getPortfolioCategories } from '@/lib/portfolio';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const categories = await getPortfolioCategories();

        // Also fetch raw sessions to compare
        const allSessions = await prisma.portfolioSession.findMany({
            select: { id: true, title: true, category: true, is_category_hero: true, display_order: true, session_date: true },
            orderBy: { session_date: 'desc' }
        });

        const heroSessions = allSessions.filter(s => s.is_category_hero);

        return NextResponse.json({
            categoryCount: categories.length,
            categories: categories.map(c => ({
                slug: c.slug,
                title: c.title,
                sessionCount: c.sessions.length,
                coverImage: c.coverImage ? 'Present' : 'Missing',
                heroSession: c.sessions.find(s => s.isCategoryHero)?.title || 'None',
                firstSession: c.sessions[0]?.title || 'None'
            })),
            rawHeroSessionsCount: heroSessions.length,
            rawHeroSessions: heroSessions
        });
    } catch (error) {
        console.error('Portfolio debug failed:', error);
        return NextResponse.json({ error: 'Portfolio debug failed' }, { status: 500 });
    }
}
