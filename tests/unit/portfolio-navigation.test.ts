import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PortfolioBackLinks, PortfolioCategoryNavigation } from '../../src/components/portfolio/PortfolioNavigation';
import PortfolioIndexViews from '../../src/components/portfolio/PortfolioIndexViews';
import type { PortfolioSession } from '../../src/lib/portfolio';

const sessions: PortfolioSession[] = [
    { id: 1, category: 'Sesja Rodzinna', slug: 'park-miejski-w-toruniu', title: 'Park Miejski w Toruniu', imageCount: 29, date: '2026-08-06', photos: [], highlightedPhotos: [] },
    { id: 2, category: 'Sesja Rodzinna', slug: 'sesja-rodzinna', title: 'Sesja rodzinna', imageCount: 12, date: '2026-07-01', photos: [], highlightedPhotos: ['/wybrane-1.jpg', '/wybrane-2.jpg'] },
];

test('return destinations are explicit for direct and internal arrivals', () => {
    const html = renderToStaticMarkup(React.createElement(PortfolioBackLinks, { category: 'Sesja Rodzinna' }));
    assert.match(html, /href="\/portfolio#wybrane-historie"/);
    assert.match(html, /Wróć do portfolio/);
    assert.match(html, /href="\/portfolio\/Sesja%20Rodzinna#sesje"/);
    assert.match(html, /Sesje: Sesja Rodzinna/);
    assert.doesNotMatch(html, />[^<]*Sesja%20Rodzinna/);
    const indexLink = renderToStaticMarkup(React.createElement(PortfolioBackLinks));
    assert.equal((indexLink.match(/<a\b/g) || []).length, 1);
});

test('category navigation includes the unstarred session exactly once beside the starred session', () => {
    const html = renderToStaticMarkup(React.createElement(PortfolioCategoryNavigation, { sessions }));
    for (const session of sessions) {
        const href = `/portfolio/Sesja%20Rodzinna/${session.slug}`;
        assert.equal(html.split(`href="${href}"`).length - 1, 1);
        assert.ok(html.includes(session.title));
    }
    assert.match(html, /id="sesje"/);
    assert.equal((html.match(/<li\b/g) || []).length, 2);
});

test('navigation reflects CMS titles and encodes path separators instead of changing the destination', () => {
    const html = renderToStaticMarkup(React.createElement(PortfolioCategoryNavigation, {
        sessions: [{ ...sessions[0], category: 'Rodzina & pary', slug: 'lato / nad-wisłą', title: 'Nowy tytuł z panelu' }],
    }));
    assert.match(html, /Nowy tytuł z panelu/);
    assert.match(html, /href="\/portfolio\/Rodzina%20%26%20pary\/lato%20%2F%20nad-wis%C5%82%C4%85"/);
    assert.doesNotMatch(html, /Park Miejski/);
});

for (const layout of ['chapters', 'cinematic_contact'] as const) {
    test(`${layout} distinguishes two sessions from the same category and keeps the return anchor`, () => {
        const html = renderToStaticMarkup(React.createElement(PortfolioIndexViews, { items: sessions, layout, isSessionMode: true }));
        assert.match(html, /id="wybrane-historie"/);
        assert.match(html, /<h2[^>]*>Park Miejski w Toruniu<\/h2>/);
        assert.match(html, /<h2[^>]*>Sesja rodzinna<\/h2>/);
        assert.match(html, /href="\/portfolio\/Sesja%20Rodzinna\/park-miejski-w-toruniu"/);
        assert.doesNotMatch(html, /wybierasz w panelu Portfolio/);
    });
    test(`${layout} category mode still links to a category rather than a session`, () => {
        const html = renderToStaticMarkup(React.createElement(PortfolioIndexViews, {
            items: [{ slug: 'Sesja Rodzinna', title: 'Sesja Rodzinna' }], layout, isSessionMode: false,
        }));
        assert.match(html, /href="\/portfolio\/Sesja%20Rodzinna"/);
        assert.doesNotMatch(html, /href="\/portfolio\/sesja\//);
    });
}
