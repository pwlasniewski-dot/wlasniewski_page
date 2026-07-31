import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { publicStyleGuideCategoryFilter } from '@/lib/styleGuideAccess';

export const dynamic = 'force-dynamic';

/**
 * GET /api/style-guide/search
 * Full-text search across style guide content
 * Uses optimized PostgreSQL full-text search
 */
export async function GET(request: NextRequest) {
    try {
        const parsed = z.object({
            q: z.string().trim().min(2).max(100),
            limit: z.coerce.number().int().positive().max(30).default(20),
        }).safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));

        if (!parsed.success) {
            return NextResponse.json({
                success: false,
                error: 'Query must contain 2–100 characters'
            }, { status: 400 });
        }

        const { q, limit } = parsed.data;
        const perTypeLimit = Math.max(1, Math.ceil(limit / 3));
        const [outfits, tips, faqs] = await Promise.all([
            prisma.outfitSet.findMany({
                where: {
                    is_active: true,
                    AND: [
                        publicStyleGuideCategoryFilter(),
                        { OR: [
                            { title: { contains: q, mode: 'insensitive' } },
                            { description: { contains: q, mode: 'insensitive' } },
                        ] },
                    ],
                },
                select: { id: true, slug: true, title: true, description: true, category: true },
                take: perTypeLimit,
                orderBy: { display_order: 'asc' },
            }),
            prisma.styleGuideTip.findMany({
                where: {
                    is_active: true,
                    AND: [
                        publicStyleGuideCategoryFilter(),
                        { OR: [
                            { title: { contains: q, mode: 'insensitive' } },
                            { content: { contains: q, mode: 'insensitive' } },
                        ] },
                    ],
                },
                select: { id: true, slug: true, title: true, content: true, category: true },
                take: perTypeLimit,
                orderBy: { display_order: 'asc' },
            }),
            prisma.styleGuideFaq.findMany({
                where: {
                    is_active: true,
                    AND: [
                        publicStyleGuideCategoryFilter(),
                        { OR: [
                            { question: { contains: q, mode: 'insensitive' } },
                            { answer: { contains: q, mode: 'insensitive' } },
                        ] },
                    ],
                },
                select: { id: true, question: true, answer: true, category: true },
                take: perTypeLimit,
                orderBy: { display_order: 'asc' },
            }),
        ]);

        const results = [
            ...outfits.map((item: { id: number; slug: string; title: string; description: string | null; category: string | null }) => ({ type: 'outfit', ...item })),
            ...tips.map((item: { id: number; slug: string; title: string; content: string; category: string | null }) => ({ type: 'tip', ...item })),
            ...faqs.map((item: { id: number; question: string; answer: string; category: string | null }) => ({ type: 'faq', ...item })),
        ].slice(0, limit);

        return NextResponse.json({
            success: true,
            data: results,
            query: q
        });
    } catch (error) {
        console.error('[Style Guide API] Error searching:', error);
        return NextResponse.json(
            { success: false, error: 'Search failed' },
            { status: 500 }
        );
    }
}
