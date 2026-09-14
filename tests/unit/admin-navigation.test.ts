import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { navigation, activeAdminNavigation } from '../../src/lib/admin/navigation';

test('every admin menu destination exists and has exactly one leaf', () => {
    const destinations = navigation.flatMap(item => item.children ? item.children.map(child => child.href) : [item.href]);
    assert.equal(new Set(destinations).size, destinations.length);
    for (const href of destinations) assert.ok(existsSync(`src/app${href}/page.tsx`), `${href} is a broken admin link`);
    assert.equal(destinations.filter(href => href.endsWith('/orders')).length, 1);
    assert.match(readFileSync('src/app/admin/gallery-orders/page.tsx', 'utf8'), /redirect\(['"]\/admin\/bookings\/orders['"]\)/);
});

test('nested and sibling editors select one appropriate menu item', () => {
    for (const [path, href, parent] of [
        ['/admin/bookings/orders', '/admin/bookings/orders', 'Rezerwacje'],
        ['/admin/bookings/123', '/admin/bookings', 'Rezerwacje'],
        ['/admin/rezerwacja', '/admin/rezerwacja', 'Rezerwacje'],
        ['/admin/promocje', '/admin/promocje', 'Rezerwacje'],
        ['/admin/photo-funnel', '/admin/photo-funnel', 'Rezerwacje'],
        ['/admin/pages/przygotowanie-klienta', '/admin/pages/przygotowanie-klienta', 'Przygotowanie klienta'],
        ['/admin/pages/123', '/admin/pages', 'Strony'],
        ['/admin/gift-cards/sklep', '/admin/gift-cards/sklep', 'Vouchery / prezenty'],
        ['/admin/galleries/26', '/admin/galleries', 'Galerie'],
        ['/admin/seo/headings', '/admin/seo/headings', 'SEO Ops'],
    ]) assert.deepEqual(activeAdminNavigation(path), { href, parent });
    assert.equal(activeAdminNavigation('/admin/pages-malformed'), null);
});
