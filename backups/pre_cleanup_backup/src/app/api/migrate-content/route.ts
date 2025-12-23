// @ts-nocheck
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cityData } from '@/lib/cityData';
import { PageSection } from '@/components/admin/PageBuilder';

export async function GET() {
    try {
        const results = [];

        for (const [key, data] of Object.entries(cityData)) {
            const sections: PageSection[] = [];

            // 1. Hero Parallax
            sections.push({
                id: `hero-${key}`,
                type: 'hero_parallax',
                image: data.heroImage,
                title: data.h1,
                enabled: true
            });

            // 2. Intro (Rich Text)
            sections.push({
                id: `intro-${key}`,
                type: 'rich_text',
                content: `
                    <h2>Wstęp</h2>
                    ${data.intro.map(p => `<p>${p}</p>`).join('')}
                `,
                enabled: true
            });

            // 3. Przygotowanie
            sections.push({
                id: `prep-${key}`,
                type: 'rich_text',
                content: `
                    <h2>Przygotowanie do sesji</h2>
                    ${data.przygotowanie.map(p => `<p>${p}</p>`).join('')}
                `,
                enabled: true
            });

            // 4. Miejsca
            sections.push({
                id: `places-${key}`,
                type: 'rich_text',
                content: `
                    <h2>Gdzie wykonujemy zdjęcia?</h2>
                    ${data.miejsca.map(p => `<p>${p}</p>`).join('')}
                `,
                enabled: true
            });

            // 5. Przebieg
            sections.push({
                id: `process-${key}`,
                type: 'rich_text',
                content: `
                    <h2>Jak wygląda sesja?</h2>
                    ${data.przebieg.map(p => `<p>${p}</p>`).join('')}
                `,
                enabled: true
            });

            // 6. Pakiet & Cennik
            sections.push({
                id: `pricing-${key}`,
                type: 'rich_text',
                content: `
                    <h2>Pakiet i Cennik</h2>
                    ${data.pakiet.map(p => `<p>${p}</p>`).join('')}
                    <h3>Rezerwacja</h3>
                    ${data.cennik.map(p => `<p>${p}</p>`).join('')}
                `,
                enabled: true
            });

            // Update or Create Page
            const page = await prisma.page.upsert({
                where: { slug: data.slug },
                update: {
                    title: data.h1,
                    meta_title: data.metaTitle,
                    meta_description: data.metaDescription,
                    meta_keywords: data.keywords,
                    hero_image: data.heroImage,
                    sections: JSON.stringify(sections),
                    is_published: true,
                    content: '' // Legacy content field cleared as we use sections now
                },
                create: {
                    slug: data.slug,
                    title: data.h1,
                    meta_title: data.metaTitle,
                    meta_description: data.metaDescription,
                    meta_keywords: data.keywords,
                    hero_image: data.heroImage,
                    sections: JSON.stringify(sections),
                    is_published: true,
                    content: ''
                }
            });

            results.push({ slug: data.slug, status: 'migrated' });
        }

        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
    }
}
