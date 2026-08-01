import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAdminAuth } from '@/lib/auth/middleware';
import {
    defaultPreparationGuideCmsData,
    parsePreparationGuideCmsData,
    PREPARATION_GUIDE_PAGE_SLUG,
} from '@/lib/preparationGuideCms';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withAdminAuth(request, async () => {
        const page = await prisma.page.findUnique({
            where: { slug: PREPARATION_GUIDE_PAGE_SLUG },
            select: { content: true, updated_at: true },
        });
        return NextResponse.json({
            success: true,
            data: parsePreparationGuideCmsData(page?.content) ?? defaultPreparationGuideCmsData(),
            updatedAt: page?.updated_at ?? null,
            source: page ? 'cms' : 'fallback',
        });
    });
}

export async function POST(request: NextRequest) {
    return withAdminAuth(request, async (authenticatedRequest) => {
        const raw = await authenticatedRequest.json();
        const data = parsePreparationGuideCmsData(raw);
        if (!data) {
            return NextResponse.json(
                { success: false, error: 'Uzupełnij wymagane pola i sprawdź kolory oraz obrazy.' },
                { status: 400 }
            );
        }

        const page = await prisma.page.upsert({
            where: { slug: PREPARATION_GUIDE_PAGE_SLUG },
            create: {
                slug: PREPARATION_GUIDE_PAGE_SLUG,
                title: 'Panel Klienta — Przygotowanie',
                page_type: 'client-preparation',
                content: JSON.stringify(data),
                is_published: false,
                is_in_menu: false,
            },
            update: {
                title: 'Panel Klienta — Przygotowanie',
                page_type: 'client-preparation',
                content: JSON.stringify(data),
                is_published: false,
                is_in_menu: false,
            },
            select: { updated_at: true },
        });

        return NextResponse.json({ success: true, data, updatedAt: page.updated_at });
    });
}
