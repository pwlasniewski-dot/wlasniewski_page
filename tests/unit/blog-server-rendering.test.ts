import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Replace the database before importing the route; no external database is used.
const record = {
    slug: 'komunia', status: 'published', title: 'Fotografia komunijna z CMS',
    content: '<h2>Przygotowania</h2><p>Pełny artykuł dostępny bez JavaScript.</p>',
    excerpt: 'Opis z panelu.', category: 'Komunia', published_at: new Date('2026-05-01T12:00:00Z'),
    meta_title: 'Indywidualny tytuł SEO', meta_description: 'Opis SEO zapisany przez administratora.',
    featured_image: { file_path: '/test-cover.jpg', alt_text: 'Opis zdjęcia z CMS' },
};
let stored: typeof record | null = record;
const queries: Array<{ where: { slug: string; status: string } }> = [];
(globalThis as any).prisma = {
    blogPost: {
        findFirst: async (query: { where: { slug: string; status: string } }) => {
            queries.push(query);
            return stored?.slug === query.where.slug && stored.status === query.where.status ? stored : null;
        },
    },
    $disconnect: async () => {},
};

const pageModule = import('../../src/app/blog/[slug]/page');
const layoutModule = import('../../src/app/blog/[slug]/layout');
const params = Promise.resolve({ slug: 'komunia' });

test('published CMS article, H1, image and SEO are present in server rendering and reflect a later CMS edit', async () => {
    const { default: BlogPostPage } = await pageModule;
    const { generateMetadata } = await layoutModule;
    for (const title of ['Fotografia komunijna z CMS', 'Zaktualizowany tytuł z CMS']) {
        stored = { ...record, title, meta_title: `SEO: ${title}` };
        const html = renderToStaticMarkup(await BlogPostPage({ params }));
        assert.equal((html.match(/<h1\b/g) || []).length, 1);
        assert.ok(html.includes(title));
        assert.match(html, /Pełny artykuł dostępny bez JavaScript/);
        assert.match(html, /alt="Opis zdjęcia z CMS"/);
        assert.doesNotMatch(html, /Ładowanie/);
        const metadata = await generateMetadata({ params });
        assert.equal(metadata.title, `SEO: ${title}`);
        assert.equal(metadata.description, record.meta_description);
        assert.equal(metadata.alternates?.canonical, 'https://wlasniewski.pl/blog/komunia');
    }
    assert.ok(queries.length > 0);
    assert.ok(queries.every(query => query.where.status === 'published'));
});

test('missing and unpublished articles return Next.js 404 and noindex metadata', async () => {
    const { default: BlogPostPage } = await pageModule;
    const { generateMetadata } = await layoutModule;
    for (const value of [null, { ...record, status: 'draft' }]) {
        stored = value;
        await assert.rejects(BlogPostPage({ params }), /NEXT_HTTP_ERROR_FALLBACK;404/);
        const metadata = await generateMetadata({ params });
        assert.deepEqual(metadata.robots, { index: false, follow: true });
    }
});
