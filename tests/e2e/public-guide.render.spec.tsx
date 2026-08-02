import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { metadata as guideMetadata } from '../../src/app/jak-sie-ubrac/page';
import { metadata as productMetadata } from '../../src/app/sklep/poradnik-jak-sie-ubrac-i-pozowac/page';

const root = join(__dirname, '../..');
const guideSource = readFileSync(join(root, 'src/app/jak-sie-ubrac/page.tsx'), 'utf8');
const rendered = JSON.parse(execFileSync(
    process.execPath,
    [join(root, 'node_modules/tsx/dist/cli.mjs'), join(root, 'tests/helpers/renderPublicGuides.ts')],
    { cwd: root, encoding: 'utf8' }
)) as { guide: string; product: string };

test('renders an indexable people-first guide with required sections', () => {
    const html = rendered.guide;

    expect(html).toContain('<h1');
    expect(html).toContain('Jak się ubrać i');
    expect(html).toContain('Odpowiedź w 60 sekund');
    expect(html).toContain('Kolory i otoczenie');
    expect(html).toContain('Naturalna poza zaczyna się od małego ruchu');
    expect(html).toContain('Trzy scenariusze');
    expect(html).toContain('Checklista przed sesją');
    expect(html).toContain('Najczęstsze pytania');
    expect(html).toContain('Przemysław Właśniewski');
    expect(html).toContain('application/ld+json');
    expect(html).toContain('href="/rezerwacja"');
});

test('has complete metadata and public structured data', () => {
    expect(guideMetadata.title).toContain('Jak się ubrać i pozować');
    expect(guideMetadata.description).toContain('Kompletny poradnik');
    expect(guideMetadata.alternates?.canonical).toBe('https://wlasniewski.pl/jak-sie-ubrac');
    expect(guideMetadata.openGraph).toBeTruthy();
    expect(guideSource).toContain("'@type': 'BreadcrumbList'");
    expect(guideSource).toContain("'@type': 'FAQPage'");
    expect(guideSource).toContain("'@type': 'Person'");
});

test('does not expose the private guide data or API', () => {
    expect(guideSource).not.toContain('preparationGuides');
    expect(guideSource).not.toContain('/api/style-guide/client');
    expect(guideSource).not.toContain('POSE_GUIDE_CARDS');
    expect(guideSource).not.toContain('prisma.');

    const publicGuideImages = new Set(
        [...guideSource.matchAll(/\/images\/(?:public-guide|client-guides\/(?:wardrobe|poses))\/[^'"\s)]+/g)].map(match => match[0])
    );
    expect(publicGuideImages.size).toBeGreaterThanOrEqual(7);
    expect(publicGuideImages.size).toBeLessThanOrEqual(20);
    expect(rendered.guide).toContain('10 naturalnych ustawień dla rodziny');
    expect(guideSource).toContain('/images/public-guide/hero-family-walk.webp');
    expect(guideSource).toContain('/images/public-guide/family-playful-lift.webp');
    expect(guideSource).not.toContain('Wygenerowany obraz');
});

test('an expired account session does not redirect a public guide to login', () => {
    const authSource = readFileSync(join(root, 'src/context/AuthContext.tsx'), 'utf8');
    expect(authSource).toContain('clearSession();');
    expect(authSource).not.toMatch(/else\s*\{\s*logout\(\);/);
});

test('a missing dynamic menu falls back without opening a development error overlay', () => {
    const navbarSource = readFileSync(join(root, 'src/components/Navbar.tsx'), 'utf8');
    expect(navbarSource).not.toContain("console.error('Menu data is not an array:'");
    expect(navbarSource).not.toContain("console.error('Failed to fetch menu:'");
    expect(navbarSource).toContain('using the built-in navigation');
});

test('optional analytics fail quietly when the settings database is unavailable', () => {
    const analyticsSource = readFileSync(join(root, 'src/components/AnalyticsLoader.tsx'), 'utf8');
    expect(analyticsSource).not.toContain("console.error('Failed to load analytics settings:'");
    expect(analyticsSource).toContain('continuing without trackers');
});

test('renders an honest product preview without a fake offer', () => {
    const html = rendered.product;
    const productSource = readFileSync(join(root, 'src/app/sklep/poradnik-jak-sie-ubrac-i-pozowac/page.tsx'), 'utf8');

    expect(html).toContain('W przygotowaniu');
    expect(html).toContain('nie jest jeszcze dostępny w sprzedaży');
    expect(html).toContain('Zapytaj o premierę');
    expect(productSource).toContain('/images/public-guide/family-seated-lilac.webp');
    expect(productSource).toContain('/images/public-guide/parents-child-motion.webp');
    expect(html).not.toContain('/checkout');
    expect(productSource).not.toContain("'@type': 'Product'");
    expect(productSource).not.toContain("'@type': 'Offer'");
    expect(productMetadata.alternates?.canonical).toBe('https://wlasniewski.pl/sklep/poradnik-jak-sie-ubrac-i-pozowac');
});

test('makes the global client preparation editor discoverable in admin', () => {
    const sidebar = readFileSync(join(root, 'src/components/admin/Sidebar.tsx'), 'utf8');
    expect(sidebar).toContain("name: 'Przygotowanie klienta'");
    expect(sidebar).toContain("href: '/admin/pages/przygotowanie-klienta'");
});

test('ships seventeen unique optimized public-guide illustrations', () => {
    const assetDir = join(root, 'public/images/public-guide');
    const assets = readdirSync(assetDir).filter(name => name.endsWith('.webp')).sort();
    const expected = [
        'coordinated-family-pastels.webp',
        'family-playful-lift.webp',
        'family-seated-close.webp',
        'family-seated-lilac.webp',
        'family-seated-neutral.webp',
        'hero-family-walk.webp',
        'parents-child-motion.webp',
    ];

    expect(assets).toEqual(expected);
    const hashes = new Set<string>();
    for (const asset of assets) {
        const path = join(assetDir, asset);
        const bytes = readFileSync(path);
        expect(bytes.subarray(0, 4).toString('ascii')).toBe('RIFF');
        expect(statSync(path).size).toBeLessThan(100_000);
        hashes.add(bytes.toString('base64'));
    }
    expect(hashes.size).toBe(7);

    const poseAssets = readdirSync(join(assetDir, 'pose-cards')).filter(name => name.endsWith('.webp')).sort();
    expect(poseAssets).toHaveLength(10);
    for (const asset of poseAssets) {
        const path = join(assetDir, 'pose-cards', asset);
        const bytes = readFileSync(path);
        expect(bytes.subarray(0, 4).toString('ascii')).toBe('RIFF');
        expect(statSync(path).size).toBeLessThan(100_000);
        hashes.add(bytes.toString('base64'));
    }
    expect(hashes.size).toBe(17);
});
