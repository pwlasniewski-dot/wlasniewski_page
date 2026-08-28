import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function fixture(path: string) {
    return readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
}

test('photography robots is static, indexable and points only to its sitemap', async () => {
    const robots = await fixture('public/robots.txt');

    assert.match(robots, /^User-agent: \*$/m);
    assert.match(robots, /^Allow: \/$/m);
    assert.match(robots, /^Disallow: \/admin$/m);
    assert.match(robots, /^Disallow: \/galeria$/m);
    assert.match(robots, /^Sitemap: https:\/\/wlasniewski\.pl\/sitemap\.xml$/m);
    assert.doesNotMatch(robots, /aeroanaliza\.pl/);
});

test('Aero robots is static, indexable and points only to its sitemap', async () => {
    const robots = await fixture('public/_static/aeroanaliza-robots.txt');

    assert.match(robots, /^User-agent: \*$/m);
    assert.match(robots, /^User-agent: OAI-SearchBot$/m);
    assert.match(robots, /^User-agent: Googlebot$/m);
    assert.match(robots, /^Allow: \/$/m);
    assert.match(robots, /^Sitemap: https:\/\/aeroanaliza\.pl\/sitemap\.xml$/m);
    assert.doesNotMatch(robots, /wlasniewski\.pl/);
});

test('Netlify caches both robots files without application revalidation', async () => {
    const config = await fixture('netlify.toml');

    assert.match(config, /for = "\/robots\.txt"[\s\S]*?s-maxage=86400/);
    assert.match(config, /for = "\/_static\/aeroanaliza-robots\.txt"[\s\S]*?s-maxage=86400/);
});
