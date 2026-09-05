import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import HeroSlider from '../../src/components/HeroSlider';
import PageRenderer from '../../src/components/PageRenderer';
import { hasServerRenderedPrimaryHeading } from '../../src/lib/seo/page-headings';

const slide = { id: 'cover', image: '/test-photo.jpg', title: 'Zdjęcia z Płużnicy', subtitle: '' };
const headingCount = (html: string) => (html.match(/<h1\b/g) || []).length;

test('embedded CMS slider does not inject the homepage heading alongside the existing rich-text heading', () => {
    const sections = [
        { id: 'slider', type: 'hero_slider' as const, data: { slides: [slide] } },
        { id: 'about', type: 'rich_text' as const, data: { content: '<h1>Cześć! Fajnie, że tutaj wpadłeś.</h1><p>Treść z CMS.</p>' } },
    ];
    assert.equal(hasServerRenderedPrimaryHeading(sections), true);
    const html = renderToStaticMarkup(React.createElement(PageRenderer, { sections }));
    assert.equal(headingCount(html), 1);
    assert.match(html, /Cześć! Fajnie, że tutaj wpadłeś/);
    assert.doesNotMatch(html, /Fotograf Toruń — zdjęcia, do których chce się wracać/);
});

test('standalone slider preserves a document heading for homepage and portfolio', () => {
    for (const slides of [[], [slide], [{ ...slide, is_before_after: true, before_image: '/before.jpg' }]]) {
        const html = renderToStaticMarkup(React.createElement(HeroSlider, { slides, documentTitle: 'Sesja rodzinna — portfolio' }));
        assert.equal(headingCount(html), 1);
        assert.match(html, /Sesja rodzinna — portfolio/);
        const embedded = renderToStaticMarkup(React.createElement(HeroSlider, { slides, documentTitle: null }));
        assert.equal(headingCount(embedded), 0);
    }
});

test('fallback remains for empty headings and primary flags on sections that render no server H1', () => {
    for (const section of [
        { type: 'hero', isPrimaryHeading: true, title: '<span>&nbsp;</span>' },
        { type: 'story_hero', isPrimaryHeading: true, title: 'Opowieść' },
        { type: 'image_text', data: { isPrimaryHeading: true, title: 'Opis' } },
        { type: 'rich_text', content: '<h1> </h1><h2>Inny nagłówek</h2>' },
        { type: 'hero_slider', data: { slides: [slide] } },
    ]) assert.equal(hasServerRenderedPrimaryHeading([section]), false);
    assert.equal(hasServerRenderedPrimaryHeading([{ type: 'hero', isPrimaryHeading: true, title: 'Tytuł CMS' }]), true);
    assert.equal(hasServerRenderedPrimaryHeading([{ type: 'rich_text', content: '<H1 class="title"><span>Tytuł CMS</span></H1>' }]), true);
});
