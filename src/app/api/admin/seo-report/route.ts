import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { portfolioCategories } from '@/data/portfolioData';
import { requireAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const authError = await requireAuth(request as NextRequest);
    if (authError) return authError;
    try {
        // 1. Fetch Dynamic Pages (DB)
        const pages = await prisma.page.findMany({
            select: {
                slug: true,
                title: true,
                meta_title: true,
                meta_description: true,
                meta_keywords: true,
                updated_at: true
            }
        });

        // 2. Fetch Portfolio Categories (Static Data)
        // Note: These are currently static in portfolioData.ts, but can be enriched with DB settings if needed.
        const categories = portfolioCategories.map(cat => ({
            type: 'Category',
            url: `/portfolio/${cat.slug}`,
            title: cat.title,
            meta_title: `${cat.title} | Portfolio`, // Default logic from page.tsx
            meta_description: `Galeria zdjęć: ${cat.title}`, // Default logic
            updated_at: new Date().toISOString()
        }));

        // 3. Fetch Portfolio Sessions (Dynamic)
        // We need to fetch sessions to generate their URLs
        const sessions = await prisma.portfolioSession.findMany();

        // Format Pages
        const formattedPages = pages.map(page => ({
            type: 'Page',
            url: page.slug === 'strona-glowna' ? '/' : `/${page.slug}`,
            title: page.title,
            meta_title: page.meta_title || page.title || 'Untitled Page',
            meta_description: page.meta_description || '⚠️ Brak opisu meta (SEO Error)',
            meta_keywords: page.meta_keywords || '⚠️ Brak słów kluczowych',
            updated_at: page.updated_at
        }));

        // Format Sessions
        const formattedSessions = sessions.map(session => ({
            type: 'Session',
            url: `/portfolio/${session.category || 'unknown'}/${session.slug}`,
            title: session.title,
            meta_title: session.meta_title || `${session.title} | ${session.category || 'Portfolio'}`,
            meta_description: session.meta_description || session.description?.substring(0, 160) || `Sesja zdjęciowa: ${session.title}`,
            updated_at: session.session_date || session.created_at
        }));

        // Combine All
        const fullReport = [
            ...formattedPages,
            ...categories,
            ...formattedSessions
        ];

        return NextResponse.json({
            success: true,
            report: fullReport,
            count: fullReport.length,
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Failed to generate SEO report:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate report' },
            { status: 500 }
        );
    }
}
