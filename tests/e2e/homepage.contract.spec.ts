import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '../..');
const pageSource = readFileSync(join(root, 'src/app/page.tsx'), 'utf8');
const contentSource = readFileSync(join(root, 'src/app/HomeContent.tsx'), 'utf8');
const heroSource = readFileSync(join(root, 'src/components/HeroSlider.tsx'), 'utf8');
const homepageAdminSource = readFileSync(join(root, 'src/app/admin/pages/strona-glowna/page.tsx'), 'utf8');

test('renders meaningful hero HTML before client hydration', () => {
    const html = execFileSync(
        process.execPath,
        [join(root, 'node_modules/tsx/dist/cli.mjs'), join(root, 'tests/helpers/renderHomepageHero.ts')],
        { cwd: root, encoding: 'utf8' }
    );

    expect(html).toContain('<h1');
    expect(html).toContain('Sesja rodzinna w Toruniu');
    expect(html).toContain('href="/rezerwacja?source=hero-test"');
    expect(html).toContain('<picture');
    expect(html).toContain('fetchpriority="high"');
    expect(html).not.toBe('<div class="h-screen w-full bg-black"></div>');
});

test('keeps one semantic homepage heading and honors reduced motion', () => {
    expect(heroSource).toContain('<h1');
    expect(heroSource).toContain('useReducedMotion');
    expect(heroSource).not.toContain('if (!mounted)');
    expect(contentSource).not.toContain('<h1');
    expect(heroSource).toContain('h-[100svh]');
    expect(heroSource).toContain('/assets/slider/fotografia-rodzinna-grudziadz-01.webp');
    expect(contentSource).not.toMatch(/od \d+ zł/);
    expect(contentSource).toContain('Aktualne pakiety i ceny');
});

test('falls back safely when homepage CMS is unavailable and exposes social metadata', () => {
    expect(pageSource).toContain('Metadata CMS unavailable, using defaults');
    expect(pageSource).toContain('CMS unavailable, rendering resilient homepage fallback');
    expect(pageSource).toContain('cmsUnavailable = true');
    expect(pageSource).toContain('testimonialsUnavailable = true');
    expect(pageSource).toContain('orderedSections.length === 0 && (cmsUnavailable || sectionParseFailed)');
    expect(pageSource).toContain('testimonials={testimonialsUnavailable');
    expect(pageSource).toContain('openGraph:');
    expect(pageSource).toContain('twitter:');
    expect(pageSource).toContain("alternates: { canonical: 'https://wlasniewski.pl/' }");
    expect(pageSource).not.toContain("console.error('Failed to fetch hero slider interval'");
});

test('promotes the public guide with a canonical internal link and a dedicated lightweight image', () => {
    const dynamicSectionsPosition = contentSource.indexOf('{sections.map(section => renderSection(section))}');
    const guidePosition = contentSource.indexOf('Bezpłatny poradnik przed sesją');
    const giftCardPosition = contentSource.indexOf('Karta podarunkowa na sesję');

    expect(pageSource).toContain("/images/home/session-guide-family-v2.webp");
    expect(contentSource).toContain('bg-[#211d19]');
    expect(contentSource).toContain('href="/jak-sie-ubrac"');
    expect(contentSource).not.toContain('/jak-sie-ubrac?source=home-guide');
    expect(dynamicSectionsPosition).toBeGreaterThan(-1);
    expect(guidePosition).toBeGreaterThan(dynamicSectionsPosition);
    expect(giftCardPosition).toBeGreaterThan(guidePosition);
});

test('keeps CMS copy authoritative and lets editors provide responsive service-card images', () => {
    expect(pageSource).toContain('slide?.title?.trim() || copy.title');
    expect(pageSource).toContain('slide?.subtitle?.trim() || copy.subtitle');
    expect(pageSource).toContain('slide?.description ||');
    expect(pageSource).toContain('slide?.buttonText?.trim() || slide?.button_text?.trim() || copy.buttonText');

    expect(contentSource).toContain('homeData?.service_cards');
    expect(contentSource).toContain('<source media="(max-width: 767px)" srcSet={item.image_mobile}');
    expect(contentSource).toContain('objectPosition: item.image_position ||');

    expect(homepageAdminSource).toContain('service_cards: serviceCards');
    expect(homepageAdminSource).toContain("openMediaPicker('service_card', index, 'image_mobile')");
    expect(homepageAdminSource).toContain('Kafle oferty pod Hero');
});
