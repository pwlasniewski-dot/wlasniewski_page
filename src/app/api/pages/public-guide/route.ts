import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { withAdminAuth } from '@/lib/auth/middleware';
import { defaultPublicGuideCmsData, parsePublicGuideCmsData, PUBLIC_GUIDE_PAGE_SLUG } from '@/lib/publicGuideCms';

export const dynamic = 'force-dynamic';

const settingsSchema = z.object({
    title: z.string().trim().min(1).max(160),
    metaTitle: z.string().trim().min(20).max(70),
    metaDescription: z.string().trim().min(50).max(180),
    metaKeywords: z.string().trim().max(1000),
    isPublished: z.boolean(),
    isInMenu: z.boolean(),
    menuTitle: z.string().trim().max(80),
    menuOrder: z.number().int().min(0).max(1000),
});

export async function GET(request: NextRequest) {
    return withAdminAuth(request, async () => {
        const page = await prisma.page.findUnique({ where: { slug: PUBLIC_GUIDE_PAGE_SLUG } });
        const parsed = parsePublicGuideCmsData(page?.content);
        return NextResponse.json({
            success: true,
            data: parsed ?? defaultPublicGuideCmsData(),
            settings: {
                title: page?.title || 'Jak się ubrać i pozować do sesji zdjęciowej?',
                metaTitle: page?.meta_title || 'Jak się ubrać i pozować do sesji zdjęciowej? Poradnik',
                metaDescription: page?.meta_description || 'Kompletny poradnik fotografa: ubiór, kolory do miasta, natury i domu oraz naturalne pozowanie par, rodzin i dzieci. Checklista przed sesją.',
                metaKeywords: page?.meta_keywords || 'jak się ubrać na sesję zdjęciową, jak pozować do zdjęć, sesja rodzinna',
                isPublished: parsed ? Boolean(page?.is_published) : true,
                isInMenu: Boolean(page?.is_in_menu),
                menuTitle: page?.menu_title || 'Jak się ubrać',
                menuOrder: page?.menu_order || 0,
            },
            source: parsed ? 'cms' : 'template',
            legacyDraftIgnored: Boolean(page && !parsed),
        });
    });
}

export async function POST(request: NextRequest) {
    return withAdminAuth(request, async (authenticatedRequest) => {
        const body = await authenticatedRequest.json();
        const data = parsePublicGuideCmsData(body.data);
        const settings = settingsSchema.safeParse(body.settings);
        if (!data || !settings.success) {
            return NextResponse.json({ success: false, error: 'Sprawdź wymagane opisy, obrazy i pola SEO.' }, { status: 400 });
        }

        const value = settings.data;
        const page = await prisma.page.upsert({
            where: { slug: PUBLIC_GUIDE_PAGE_SLUG },
            create: {
                slug: PUBLIC_GUIDE_PAGE_SLUG,
                title: value.title,
                page_type: 'public-guide',
                content: JSON.stringify(data),
                meta_title: value.metaTitle,
                meta_description: value.metaDescription,
                meta_keywords: value.metaKeywords,
                hero_image: data.hero.src,
                is_published: value.isPublished,
                is_in_menu: value.isInMenu,
                menu_title: value.menuTitle,
                menu_order: value.menuOrder,
            },
            update: {
                title: value.title,
                page_type: 'public-guide',
                content: JSON.stringify(data),
                meta_title: value.metaTitle,
                meta_description: value.metaDescription,
                meta_keywords: value.metaKeywords,
                hero_image: data.hero.src,
                is_published: value.isPublished,
                is_in_menu: value.isInMenu,
                menu_title: value.menuTitle,
                menu_order: value.menuOrder,
            },
            select: { updated_at: true },
        });
        revalidatePath('/jak-sie-ubrac');
        revalidatePath('/sitemap.xml');
        return NextResponse.json({ success: true, data, settings: value, updatedAt: page.updated_at });
    });
}
