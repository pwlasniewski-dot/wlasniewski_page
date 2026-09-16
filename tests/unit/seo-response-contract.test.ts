import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const record = {
    slug: 'fotograf-torun', page_type: 'city_landing', is_published: true,
    meta_title: 'Sesje w Toruniu — tytuł ustawiony w panelu',
    meta_description: 'Opis oferty ustawiony w panelu.', meta_keywords: 'Toruń',
};
let stored: typeof record | null = record;
(globalThis as any).prisma = {
    page: { findFirst: async ({ where }: any) => {
        assert.equal(where.is_published, true);
        return stored?.slug === where.slug.equals ? stored : null;
    } },
    sessionType: { findMany: async () => [] },
    package: { findMany: async () => [] },
    setting: { findFirst: async () => null },
    $disconnect: async () => {},
};

test('CMS page resolver never exposes drafts and rereads subsequent CMS changes', async () => {
    const { getPublishedPage } = await import('../../src/lib/seo/published-page');
    assert.equal((await getPublishedPage('fotograf-torun'))?.meta_title, record.meta_title);
    stored = { ...record, meta_title: 'Nowy tytuł z panelu' };
    assert.equal((await getPublishedPage('fotograf-torun'))?.meta_title, 'Nowy tytuł z panelu');
    stored = null;
    assert.equal(await getPublishedPage('fotograf-torun'), null);
});

test('HTTP headers wait for metadata for browser and crawler user agents', async () => {
    assert.equal(existsSync('src/app/loading.tsx'), false, 'Global loading must not flush 200 before route existence is resolved');
    const { default: config } = await import('../../next.config.mjs');
    for (const ua of ['Mozilla/5.0', 'Googlebot', 'AhrefsBot', 'curl/8', '']) {
        assert.equal(config.htmlLimitedBots.test(ua), true);
    }
    const redirects = await config.redirects();
    assert.ok(redirects.some((r: any) => r.source === '/fotografia-rodzinna' && r.destination === '/sesja-rodzinna' && r.permanent));
});

test('CMS and Aero metadata use HTTP notFound/redirect instead of successful error metadata', () => {
    const cms = readFileSync('src/app/[slug]/page.tsx', 'utf8').split('export default async function')[0];
    assert.match(cms, /notFound\(\)/);
    assert.match(cms, /permanentRedirect\(canonical\)/);
    assert.doesNotMatch(cms, /title: 'Strona nie znaleziona'/);
    const aero = readFileSync('src/app/b2b/[slug]/page.tsx', 'utf8');
    assert.match(aero, /if \(!definition\) notFound\(\)/);
    assert.match(aero, /if \(status === 'unpublished'\) notFound\(\)/);
});

test('city title, description and social metadata use existing CMS SEO fields', () => {
    const source = readFileSync('src/app/fotograf-[city]/page.tsx', 'utf8');
    assert.match(source, /getPublishedPage\(data.slug\)/);
    assert.match(source, /page\?\.meta_title\?\.trim\(\)/);
    assert.match(source, /page\?\.meta_description\?\.trim\(\)/);
    assert.equal((source.match(/title: metaTitle/g) || []).length, 3);
    assert.match(source, /if \(!key\) notFound\(\)/);
});
