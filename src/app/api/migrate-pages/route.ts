import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cityData } from '@/lib/cityData';
import { PageSection } from '@/components/admin/PageBuilder';

export async function GET() {
    try {
        const results = [];

        for (const [key, data] of Object.entries(cityData)) {
            const sections: PageSection[] = [
                {
                    id: 'hero',
                    type: 'hero_parallax',
                    title: data.h1,
                    image: data.heroImage,
                },
                {
                    id: 'intro',
                    type: 'rich_text',
                    content: data.intro.map(p => `<p>${p}</p>`).join(''),
                },
                {
                    id: 'prep',
                    type: 'rich_text',
                    content: `<h2>Przygotowanie do sesji</h2>${data.przygotowanie.map(p => `<p>${p}</p>`).join('')}`,
                },
                {
                    id: 'locations',
                    type: 'rich_text',
                    content: `<h2>Miejsca sesji w ${data.city}</h2>${data.miejsca.map(p => `<p>${p}</p>`).join('')}`,
                },
                {
                    id: 'process',
                    type: 'rich_text',
                    content: `<h2>Jak przebiega sesja?</h2>${data.przebieg.map(p => `<p>${p}</p>`).join('')}`,
                },
                {
                    id: 'package',
                    type: 'rich_text',
                    content: `<h2>Co otrzymujesz?</h2>${data.pakiet.map(p => `<p>${p}</p>`).join('')}`,
                },
                {
                    id: 'pricing',
                    type: 'rich_text',
                    content: `<h2>Rezerwacja i cennik</h2>${data.cennik.map(p => `<p>${p}</p>`).join('')}`,
                }
            ];

            const page = await prisma.page.upsert({
                where: { slug: data.slug },
                update: {
                    title: data.h1,
                    content: '', // Legacy content field, unused for builder pages
                    is_published: true,
                    meta_title: data.metaTitle,
                    meta_description: data.metaDescription,
                    meta_keywords: data.keywords,
                    sections: JSON.stringify(sections),
                },
                create: {
                    slug: data.slug,
                    title: data.h1,
                    content: '',
                    is_published: true,
                    meta_title: data.metaTitle,
                    meta_description: data.metaDescription,
                    meta_keywords: data.keywords,
                    sections: JSON.stringify(sections),
                },
            });
            results.push(page.slug);
        }

        return NextResponse.json({ success: true, migrated: results });
    } catch (error) {
        console.error('Migration failed:', error);
        return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
    }
}
