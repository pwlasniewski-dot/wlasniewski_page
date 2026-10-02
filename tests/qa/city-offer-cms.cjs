// Actual existing page editor, Pages API and public city/service render. No network/DB.
const h = require('./gallery-shop-dom.cjs');
const { assert, React, act, mount, reset, button, field, click, set, check } = h;
const Module = require('node:module');
const { renderToStaticMarkup } = require('react-dom/server');
const { ImageConfigContext } = require('next/dist/shared/lib/image-config-context.shared-runtime');
const { imageConfigDefault } = require('next/dist/shared/lib/image-config');
let imageConfig;
const serverHtml = node => renderToStaticMarkup(React.createElement(ImageConfigContext.Provider, { value: imageConfig }, node));
const { NextRequest, NextResponse } = require('next/server');
const clone = value => JSON.parse(JSON.stringify(value));
const inventory = require('../fixtures/city-cms-pages.json');
let pages = clone(inventory);
pages.push(...['slub', 'sesja-rodzinna'].map((slug, i) => ({ id: 200+i, slug, title: slug, content: '', sections: '[]', is_published: true }))); 
let authAllowed = true, readFailure = false, packagesFailure = false, writes = 0;
const packages = [
    { id: 4, name: 'Ceremonia', service: { name: 'Ślub', is_active: true }, hours: 2, price: 190000, subtitle: 'Zakres z CMS', description: '<p>80 zdjęć</p><p>Pendrive</p>', features: '["20 zdjęć"]', is_active: true },
    { id: 1, name: 'Rodzinny Start', service: { name: 'Sesja', is_active: true }, hours: 1, price: 75000, description: '<p>35 zdjęć</p><p>Galeria</p>', features: '[]', is_active: true },
    { id: 10, name: 'Urodzinowy reportaż', service: { name: 'Urodziny', is_active: true }, hours: 3, price: 110000, description: '<p>Tort i portrety gości</p>', features: '["80 zdjęć"]', is_active: true },
    { id: 7, name: 'Kameralne przyjęcie', service: { name: 'Przyjęcie', is_active: true }, hours: 3, price: 150000, description: '<p>Zakres przyjęcia z CMS</p>', features: '[]', is_active: true },
];
const selectPage = where => pages.find(page => where.id ? page.id === where.id : page.slug.toLowerCase() === String(where.slug?.equals || where.slug).toLowerCase());
const db = {
    page: {
        findFirst: async ({ where }) => { if (readFailure) throw new Error('Synthetic CMS outage'); const page = selectPage(where); return page && (where.is_published === undefined || page.is_published === where.is_published) ? clone(page) : null; },
        findUnique: async ({ where }) => clone(selectPage(where)),
        update: async ({ where, data }) => { writes++; const page = selectPage(where); Object.assign(page, data); return clone(page); },
    },
    package: { findMany: async ({ where } = {}) => { if (packagesFailure) throw new Error('Synthetic package outage'); return clone(packages.filter(pkg => !where?.service?.name || pkg.service.name === where.service.name)); } },
    $transaction: async callback => callback(db),
};
const original = Module._load;
Module._load = function(request, parent, isMain) {
    if (request === '@/lib/db/prisma') return { __esModule: true, default: db };
    if (request === 'next/cache') return { unstable_noStore: () => {}, unstable_cache: callback => callback, revalidatePath: () => {}, revalidateTag: () => {} };
    if (request === 'next/navigation') return { useRouter: () => ({ push: () => {} }), useSearchParams: () => new URLSearchParams(), notFound: () => { throw new Error('NEXT_NOT_FOUND'); }, permanentRedirect: () => { throw new Error('NEXT_REDIRECT'); } };
    if (request === '@/lib/auth/middleware') return { requireAuth: async () => authAllowed ? null : NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), withAuth: async (request, fn) => authAllowed ? fn(request) : NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    if (request === '@/lib/analytics/pagePublicationRegistry') return { preserveFirstPublication: async () => {}, publicationRegistryIdentity: () => ({}) };
    if (request === '@/lib/packagePromotions') return { loadActivePromotionsForPackages: async () => new Map(), loadHomepagePromotionState: async () => ({ featuredPromotions: {}, hasActivePromotions: false }) };
    if (request === '@/lib/marketing/photo-funnel.server') return { loadCachedPhotoFunnelConfig: async () => require('../../src/lib/marketing/photo-funnel.ts').DEFAULT_PHOTO_FUNNEL_CONFIG, loadPhotoFunnelConfig: async () => require('../../src/lib/marketing/photo-funnel.ts').DEFAULT_PHOTO_FUNNEL_CONFIG };
    if (request === '@/components/CityLeadSection') return { __esModule: true, default: async props => React.createElement('section', { id: 'szybki-kontakt', 'data-inquiry-city': props.city }, 'Existing inquiry') };
    if (request === '@/components/admin/MediaPicker' || request === './MediaPicker') return { __esModule: true, default: props => props.isOpen ? React.createElement('button', { type: 'button', onClick: () => props.onSelect('/images/cms-city.webp') }, 'Wybierz testowe zdjęcie') : null };
    if ([ '@/components/CityLeadForm', '@/components/PhotoChallengeBanner'].includes(request)) return { __esModule: true, default: () => null };
    if (request === '@/hooks/useAnalytics') return { useAnalytics: () => ({ trackEvent: () => {} }) };
    return original.apply(this, arguments);
};
document.execCommand = () => false; document.queryCommandState = () => false; document.queryCommandValue = () => '';
const Admin = require('../../src/app/admin/pages/[slug]/page.tsx').default;
const api = require('../../src/app/api/pages/route.ts');
const cityPage = require('../../src/app/fotograf-[city]/page.tsx');
const publicPage = require('../../src/app/[slug]/page.tsx');
const helpers = require('../../src/lib/cityLanding.ts');
global.fetch = async (url, init = {}) => {
    const request = new NextRequest(`http://localhost${url}`, init);
    if (url.startsWith('/api/pages')) return init.method === 'POST' ? api.POST(request) : api.GET(request);
    throw new Error(`Unexpected external fetch ${url}`);
};
const request = (body, auth = true) => new NextRequest('http://localhost/api/pages', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: 'Bearer test' } : {}) }, body: JSON.stringify(body) });
const render = async slug => serverHtml(await publicPage.default({ params: Promise.resolve({ slug }) }));
const dom = html => new window.DOMParser().parseFromString(html, 'text/html');
const schema = (html, type) => [...dom(html).querySelectorAll('script[type="application/ld+json"]')].map(node => JSON.parse(node.textContent)).find(value => value['@type'] === type);
const saveButton = () => [...document.querySelectorAll('button')].find(node => node.textContent.trim() === 'Zapisz zmiany');

(async () => {
    imageConfig = { ...imageConfigDefault, ...(await import('../../next.config.mjs')).default.images };
    await check('explicit empty city stays empty without old promises; starter requires an editor action', async () => {
        const initial = clone(pages.find(page => page.slug === 'fotograf-chelmno'));
        const html = await render(initial.slug);
        assert.ok(!html.includes('20 zdjęć')); assert.ok(!html.includes('10 dni')); assert.ok(!html.includes('dojazd'));
        assert.ok(!html.includes('data-cms-public-packages')); assert.equal(writes, 0);
        localStorage.setItem('admin_token', 'test'); await mount(Admin, { params: Promise.resolve({ slug: initial.slug }) });
        assert.ok(document.body.textContent.includes('Dodaj pierwszą sekcję')); assert.equal(writes, 0);
        await click(button('Dodaj brakujące moduły miejskie'));
        assert.ok(field('Nagłówek FAQ')); assert.ok(field('Nagłówek pakietów')); assert.equal(writes, 0);
    });
    await check('actual CMS saves FAQ, package selector, SEO, CTA and media and renders the same data', async () => {
        await set(field('Pytanie FAQ 1'), 'Pytanie właściciela'); await set(field('Odpowiedź FAQ 1'), 'Odpowiedź z CMS <img src=x onerror=test>');
        await set(field('Nagłówek pakietów'), 'Pakiety z mojego CMS');
        await set(field('Tekst CTA pakietu'), 'Wybieram konkretny zakres');
        await set(field('Adres CTA pakietu'), '/rezerwacja?source=editable-city-cms');
        await set(field('Ścieżka canonical'), '/fotograf-chelmno');
        await set(field('Tytuł Open Graph'), 'Społecznościowy tytuł z CMS');
        await set(field('Zdjęcie Open Graph'), '/images/cms-social.webp');
        await set(field('ALT zdjęcia Open Graph'), 'Opis obrazu CMS');
        const heroAlt = document.querySelector('[aria-label^="ALT zdjęcia city-hero-"]');
        await set(heroAlt, 'Autorski opis zdjęcia');
        const heroImageButton = [...document.querySelectorAll('button')].find(node => node.textContent.trim() === 'Zmień');
        await click(heroImageButton); await click(button('Wybierz testowe zdjęcie'));
        await click(saveButton());
        assert.equal(writes, 1);
        await reset(); await mount(Admin, { params: Promise.resolve({ slug: 'fotograf-chelmno' }) });
        assert.equal(field('Pytanie FAQ 1').value, 'Pytanie właściciela');
        assert.equal(field('Nagłówek pakietów').value, 'Pakiety z mojego CMS');
        const html = await render('fotograf-chelmno'), parsed = dom(html);
        assert.ok(parsed.body.textContent.includes('Odpowiedź z CMS'));
        assert.ok(!parsed.querySelector('img[onerror]'));
        assert.ok(parsed.querySelector('img[src="/images/cms-city.webp"][alt="Autorski opis zdjęcia"]'));
        assert.ok(parsed.querySelector('[data-inquiry-city="Chełmno"]'));
        const card = parsed.querySelector('[data-cms-public-packages] [data-package-id="4"]');
        assert.ok(card.textContent.includes('80 zdjęć')); assert.ok(card.textContent.includes('Pendrive'));
        assert.ok(card.textContent.includes('2 godziny')); assert.match(card.textContent, /1\s?900 zł/);
        assert.ok(!card.textContent.includes('20 zdjęć'));
        const href = new URL(card.querySelector('a').getAttribute('href'), 'http://localhost');
        assert.equal(href.searchParams.get('city'), 'Chełmno'); assert.equal(href.searchParams.get('package_id'), '4');
        assert.equal(href.searchParams.get('service'), 'Ślub'); assert.equal(href.searchParams.get('source'), 'editable-city-cms');
        const faq = schema(html, 'FAQPage');
        assert.equal(faq.mainEntity[0].name, 'Pytanie właściciela');
        assert.equal(faq.mainEntity[0].acceptedAnswer.text, parsed.querySelector('[data-cms-faq] details p').textContent);
        const offers = schema(html, 'Service').offers;
        assert.equal(offers.find(offer => offer.name === 'Ceremonia').price, 1900);
        assert.ok(offers.find(offer => offer.name === 'Ceremonia').description.includes('Pendrive'));
        const metadata = await publicPage.generateMetadata({ params: Promise.resolve({ slug: 'fotograf-chelmno' }) });
        assert.equal(metadata.title, pages.find(page => page.slug === 'fotograf-chelmno').meta_title);
        assert.equal(metadata.openGraph.title, 'Społecznościowy tytuł z CMS');
        assert.equal(metadata.openGraph.images[0].url, '/images/cms-social.webp');
        assert.equal(metadata.openGraph.images[0].alt, 'Opis obrazu CMS');
        assert.equal(metadata.twitter.images[0], '/images/cms-social.webp');
        assert.equal(metadata.alternates.canonical, 'https://wlasniewski.pl/fotograf-chelmno');
    });
    await check('existing Toruń modules and media survive an explicit starter addition and API roundtrip', async () => {
        await reset(); const before = clone(pages.find(page => page.slug === 'fotograf-torun'));
        const oldSections = JSON.parse(before.sections);
        await mount(Admin, { params: Promise.resolve({ slug: before.slug }) });
        await click(button('Dodaj brakujące moduły miejskie')); await click(saveButton());
        const saved = JSON.parse(pages.find(page => page.slug === before.slug).sections);
        assert.deepEqual(saved.slice(0, oldSections.length), oldSections);
        assert.ok(saved.some(section => section.type === 'public_packages')); assert.ok(saved.some(section => section.type === 'faq'));
        const html = await render(before.slug);
        const gallery = oldSections.find(section => section.type === 'masonry_gallery');
        for (const image of gallery.images) assert.ok([...dom(html).querySelectorAll('img')].some(node => decodeURIComponent(node.getAttribute('src')).includes(image)));
    });
    await check('auth, draft publication and invalid city data fail before any write or public draft render', async () => {
        const page = clone(pages.find(page => page.slug === 'fotograf-chelmno')), count = writes;
        authAllowed = false;
        assert.equal((await api.POST(request(page, false))).status, 401); assert.equal(writes, count);
        authAllowed = true;
        for (const sections of ['broken JSON', JSON.stringify([{ id: 'x', type: 'public_packages', serviceNames: ['Fake service'] }]),
            JSON.stringify([{ id: 'x', type: 'city_seo', canonicalPath: '/\\evil.example' }])]) {
            assert.equal((await api.POST(request({ ...page, sections }))).status, 400); assert.equal(writes, count);
        }
        assert.equal((await api.POST(request({ ...page, slug: 'spoofed-slug', page_type: 'regular', sections: 'bad JSON' }))).status, 400); assert.equal(writes, count);
        pages.find(row => row.slug === page.slug).is_published = false;
        const publicGet = await api.GET(new NextRequest(`http://localhost/api/pages?slug=${page.slug}`)); assert.equal(publicGet.status, 404);
        await assert.rejects(() => render(page.slug), /NEXT_NOT_FOUND/);
        await assert.rejects(() => publicPage.generateMetadata({ params: Promise.resolve({ slug: page.slug }) }), /NEXT_NOT_FOUND/);
        pages.find(row => row.slug === page.slug).is_published = true;
    });
    await check('hidden modules and FAQ items stay hidden in HTML/schema without fallback resurrection', async () => {
        const page = pages.find(row => row.slug === 'fotograf-chelmno');
        const backup = page.sections;
        const sections = JSON.parse(backup);
        sections.find(section => section.type === 'public_packages').enabled = false;
        sections.find(section => section.type === 'city_inquiry').enabled = false;
        sections.find(section => section.type === 'faq').faqItems[0].enabled = false;
        page.sections = JSON.stringify(sections);
        const html = await render(page.slug);
        assert.ok(!html.includes('data-cms-public-packages')); assert.ok(!html.includes('data-inquiry-city'));
        assert.ok(!html.includes('Pytanie właściciela')); assert.equal(schema(html, 'Service').offers.length, 0);
        assert.ok(!schema(html, 'FAQPage').mainEntity.some(item => item.name === 'Pytanie właściciela'));
        assert.ok(!html.includes('20 zdjęć')); assert.ok(!html.includes('10 dni')); page.sections = backup;
    });
    await check('CMS/catalog failure keeps a safe editable fallback and never fabricates scope or amount', async () => {
        packagesFailure = true; let html = await render('fotograf-chelmno');
        assert.ok(html.includes('Nie mogę teraz wyświetlić pakietów')); assert.equal(schema(html, 'Service').offers.length, 0);
        assert.ok(!html.includes('1 900 zł')); assert.ok(!html.includes('20 zdjęć'));
        packagesFailure = false; readFailure = true; html = await render('fotograf-chelmno');
        assert.ok(html.includes('Rynek')); assert.ok(!html.includes('10 dni')); assert.ok(!html.includes('dojazd wliczony'));
        readFailure = false;
    });
    await check('all eight city contexts reach wedding/family/birthday booking and inquiry unchanged', async () => {
        for (const city of helpers.CITY_NAMES) {
            const href = helpers.cityContextLink('/rezerwacja', city, 'city-package', 'Ślub', 4);
            const url = new URL(href, 'http://localhost'); assert.equal(url.searchParams.get('city'), city);
            for (const slug of ['slub', 'sesja-rodzinna', 'twoje-urodziny']) {
                const service = slug === 'slub' ? 'Ślub' : slug === 'twoje-urodziny' ? 'Urodziny' : 'Sesja';
                const rendered = dom(serverHtml(await publicPage.default({ params: Promise.resolve({ slug }), searchParams: Promise.resolve({ city }) })));
                const booking = [...rendered.querySelectorAll('a')].find(node => node.getAttribute('href')?.includes('package_id='));
                const target = new URL(booking.getAttribute('href'), 'http://localhost');
                assert.equal(target.searchParams.get('city'), city); assert.equal(target.searchParams.get('service'), service);
                const inquiry = [...rendered.querySelectorAll('a')].find(node => node.getAttribute('href')?.includes('package_slug='));
                assert.equal(new URL(inquiry.getAttribute('href'), 'http://localhost').searchParams.get('city'), city);
            }
        }
    });
    await check('birthday offer uses birthday packages/CTA and preserves real saved galleries', async () => {
        const html = await render('twoje-urodziny'), parsed = dom(html);
        assert.ok(parsed.body.textContent.includes('Urodzinowy reportaż')); assert.ok(parsed.body.textContent.includes('Tort i portrety gości'));
        assert.ok(!parsed.body.textContent.includes('Rodzinny Start')); assert.ok(!parsed.body.textContent.includes('80 zdjęć'));
        const link = [...parsed.querySelectorAll('a')].find(node => node.getAttribute('href')?.includes('package_id=10'));
        assert.equal(new URL(link.getAttribute('href'), 'http://localhost').searchParams.get('service'), 'Urodziny');
        const before = clone(pages.find(page => page.slug === 'twoje-urodziny'));
        await reset(); await mount(Admin, { params: Promise.resolve({ slug: before.slug }) });
        await click(button('Dodaj pakiety urodzinowe')); await click(saveButton());
        assert.deepEqual(JSON.parse(pages.find(page => page.slug === before.slug).sections).slice(0, 4), JSON.parse(before.sections));
        const withModule = await render(before.slug); assert.ok(withModule.includes('data-cms-public-packages'));
        assert.ok(withModule.includes('Urodzinowy reportaż')); assert.ok(!withModule.includes('Rodzinny Start'));
        const birthday = pages.find(page => page.slug === before.slug);
        const hidden = JSON.parse(birthday.sections); hidden.find(section => section.type === 'public_packages').enabled = false;
        birthday.sections = JSON.stringify(hidden);
        const noPackages = await render(before.slug); assert.ok(!noPackages.includes('data-cms-public-packages'));
        assert.ok(!noPackages.includes('Urodzinowy reportaż')); assert.equal(schema(noPackages, 'Service').offers, undefined);
    });

    await reset(); console.log(`${h.log.length} city CMS checks passed`);
})().catch(error => { console.error(error); process.exitCode = 1; });
