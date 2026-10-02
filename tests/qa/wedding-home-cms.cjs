// Real CMS components and APIs against in-memory records. No external database.
const h = require('./gallery-shop-dom.cjs');
const { assert, React, act, mount, reset, button, field, click, set, check } = h;
const Module = require('node:module');
const { renderToStaticMarkup } = require('react-dom/server');
const { NextRequest, NextResponse } = require('next/server');
let authAllowed = true;
let homepageReadFailed = false;
let homepageActiveRows = [];
let pkg = { id: 6, service_id: 2, name: 'Pełny reportaż ślubny', hours: 12, price: 590000,
    description: '<p>Ustalony zakres</p>', features: '[]', subtitle: 'Zatwierdzony zakres', is_active: true, order: 0 };
let page = { id: 1, slug: 'strona-glowna', title: 'Strona główna', is_published: true,
    home_sections: JSON.stringify({ hero_slider: [], sections: [] }), sections: '[]' };
const service = { id: 2, name: 'Ślub', is_active: true, order: 0 };
let seoPage = { slug: 'slub', title: 'Oferta ślubna', meta_title: 'Fotograf ślubny Toruń, Grudziądz, Chełmno | Właśniewski',
    meta_description: 'Opis zatwierdzony w istniejącym CMS.', sections: '[]' };
const clone = value => JSON.parse(JSON.stringify(value));
const db = {
    page: { findFirst: async () => clone(page), findUnique: async () => clone(page),
        update: async ({ data }) => { page = { ...page, ...data }; return clone(page); } },
    package: { findUnique: async () => clone(pkg), findMany: async () => [{ ...clone(pkg), service }],
        update: async ({ data }) => { pkg = { ...pkg, ...data }; return clone(pkg); } },
    serviceType: { findMany: async () => [{ ...service, packages: [clone(pkg)] }] },
    $queryRaw: async () => [{ acquired: 1 }], $transaction: async callback => callback(db),
};
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
    if (request === '@/lib/db/prisma') return { __esModule: true, default: db };
    if (request === '@/lib/auth/middleware') return {
        requireAuth: async () => authAllowed ? null : NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        withAuth: async (request, callback) => authAllowed ? callback(request) : NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
    if (request === 'next/cache') return { unstable_noStore: () => {}, unstable_cache: callback => callback, revalidatePath: () => {}, revalidateTag: () => {} };
    if (request === 'next/navigation') return { useRouter: () => ({ push: () => {} }) };
    if (request === '@/lib/analytics/pagePublicationRegistry') return { preserveFirstPublication: async () => {}, publicationRegistryIdentity: () => ({}) };
    if (request === '@/lib/packagePromotions') return {
        loadActivePromotionsForPackages: async () => new Map(),
        loadHomepagePromotionState: async () => require('../../src/lib/packagePromotions.ts').loadHomepagePromotionState(new Date(), {
            $queryRaw: async query => {
                if (homepageReadFailed) throw new Error('Test promotion read unavailable');
                return query.sql.includes('pp."starts_at" >') ? [] : homepageActiveRows;
            },
        }),
    };
    if (request === '@/lib/seo/published-page') return { getPublishedPage: async () => seoPage };
    if (request === '@/app/fotograf-[city]/page') return { __esModule: true, default: () => null, generateMetadata: async () => ({}) };
    if (request === '@/lib/marketing/photo-funnel.server') return { loadPhotoFunnelConfig: async () => require('../../src/lib/marketing/photo-funnel.ts').DEFAULT_PHOTO_FUNNEL_CONFIG };
    if (request === '@/hooks/useAnalytics') return { useAnalytics: () => ({ trackEvent: async () => {} }) };
    if (['@/components/HeroSlider', '@/components/ContactForm', '@/components/PhotoChallengeBanner', '@/components/admin/MediaPicker', '@/components/admin/BookingAvailabilityEditor'].includes(request)) return { __esModule: true, default: () => null };
    return originalLoad.apply(this, arguments);
};
document.execCommand = () => false;
document.queryCommandState = () => false;
document.queryCommandValue = () => '';
const Renderer = require('../../src/components/PageRenderer.tsx').default;
const HomeContent = require('../../src/app/HomeContent.tsx').default;
const HomeAdmin = require('../../src/app/admin/pages/strona-glowna/page.tsx').default;
const PackageAdmin = require('../../src/app/admin/rezerwacja/page.tsx').default;
const pageApi = require('../../src/app/api/pages/route.ts');
const packageApi = require('../../src/app/api/packages/route.ts');
const serviceApi = require('../../src/app/api/service-types/route.ts');
const servicePage = require('../../src/app/[slug]/page.tsx');
const baseFetch = async (url, init = {}) => {
    const request = new NextRequest(`http://localhost${url}`, init);
    if (url.startsWith('/api/pages')) return init.method === 'POST' ? pageApi.POST(request) : pageApi.GET(request);
    if (url.startsWith('/api/service-types')) return serviceApi.GET(request);
    if (url === '/api/packages') return packageApi.POST(request);
    throw new Error(`Unexpected request: ${url}`);
};
global.fetch = baseFetch;
const homeProps = sections => ({ skipHero: true, heroSlides: [], sections, orderedSections: sections,
    homeData: null, testimonials: [], publicPriceLabels: {}, featuredPromotions: {}, publicGuidePromo: null });
const editorialSections = [
    { id: 'mag', type: 'magazine_layout', data: { title: 'Historia ślubna', content: '<p>Tekst redakcyjny z CMS</p>', image: '/images/test-main.webp' } },
    { id: 'text', type: 'narrative_text', data: { title: 'Narracja', content: '<p>Drugi tekst ślubny z CMS</p>' } },
    { id: 'gallery', type: 'masonry_gallery', data: { title: 'Galeria ślubna', images: Array.from({ length: 14 }, (_, i) => `/images/test-gallery-${i}.webp`) } },
];
const promotion = { id: 91, packageId: 6, packageName: 'Pełny reportaż ślubny', serviceName: 'Ślub', label: 'Zatwierdzona promocja',
    discountType: 'fixed', discountValue: 10000, regularPrice: 590000, price: 580000, lowestPrice30d: 590000,
    referenceSource: 'ADMIN_CONFIRMED', referencePeriod: 'THIRTY_DAYS',
    startsAt: '2020-01-01T00:00:00.000Z', endsAt: '2099-01-01T00:00:00.000Z', allowPromoCode: false,
    showOnHome: true, displayDiscountPercent: 1, legalText: 'Najniższa cena z 30 dni przed obniżką: 5 900 zł' };

(async () => {
    await check('service metadata honors nonempty CMS SEO and keeps automatic price fallback for blank fields', async () => {
        const metadata = await servicePage.generateMetadata({ params: Promise.resolve({ slug: 'slub' }) });
        assert.equal(metadata.title, seoPage.meta_title);
        assert.equal(metadata.description, seoPage.meta_description);
        assert.equal(metadata.openGraph.title, seoPage.meta_title);
        assert.equal(metadata.twitter.description, seoPage.meta_description);
        seoPage = { ...seoPage, meta_title: '  ', meta_description: null };
        const fallback = await servicePage.generateMetadata({ params: Promise.resolve({ slug: 'slub' }) });
        assert.ok(fallback.title.includes('5900 zł'));
        assert.ok(fallback.description.includes('Aktywne pakiety od 5900 zł'));
        assert.equal(fallback.alternates.canonical, 'https://wlasniewski.pl/slub');
    });
    await check('actual service and homepage render CMS editorial text and all 14 gallery images in server HTML', async () => {
        for (const html of [renderToStaticMarkup(React.createElement(Renderer, { sections: editorialSections })),
            renderToStaticMarkup(React.createElement(HomeContent, homeProps(editorialSections)))]) {
            const dom = new window.DOMParser().parseFromString(html, 'text/html');
            assert.ok(dom.body.textContent.includes('Tekst redakcyjny z CMS'));
            assert.ok(dom.body.textContent.includes('Drugi tekst ślubny z CMS'));
            assert.equal([...dom.querySelectorAll('img')].filter(img => img.getAttribute('src')?.includes('test-gallery-')).length, 14);
        }
    });
    await check('homepage CMS saves and reloads promotion configuration through the real pages API', async () => {
        localStorage.setItem('admin_token', 'test');
        await mount(HomeAdmin, {});
        await click(button('Dodaj Aktualne promocje'));
        await set(field('Nagłówek promocji'), 'Promocje z panelu');
        await set(field('Opis modułu promocji'), 'Opis z panelu');
        await set(field('Tekst przycisku promocji'), 'Sprawdź mój pakiet');
        await click(button(/Zapisz zmiany/));
        const saved = JSON.parse(page.sections).find(section => section.type === 'active_promotions');
        assert.equal(saved.data.title, 'Promocje z panelu');
        assert.equal(saved.data.buttonText, 'Sprawdź mój pakiet');
        await reset(); await mount(HomeAdmin, {});
        assert.equal(field('Nagłówek promocji').value, 'Promocje z panelu');
        const html = renderToStaticMarkup(React.createElement(HomeContent, { ...homeProps([saved]),
            featuredPromotions: { 'Ślub': promotion, alias: promotion } }));
        const dom = new window.DOMParser().parseFromString(html, 'text/html');
        const module = dom.querySelector('[data-home-promotions]');
        assert.ok(module.textContent.includes('Promocje z panelu'));
        assert.equal(module.querySelectorAll('[data-promotion-id="91"]').length, 1);
        assert.match(module.textContent, /5\s?800 zł/);
        assert.match(module.textContent, /5\s?900 zł/);
        assert.ok(module.textContent.includes(promotion.legalText));
        assert.ok(module.textContent.includes('2099'));
        const href = new URL(module.querySelector('a').getAttribute('href'), 'http://localhost');
        assert.equal(href.searchParams.get('package_id'), '6');
        assert.equal(href.searchParams.get('service'), 'Ślub');
        assert.equal(href.searchParams.get('promotion_id'), '91');
    });
    await check('homepage shows honest empty copy for absent, ended and future discounts, and respects CMS visibility', async () => {
        const section = JSON.parse(page.sections).find(section => section.type === 'active_promotions');
        for (const [sections, featuredPromotions] of [
            [[section], {}], [[section], { x: { ...promotion, endsAt: '2020-01-02T00:00:00Z' } }],
            [[section], { x: { ...promotion, startsAt: '2098-01-01T00:00:00Z' } }],
            [[{ ...section, enabled: false }], { x: promotion }],
        ]) {
            const html = renderToStaticMarkup(React.createElement(HomeContent, { ...homeProps(sections), featuredPromotions }));
            if (sections[0].enabled === false) assert.ok(!html.includes('data-home-promotions'));
            else {
                assert.ok(html.includes('Aktualnie nie prowadzę promocji'));
                assert.ok(html.includes('Zobacz ofertę i pakiety'));
                assert.ok(!html.includes('data-promotion-id=\"91\"'));
            }
        }
    });
    await check('homepage distinguishes unavailable and unfeatured data and rejects an external empty CTA', async () => {
        const section = JSON.parse(page.sections).find(section => section.type === 'active_promotions');
        const { loadPublicPricingSnapshot } = require('../../src/lib/publicPackagePricing.ts');
        homepageActiveRows = [{ id: 91, package_id: 6, package_name: promotion.packageName, service_name: 'Ślub',
            show_on_home: false, starts_at: new Date(promotion.startsAt) }];
        const hiddenSnapshot = await loadPublicPricingSnapshot();
        assert.equal(hiddenSnapshot.hasActivePromotions, true);
        assert.equal(hiddenSnapshot.promotionsAvailable, true);
        assert.deepEqual(hiddenSnapshot.featuredPromotions, {});
        const hidden = renderToStaticMarkup(React.createElement(HomeContent, { ...homeProps([section]), ...hiddenSnapshot }));
        assert.ok(hidden.includes('Sprawdź aktualne ceny i pakiety'));
        assert.ok(!hidden.includes('Aktualnie nie prowadzę promocji'));
        homepageReadFailed = true;
        const failedSnapshot = await loadPublicPricingSnapshot();
        assert.equal(failedSnapshot.promotionsAvailable, false);
        const unavailable = renderToStaticMarkup(React.createElement(HomeContent, { ...homeProps([section]), ...failedSnapshot }));
        assert.ok(unavailable.includes('Nie mogę teraz potwierdzić promocji'));
        assert.ok(!unavailable.includes('Aktualnie nie prowadzę promocji'));
        homepageReadFailed = false; homepageActiveRows = [];
        const badLink = renderToStaticMarkup(React.createElement(HomeContent, { ...homeProps([{ ...section, data: { ...section.data, emptyButtonLink: '/\\example.com' } }]) }));
        const badLinkDom = new window.DOMParser().parseFromString(badLink, 'text/html');
        assert.equal(badLinkDom.querySelector('[data-home-promotions] a').getAttribute('href'), '/rezerwacja');
    });
    await check('package editor exposes server error/status and keeps edits available after failure', async () => {
        await reset(); await mount(PackageAdmin, {}); await click(button('Edytuj'));
        global.fetch = async (url, init) => url === '/api/packages'
            ? NextResponse.json({ error: 'Zakończ promocję przed zmianą ceny.', code: 'PACKAGE_PRICE_LOCKED_BY_PROMOTION' }, { status: 409 })
            : baseFetch(url, init);
        await click(button('Zapisz'));
        const alert = document.querySelector('[role="alert"]');
        assert.ok(alert.textContent.includes('Zakończ promocję'));
        assert.ok(alert.textContent.includes('HTTP 409'));
        assert.ok(alert.textContent.includes('PACKAGE_PRICE_LOCKED_BY_PROMOTION'));
        assert.ok(!button('Zapisz').disabled);
        assert.ok(document.querySelector('[contenteditable="true"]'));
    });
    await check('package save blocks a concurrent click and distinguishes committed save from failed reload', async () => {
        let resolveSave; let count = 0;
        global.fetch = async (url, init) => {
            if (url === '/api/packages') { count++; return new Promise(resolve => { resolveSave = resolve; }); }
            if (url.startsWith('/api/service-types')) throw new Error('Network failure after saved response');
            return baseFetch(url, init);
        };
        const save = button('Zapisz');
        await act(async () => save.dispatchEvent(new MouseEvent('click', { bubbles: true })));
        assert.ok(button('Zapisuję…').disabled);
        await act(async () => save.dispatchEvent(new MouseEvent('click', { bubbles: true })));
        assert.equal(count, 1);
        await act(async () => resolveSave(NextResponse.json({ success: true, package: pkg })));
        assert.ok(!document.querySelector('[contenteditable="true"]'));
        assert.ok(document.querySelector('[role="status"]').textContent.includes('Pakiet zapisany'));
        assert.ok(document.querySelector('[role="status"]').textContent.includes('odśwież'));
    });
    await reset();
    console.log(`${h.log.length} wedding/home CMS checks passed`);
})().catch(error => { console.error(error); process.exitCode = 1; });
