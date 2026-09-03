import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
    photographySitemapUrl,
    portfolioSessionSitemapUrl,
    sitemapPathSegment,
} from '../../src/lib/seo/sitemapUrl';

test('canonical photography sitemap URLs use HTTPS apex host', () => {
    assert.equal(photographySitemapUrl(), 'https://wlasniewski.pl/');
    assert.equal(photographySitemapUrl('/fotograf-torun'), 'https://wlasniewski.pl/fotograf-torun');
    assert.equal(photographySitemapUrl('blog/wpis'), 'https://wlasniewski.pl/blog/wpis');
});

test('dynamic sitemap path segments cannot produce literal spaces or path injection', () => {
    assert.equal(sitemapPathSegment('Sesja Rodzinna'), 'Sesja%20Rodzinna');
    assert.equal(sitemapPathSegment('Ślub'), '%C5%9Alub');
    assert.equal(sitemapPathSegment('rodzina/plener'), 'rodzina%2Fplener');

    const url = portfolioSessionSitemapUrl('Sesja Rodzinna', 'park miejski/w Toruniu');
    assert.equal(
        url,
        'https://wlasniewski.pl/portfolio/Sesja%20Rodzinna/park%20miejski%2Fw%20Toruniu',
    );
    assert.equal(url.includes(' '), false);
});

test('root sitemap stays cacheable and independent from request headers', () => {
    const sitemapSource = readFileSync('src/app/sitemap.ts', 'utf8');

    assert.doesNotMatch(sitemapSource, /from ['"]next\/headers['"]/);
    assert.match(sitemapSource, /export const dynamic = ['"]force-static['"]/);
    assert.match(sitemapSource, /export const revalidate = 86_400/);
    assert.match(sitemapSource, /portfolioSessionSitemapUrl\(session\.category, session\.slug\)/);
});
