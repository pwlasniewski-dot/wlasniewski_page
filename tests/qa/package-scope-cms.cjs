// Exercise the existing package editor, real API save/read and customer render.
// All database methods are in-memory; this test never opens a database connection.
const h = require('./gallery-shop-dom.cjs');
const { assert, React, act, mount, reset, button, field, click, set, check } = h;
const Module = require('node:module');
const { renderToStaticMarkup } = require('react-dom/server');
const { NextRequest, NextResponse } = require('next/server');
const { DEFAULT_PHOTO_FUNNEL_CONFIG } = require('../../src/lib/marketing/photo-funnel.ts');
let adminAllowed = true;
let invalidations = 0;
let stored = {
    id: 1, service_id: 1, name: 'Rodzinny Start', hours: 1, price: 75000,
    subtitle: 'Godzina zdjęć', description: '<ol><li>35 gotowych zdjęć</li><li>Pendrive</li></ol>',
    features: '["do 50 zdjęć", "4 godziny"]', order: 1, is_active: true,
    available_hours: 'MON,TUE,WED,THU,FRI',
    blocks_entire_day: true,
};
const service = { id: 1, name: 'Sesja', order: 1, is_active: true };
const clone = value => JSON.parse(JSON.stringify(value));
const withService = () => ({ ...clone(stored), service });
const db = {
    package: {
        findMany: async () => [withService()],
        findUnique: async () => clone(stored),
        update: async ({ data }) => { stored = { ...stored, ...data }; return withService(); },
    },
    serviceType: { findMany: async () => [{ ...service, packages: [clone(stored)] }] },
    $queryRaw: async () => [{ acquired: 1 }],
    $transaction: async callback => callback(db),
};
const originalLoad = Module._load;
const analytics = { trackEvent: async () => {}, resetBookingFields: () => {} };
Module._load = function (request, parent, isMain) {
    if (request === '@/lib/db/prisma') return { __esModule: true, default: db };
    if (request === '@/lib/auth/middleware') return { requireAuth: async () => adminAllowed ? null : NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    if (request === 'next/cache') return { unstable_noStore: () => {}, unstable_cache: callback => callback, revalidateTag: () => { invalidations++; }, revalidatePath: () => {} };
    if (request === '@/lib/packagePromotions') return { loadActivePromotionsForPackages: async () => new Map(), loadFeaturedPromotionsByService: async () => ({}) };
    if (request === '@/components/admin/BookingAvailabilityEditor' || request === '@/components/PageRenderer' || request === '@/components/CityLeadForm' || request === '@/components/BookingCalendar' || request === '@/components/TestimonialsSection') return { __esModule: true, default: () => null };
    if (request === '@/hooks/useAnalytics') return { useAnalytics: () => analytics };
    if (request === '@/context/CartContext') return { useCart: () => ({ addItem: () => {} }) };
    if (request === 'framer-motion') return { motion: new Proxy({}, { get: (target, tag) => React.forwardRef(({ initial, animate, transition, exit, variants, whileHover, whileTap, ...props }, ref) => React.createElement(tag, { ...props, ref })) }) };
    if (request === '@/app/fotograf-[city]/page') return { __esModule: true, default: () => null, generateMetadata: async () => ({}) };
    if (request === '@/lib/seo/published-page') return { getPublishedPage: async () => ({ slug: 'sesja-rodzinna', title: 'Sesja rodzinna', sections: '[]', meta_title: null, meta_description: null }) };
    if (request === '@/lib/marketing/photo-funnel.server') return { loadPhotoFunnelConfig: async () => DEFAULT_PHOTO_FUNNEL_CONFIG };
    return originalLoad.apply(this, arguments);
};
document.execCommand = () => false;
document.queryCommandState = () => false;
document.queryCommandValue = () => '';

const packageApi = require('../../src/app/api/packages/route.ts');
const serviceApi = require('../../src/app/api/service-types/route.ts');
const Admin = require('../../src/app/admin/rezerwacja/page.tsx').default;
const PublicPage = require('../../src/app/[slug]/page.tsx').default;
const Booking = require('../../src/app/rezerwacja/page.tsx').default;
const Scope = require('../../src/components/booking/PackageScope.tsx').default;
global.fetch = async (url, init = {}) => {
    const request = new NextRequest(`http://localhost${url}`, init);
    if (url.includes('/api/service-types')) return serviceApi.GET(request);
    if (url === '/api/packages') return init.method === 'POST' ? packageApi.POST(request) : packageApi.GET(request);
    if (url === '/api/booking/drone-catalog') return NextResponse.json({ packages: [], areas: [] });
    if (url === '/api/settings/public') return NextResponse.json({ settings: { photo_funnel_config: DEFAULT_PHOTO_FUNNEL_CONFIG } });
    if (url === '/api/pages?slug=rezerwacja') return NextResponse.json({ success: true, page: null });
    throw new Error(`Unexpected request ${url}`);
};
const request = body => new NextRequest('http://localhost/api/packages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

(async () => {
    await check('package save denies access and invalid duration before any mutation', async () => {
        const before = clone(stored);
        const { available_hours, ...editable } = stored;
        adminAllowed = false;
        assert.equal((await packageApi.POST(request({ ...stored, features: '[]' }))).status, 401);
        adminAllowed = true;
        assert.equal((await packageApi.POST(request({ ...editable, hours: 25 }))).status, 400);
        assert.equal((await packageApi.POST(request({ ...editable, available_hours: '24' }))).status, 400);
        assert.deepEqual(stored, before);
    });
    await check('API preserves omitted availability, accepts null/blank and validates explicit hour lists', async () => {
        const before = clone(stored);
        const { available_hours, ...editable } = stored;
        for (const [input, expected] of [[null, null], ['', null], [' 18,9,09,18 ', '9,18']]) {
            assert.equal((await packageApi.POST(request({ ...editable, available_hours: input }))).status, 200);
            assert.equal(stored.available_hours, expected);
        }
        const current = clone(stored);
        assert.equal((await packageApi.POST(request({ ...editable, available_hours: 'MON,TUE' }))).status, 400);
        assert.deepEqual(clone(stored), current);
        assert.equal((await packageApi.POST(request(editable))).status, 200);
        assert.equal(stored.available_hours, '9,18');
        stored = before;
    });
    await check('existing admin saves full scope, reloads it, and public offer keeps scope, price and CTA', async () => {
        await mount(Admin, {});
        await click(button('Edytuj'));
        const editor = document.querySelector('[contenteditable="true"]');
        assert.ok(editor);
        const description = '<div>35 gotowych zdjęć</div><div>Pendrive z materiałem</div><div>Album 20×20 cm</div>';
        await act(async () => {
            editor.innerHTML = description;
            editor.dispatchEvent(new Event('input', { bubbles: true }));
        });
        const fallback = field('Zakres, gdy opis pełny jest pusty');
        await set(fallback, 'Do 50 zdjęć\n');
        assert.equal(fallback.value, 'Do 50 zdjęć\n');
        await set(fallback, 'Do 50 zdjęć\n4 godziny');
        await click(button('Zapisz'));
        assert.equal(stored.description, description);
        assert.equal(stored.price, 75000);
        assert.equal(stored.hours, 1);
        assert.equal(stored.available_hours, 'MON,TUE,WED,THU,FRI');
        assert.equal(stored.blocks_entire_day, true);
        assert.ok(invalidations > 0);
        await click(button('Edytuj'));
        assert.equal(field('Zakres, gdy opis pełny jest pusty').value, 'Do 50 zdjęć\n4 godziny');
        assert.equal(document.querySelector('[contenteditable="true"]').innerHTML, description);
        const publicRead = await (await packageApi.GET(new NextRequest('http://localhost/api/packages'))).json();
        const bookingRead = await (await serviceApi.GET(new NextRequest('http://localhost/api/service-types'))).json();
        assert.deepEqual(publicRead.packages[0], { ...bookingRead.serviceTypes[0].packages[0], service });
        const offerHtml = renderToStaticMarkup(await PublicPage({ params: Promise.resolve({ slug: 'sesja-rodzinna' }) }));
        const bookingScope = renderToStaticMarkup(React.createElement(Scope, bookingRead.serviceTypes[0].packages[0]));
        for (const text of ['35 gotowych zdjęć', 'Pendrive z materiałem', 'Album 20×20 cm']) {
            assert.ok(offerHtml.includes(text));
            assert.ok(bookingScope.includes(text));
        }
        assert.ok(offerHtml.includes('750 zł'));
        assert.ok(offerHtml.includes('package_id=1'));
        assert.ok(offerHtml.includes('1 godzina fotografowania'));
        assert.ok(!offerHtml.includes('Do 50 zdjęć'));
        assert.ok(!bookingScope.includes('4 godziny'));
    });
    await check('actual booking page shows the same complete scope and current price after admin save', async () => {
        await reset();
        window.history.replaceState({}, '', '/rezerwacja?service=Sesja&package_id=1');
        await mount(Booking, {});
        const card = document.querySelector('[data-analytics="package_select"]');
        assert.ok(card);
        for (const text of ['35 gotowych zdjęć', 'Pendrive z materiałem', 'Album 20×20 cm', '750 zł', '1 godzina']) assert.ok(card.textContent.includes(text));
        assert.equal(card.getAttribute('aria-pressed'), 'true');
        assert.ok(!card.textContent.includes('Do 50 zdjęć'));
        assert.ok(!card.textContent.includes('4 godziny'));
    });
    await check('blank full scope uses edited fallback and repeated save preserves the price', async () => {
        stored.description = '';
        await reset();
        await mount(Admin, {});
        await click(button('Edytuj'));
        await set(field('Zakres, gdy opis pełny jest pusty'), '35 gotowych zdjęć\nPendrive');
        await click(button('Zapisz'));
        const { available_hours, ...editable } = stored;
        for (let round = 0; round < 2; round++) assert.equal((await packageApi.POST(request(editable))).status, 200);
        const html = renderToStaticMarkup(await PublicPage({ params: Promise.resolve({ slug: 'sesja-rodzinna' }) }));
        assert.ok(html.includes('35 gotowych zdjęć'));
        assert.ok(html.includes('Pendrive'));
        assert.equal(stored.price, 75000);
    });
    await check('public offer structured data and visible scope remain safe with encoded markup', async () => {
        stored.description = '<p>&lt;/script&gt;&lt;script&gt;test&lt;/script&gt;</p>';
        const html = renderToStaticMarkup(await PublicPage({ params: Promise.resolve({ slug: 'sesja-rodzinna' }) }));
        const schema = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1];
        assert.ok(!schema.includes('</script>'));
        assert.equal(JSON.parse(schema).offers[0].description, '1 godzina. </script><script>test</script>');
        assert.ok(html.includes('&lt;/script&gt;&lt;script&gt;test&lt;/script&gt;'));
    });
    await reset();
    console.log(`${h.log.length} package CMS checks passed`);
})().catch(error => { console.error(error); process.exitCode = 1; });
