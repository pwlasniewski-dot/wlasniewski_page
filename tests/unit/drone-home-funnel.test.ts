import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { withDroneMenuFunnel } from '../../src/lib/droneMenuFunnel.ts';
import { DEFAULT_HOMEPAGE_SERVICE_CARDS, mergeHomepageServiceCards } from '../../src/lib/homepageServiceCards.ts';

const homeSource = readFileSync(new URL('../../src/app/HomeContent.tsx', import.meta.url), 'utf8');
const adminSource = readFileSync(new URL('../../src/app/admin/pages/strona-glowna/page.tsx', import.meta.url), 'utf8');
const footerSource = readFileSync(new URL('../../src/components/Footer.tsx', import.meta.url), 'utf8');

test('the homepage drone tile exposes both offer and booking paths', () => {
    const drone = DEFAULT_HOMEPAGE_SERVICE_CARDS.find(card => card.service === 'Dron');
    assert.ok(drone);
    assert.match(drone.href, /^\/fotografia-z-drona/);
    assert.match(drone.secondary_href || '', /^\/rezerwacja\?service=Dron/);
    assert.match(homeSource, /item\.secondary_href/);
});

test('legacy three-card CMS data gains the editable drone card without replacing saved copy', () => {
    const cards = mergeHomepageServiceCards([
        { ...DEFAULT_HOMEPAGE_SERVICE_CARDS[0], title: 'Moja sesja' },
        DEFAULT_HOMEPAGE_SERVICE_CARDS[1],
        DEFAULT_HOMEPAGE_SERVICE_CARDS[2],
    ]);
    assert.equal(cards.length, 4);
    assert.equal(cards[0].title, 'Moja sesja');
    assert.equal(cards[3].service, 'Dron');
    assert.match(adminSource, /secondary_href/);
});

test('saved legacy drone links are normalized to the single reservation interface', () => {
    const saved = DEFAULT_HOMEPAGE_SERVICE_CARDS.map(card => ({ ...card }));
    saved[3].secondary_href = '/rezerwacja/dron?source=saved-cms';
    const cards = mergeHomepageServiceCards(saved);
    assert.equal(cards[3].secondary_href, '/rezerwacja?service=Dron&source=saved-cms');

    const menu = withDroneMenuFunnel([{ id: 6, title: 'Dron', url: '/fotografia-z-drona', children: [{ id: 7, title: 'Rezerwacja', url: '/rezerwacja/dron?source=saved-menu' }] }]);
    const booking = menu[0].children?.find(item => item.title === 'Rezerwacja');
    assert.equal(booking?.url, '/rezerwacja?service=Dron&source=saved-menu');
});

test('the public B2C menu always closes the drone offer-to-booking funnel', () => {
    const menu = withDroneMenuFunnel([{ id: 6, title: 'Dron', url: '/fotografia-z-drona', order: 6, children: [] }]);
    const drone = menu.find(item => item.url === '/fotografia-z-drona');
    assert.ok(drone);
    assert.ok(drone.children?.some(item => item.url === '/fotografia-z-drona'));
    assert.ok(drone.children?.some(item => item.url.includes('/rezerwacja') && item.url.includes('service=Dron')));
});

test('the footer has direct links to the drone offer and booking', () => {
    assert.match(footerSource, /url: '\/fotografia-z-drona'/);
    assert.match(footerSource, /url: '\/rezerwacja\?service=Dron&source=footer'/);
});
