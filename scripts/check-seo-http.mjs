// Read-only release check. Run against preview first, then production.
// SEO_BASE_URL=https://preview.example node scripts/check-seo-http.mjs
import assert from 'node:assert/strict';

const base = new URL(process.env.SEO_BASE_URL || 'https://wlasniewski.pl');
assert.ok(['http:', 'https:'].includes(base.protocol));
let failures = 0;
const titles = new Map();
for (const path of ['/', '/fotograf-torun', '/sesja-rodzinna', '/robots.txt', '/sitemap.xml', '/seo-release-check-does-not-exist', '/fotograf-seo-release-missing', '/fotografia-rodzinna']) {
    try {
        const response = await fetch(new URL(path, base), {
            redirect: 'manual', signal: AbortSignal.timeout(60_000),
        });
        const body = await response.text();
        if (path.includes('does-not-exist') || path.includes('seo-release-missing')) {
            assert.equal(response.status, 404, 'Missing page must return HTTP 404');
        } else if (path === '/fotografia-rodzinna') {
            assert.ok([301, 308].includes(response.status));
            assert.equal(new URL(response.headers.get('location'), base).pathname, '/sesja-rodzinna');
        } else {
            assert.equal(response.status, 200);
            if (path === '/robots.txt') {
                assert.match(body, /Sitemap:\s*https:\/\/wlasniewski\.pl\/sitemap.xml/i);
                assert.doesNotMatch(body, /Disallow:\s*\/\s*(?:\r?\n|$)/i);
            } else if (path === '/sitemap.xml') {
                assert.match(body, /<urlset/);
                assert.doesNotMatch(body, /<loc>https:\/\/wlasniewski\.pl\/(?:monitoring|b2b|termowizja)(?:<|\/)/);
            } else {
                const head = body.split('</head>')[0];
                const title = head.match(/<title>([^<]+)<\/title>/)?.[1];
                assert.ok(title, 'Title must be in initial HTML head');
                assert.doesNotMatch(title, /monitoring inwestycji|Aero Analiza/i);
                assert.doesNotMatch(head, /name="robots" content="[^"]*noindex/);
                assert.ok(head.includes(`href="https://wlasniewski.pl${path === '/' ? '' : path}"`) || head.includes(`href="https://wlasniewski.pl${path}"`), 'Missing self canonical');
                titles.set(path, title);
            }
        }
        console.log(`PASS ${path} HTTP ${response.status}`);
    } catch (error) {
        failures++;
        console.error(`FAIL ${path}: ${error.message}`);
    }
}
if (titles.has('/') && titles.get('/') === titles.get('/fotograf-torun')) {
    failures++;
    console.error('FAIL homepage and Torun page have identical titles');
}
process.exitCode = failures ? 1 : 0;
