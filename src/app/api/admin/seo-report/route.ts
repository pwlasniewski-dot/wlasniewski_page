import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { portfolioCategories } from '@/data/portfolioData';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
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
        const sessions = await prisma.portfolioSession.findMany({
            include: {
                category: true // We need category slug to build URL
            }
        });

        // Format Pages
        const formattedPages = pages.map(page => ({
            type: 'Page',
            url: page.slug === 'strona-glowna' ? '/' : `/${page.slug}`,
            title: page.title,
            meta_title: page.meta_title || page.title,
            meta_description: page.meta_description || 'Brak opisu',
            meta_keywords: page.meta_keywords || '',
            updated_at: page.updated_at
        }));

        // Format Sessions
        const formattedSessions = sessions.map(session => ({
            type: 'Session',
            url: `/portfolio/${session.category?.slug || 'unknown'}/${session.slug}`,
            title: session.title,
            meta_title: `${session.title} | ${session.category?.slug || 'Portfolio'}`,
            meta_description: session.description || `Sesja: ${session.title}`,
            updated_at: session.date
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
