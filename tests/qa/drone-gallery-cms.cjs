// Real drone editor -> authenticated Pages API -> CMS read -> public renderer.
// Only transport, authentication identity, media picker and database are replaced.
const h = require('./gallery-shop-dom.cjs');
const { assert, React, mount, reset, field, set, click, button, check, act } = h;
const Module = require('node:module');
const { NextRequest, NextResponse } = require('next/server');
const { renderToStaticMarkup } = require('react-dom/server');
require.extensions['.css'] = mod => { mod.exports = new Proxy({}, { get: (_, key) => String(key) }); };
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
const clone = value => JSON.parse(JSON.stringify(value));
const { DEFAULT_DRONE_PHOTOGRAPHY_CONFIG, parseDronePhotographyConfig } = require('../../src/lib/dronePhotographyOffer.ts');
let page = { id: 49, slug: 'fotografia-z-drona', title: 'Dron QA', is_published: true, sections: JSON.stringify(DEFAULT_DRONE_PHOTOGRAPHY_CONFIG) };
let allowed = true, writes = 0;
const db = { page: { findFirst: async () => clone(page), findUnique: async () => clone(page), update: async ({ data }) => { writes++; page = { ...page, ...clone(data) }; return clone(page); } }, $transaction: async fn => fn(db) };
const original = Module._load;
Module._load = function(name) {
    if (name === 'server-only') return {};
    if (name === '@/lib/db/prisma') return { __esModule: true, default: db };
    if (name === '@/lib/auth/middleware') return { requireAuth: async () => allowed ? null : NextResponse.json({}, { status: 401 }), withAuth: async (request, fn) => allowed ? fn(request) : NextResponse.json({}, { status: 401 }) };
    if (name === 'next/cache') return { revalidatePath() {} };
    if (name === '@/lib/analytics/pagePublicationRegistry') return { preserveFirstPublication: async () => {}, publicationRegistryIdentity: () => ({}) };
    if (name === '@/components/admin/MediaPicker') return { __esModule: true, default: () => null };
    if (name === 'next/dynamic') return { __esModule: true, default: () => () => null };
    return original.apply(this, arguments);
};
const Editor = require('../../src/components/admin/DronePhotographyPageEditor.tsx').default;
const Landing = require('../../src/components/DronePhotographyLanding.tsx').default;
const Gallery = require('../../src/components/DronePhotoGallery.tsx').default;
const api = require('../../src/app/api/pages/route.ts');
const { loadDronePhotographyCmsPage } = require('../../src/lib/dronePhotographyCms.ts');
const request = body => new NextRequest('http://localhost/api/pages', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test' }, body: JSON.stringify(body) });
let saveStatus;
function AdminHarness() {
    const [config, update] = React.useState(() => parseDronePhotographyConfig(page.sections));
    return React.createElement(React.Fragment, null, React.createElement(Editor, { value: config, onChange: update }),
        React.createElement('button', { onClick: async () => { saveStatus = (await api.POST(request({ ...page, sections: JSON.stringify(config) }))).status; } }, 'Zapisz QA'));
}
const photo = (id, caption) => ({ id, url: `/images/${id}.webp`, alt: `Alt ${id}`, caption });
(async () => {
    await check('old CMS retains media, prices, ordering and grid layout', async () => {
        const config = clone(DEFAULT_DRONE_PHOTOGRAPHY_CONFIG);
        const gallery = config.modules.find(m => m.type === 'portfolio');
        gallery.source = 'manual'; gallery.images = [photo('one', 'Poranek'), photo('two', 'Wieczór')];
        page.sections = JSON.stringify(config);
        const read = parseDronePhotographyConfig(page.sections);
        assert.equal(read.modules.find(m => m.type === 'portfolio').layout, 'grid');
        assert.deepEqual(read.packages, parseDronePhotographyConfig(DEFAULT_DRONE_PHOTOGRAPHY_CONFIG).packages);
        const html = renderToStaticMarkup(React.createElement(Landing, { config: read, portfolioByCategory: {} }));
        assert.ok(html.includes('Poranek') && html.includes('/images/one.webp'));
    });
    await check('actual editor saves carousel, caption, mobile crop and contain through Pages API', async () => {
        await mount(AdminHarness, {});
        await set(field('Układ galerii'), 'carousel'); await set(field('Opis galerii'), 'Prawdziwe kadry z archiwum');
        await set(field('Kadrowanie'), 'contain'); await set(field('Podpis zdjęcia 1'), 'Światło nad miastem');
        await set(field('Kadr telefon 1'), 'left'); await click(button('Zapisz QA'));
        assert.equal(saveStatus, 200); assert.equal(writes, 1);
        const result = await loadDronePhotographyCmsPage();
        const gallery = result.config.modules.find(m => m.type === 'portfolio');
        assert.equal(gallery.layout, 'carousel'); assert.equal(gallery.images[0].mobilePosition, 'left');
        await reset(); await mount(AdminHarness, {}); assert.equal(field('Układ galerii').value, 'carousel');
        const html = renderToStaticMarkup(React.createElement(Landing, { config: result.config, portfolioByCategory: {} }));
        assert.ok(html.includes('data-drone-gallery="carousel"') && html.includes('Światło nad miastem') && html.includes('object-fit:contain'));
    });
    await check('mosaic, panorama, hide, duplicate and order survive storage roundtrip', async () => {
        await click(button('Panorama / parallax')); await click(button('Mozaika zdjęć'));
        await click(button('Zapisz QA')); assert.equal(saveStatus, 200);
        const config = parseDronePhotographyConfig(page.sections);
        const gallery = config.modules.find(m => m.type === 'portfolio');
        const panorama = config.modules.find(m => m.layout === 'parallax'); panorama.images = [photo('wide', 'Panorama')]; panorama.motion = true;
        const mosaic = config.modules.find(m => m.layout === 'mosaic'); mosaic.images = [photo('collage', 'Kolaż')];
        config.modules.unshift({ ...gallery, id: 'hidden-copy', enabled: false, title: 'UKRYTA' });
        assert.equal((await api.POST(request({ ...page, sections: JSON.stringify(config) }))).status, 200);
        const { config: read } = await loadDronePhotographyCmsPage();
        const html = renderToStaticMarkup(React.createElement(Landing, { config: read, portfolioByCategory: {} }));
        assert.ok(html.includes('data-drone-gallery="parallax"') && html.includes('data-drone-gallery="mosaic"'));
        assert.ok(!html.includes('UKRYTA')); assert.equal(read.modules[0].id, 'hidden-copy');
    });
    await check('unauthorized and malformed media changes never write', async () => {
        const before = writes; allowed = false; assert.equal((await api.POST(request(page))).status, 401); allowed = true;
        for (const patch of [{ layout: 'unknown' }, { limit: 999 }, { images: [{ id: 'bad', url: 'javascript:alert(1)', alt: '' }] }, { images: [{ id: 'bad', url: '/x', alt: '', mobilePosition: 'expression(x)' }] }]) {
            const config = parseDronePhotographyConfig(page.sections); Object.assign(config.modules.find(m => m.type === 'portfolio'), patch);
            assert.equal((await api.POST(request({ ...page, sections: JSON.stringify(config) }))).status, 400);
        }
        assert.equal(writes, before);
    });
    await check('carousel arrows use its own rail and respect reduced motion', async () => {
        await reset();
        const module = { ...parseDronePhotographyConfig(page.sections).modules.find(m => m.type === 'portfolio'), layout: 'carousel' };
        await mount(Gallery, { module, photos: [{ src: '/one.webp', alt: 'One' }, { src: '/two.webp', alt: 'Two' }] });
        const rail = document.querySelector('[aria-roledescription="karuzela"]'); let scroll;
        Object.defineProperty(rail, 'offsetLeft', { value: 32 }); Object.defineProperty(rail.children[1], 'offsetLeft', { value: 400 });
        rail.scrollTo = value => { scroll = value; rail.scrollLeft = value.left; rail.dispatchEvent(new Event('scroll')); };
        window.matchMedia = () => ({ matches: true });
        await click(document.querySelector('[aria-label="Następny kadr"]')); assert.equal(scroll.left, 400); assert.equal(scroll.behavior, 'auto');
        assert.equal(document.querySelector('[aria-label="Następny kadr"]').disabled, true);
        await click(document.querySelector('[aria-label="Poprzedni kadr"]')); assert.equal(scroll.left, 0);
    });
    await reset(); console.log(`${h.log.length} drone gallery checks PASS`);
})().catch(error => { console.error(error); process.exitCode = 1; });
