// Actual booking/cart/checkout/history against memory CMS and payment/email stubs.
// No external database, payment or email transport is used.
const h = require('./gallery-shop-dom.cjs');
const { assert, React, act, mount, reset, check, click, set, button } = h;
const Module = require('node:module');
const clone = value => JSON.parse(JSON.stringify(value));
const { DEFAULT_DRONE_PHOTOGRAPHY_CONFIG } = require('../../src/lib/dronePhotographyOffer.ts');
const { DEFAULT_PHOTO_FUNNEL_CONFIG } = require('../../src/lib/marketing/photo-funnel.ts');
const { dronePackageScopeLines } = require('../../src/lib/dronePhotographyScope.ts');
let config = clone(DEFAULT_DRONE_PHOTOGRAPHY_CONFIG);
config.packages.find(item => item.bookingMode === 'addon').name = 'Ujęcia z drona do reportażu';
const pkg = { id: 12, service_id: 4, name: 'Reportaż testowy', hours: 3, price: 50000,
    description: '<p>Zakres reportażu przyjęty w koszyku</p>', features: '[]', order: 0, is_active: true,
    service: { id: 4, name: 'Urodziny', is_active: true } };
const bookings = [], sent = [], payu = [];
let cart = [];
const db = {
    setting: { findFirst: async () => ({ booking_min_days_ahead: 7 }) },
    user: { findUnique: async () => ({ id: 7 }) }, package: { findFirst: async () => clone(pkg) },
    booking: { findMany: async () => [], create: async ({ data }) => { const row = { id: bookings.length + 1, ...clone(data) }; bookings.push(row); return clone(row); }, updateMany: async () => ({ count: 1 }) },
    $queryRaw: async () => [{ acquired: 1 }], $transaction: async callback => callback(db),
};
const originalLoad = Module._load;
const analytics = { trackEvent: async () => {}, resetBookingFields: () => {} };
Module._load = function(request, parent, isMain) {
    if (request === 'server-only') return {};
    if (request === '@/lib/db/prisma') return { __esModule: true, default: db };
    if (request === '@/lib/dronePhotographyCms') return { loadDronePhotographyCmsPage: async () => ({ config: clone(config), fromCms: true }) };
    if (request === '@/lib/rate-limit') return { rateLimit: () => ({ ok: true }), getClientIp: () => '127.0.0.1' };
    if (request === '@/lib/logger') return { logSystem: async () => {} };
    if (request === '@/lib/packagePromotions') return { loadActivePromotionForPackage: async () => null };
    if (request === '@/lib/bookingScheduleRepository') return { loadBookingScheduleConfiguration: async ({ service }) => ({ rules: require('../../src/lib/bookingSchedule.ts').defaultBookingScheduleRules(service), exceptions: [] }) };
    if (request === '@/lib/payu') return { createPayUOrder: async input => { payu.push(clone(input)); return { orderId: 'memory-order', redirectUri: 'http://localhost/payment-stub' }; }, cancelPayUOrder: async () => {} };
    if (request === './sender' && parent?.filename.endsWith('/email/booking.ts')) return { sendEmail: async message => sent.push(message), getAdminEmail: async () => 'admin@example.test' };
    if (request === '@/hooks/useAnalytics') return { useAnalytics: () => analytics };
    if (request === '@/context/CartContext') return { useCart: () => ({ addItem: item => cart.push(clone(item)), items: cart, totalAmount: cart.reduce((sum, item) => sum + item.price, 0), clearCart: () => {} }) };
    if (request === '@/context/AuthContext') return { useAuth: () => ({ user: null, token: null }) };
    if (request === 'next/navigation') return { useRouter: () => ({ push: () => {} }) };
    if (request === 'framer-motion') return { AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children), motion: new Proxy({}, { get: (target, tag) => React.forwardRef(({ initial, animate, transition, exit, variants, whileHover, whileTap, ...props }, ref) => React.createElement(tag, { ...props, ref })) }) };
    if (request === '@/components/BookingCalendar') return { __esModule: true, default: ({ onSlotSelect }) => React.createElement('button', { type: 'button', onClick: () => onSlotSelect({ date }) }, 'Wybierz dzień QA') };
    if (['@/components/PageRenderer', '@/components/TestimonialsSection', '@/components/client/ClientOfferRecommendedAlbums', '@/components/StyleGuide/ClientStyleGuidePanel', '@/components/client/AccountOrders', '@/components/shop/PhotoProductStorefront'].includes(request)) return { __esModule: true, default: () => null };
    if (request === '@/lib/client-portal-events-client') return { createPortalEventReporter: () => ({ track: () => {}, destroy: () => {}, flush: () => {} }), portalResponseDiagnostics: () => ({}) };
    return originalLoad.apply(this, arguments);
};
const dateValue = new Date(Date.now() + 35 * 86400000);
while (dateValue.getUTCDay() !== 6) dateValue.setUTCDate(dateValue.getUTCDate() + 1);
const date = dateValue.toISOString().slice(0, 10);
const catalogApi = require('../../src/app/api/booking/drone-catalog/route.ts');
const checkoutApi = require('../../src/app/api/basket/checkout/route.ts');
const Booking = require('../../src/app/rezerwacja/page.tsx').default;
const Checkout = require('../../src/app/checkout/page.tsx').default;
const { bookingSnapshotScopeLines } = require('../../src/lib/bookingPackageScope.ts');
const baseFetch = async url => {
    if (url === '/api/booking/drone-catalog') return catalogApi.GET();
    if (String(url).startsWith('/api/service-types')) return Response.json({ serviceTypes: [{ ...pkg.service, packages: [clone(pkg)] }] });
    if (url === '/api/settings/public') return Response.json({ settings: { photo_funnel_config: DEFAULT_PHOTO_FUNNEL_CONFIG } });
    if (url === '/api/pages?slug=rezerwacja') return Response.json({ success: true, page: null });
    if (String(url).startsWith('/api/availability')) return Response.json({ slots: [{ start: '09:00', end: '10:00', endDayOffset: 0, available: true }] });
    throw new Error(`Forbidden unexpected request ${url}`);
};
global.fetch = baseFetch;
const metadataFor = (item, standalone = true) => ({ date, start_time: '09:00', end_time: `${String(9 + (standalone ? item.durationHours : pkg.hours)).padStart(2, '0')}:00`, end_day_offset: 0,
    booking_package_source: standalone ? 'drone_cms' : 'database', package_slug: standalone ? item.slug : undefined,
    package_scope_lines: standalone ? dronePackageScopeLines(item) : ['Zakres reportażu przyjęty w koszyku'], hours: standalone ? item.durationHours : pkg.hours,
    drone_addon_slug: standalone ? undefined : item.slug, drone_scope_lines: standalone ? undefined : dronePackageScopeLines(item),
    drone_goal: config.booking.goalOptions[0], drone_terms_accepted: true, venue_city: 'Toruń', venue_place: 'Lokalizacja testowa',
});
const request = (item, metadata) => new Request('http://localhost/api/basket/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
    customer: { name: 'Klient Testowy', email: 'client@example.test' },
    items: [{ type: 'booking', productId: metadata.booking_package_source === 'drone_cms' ? `drone:${item.slug}` : String(pkg.id), price: 1, metadata }],
}) });
const deadline = setTimeout(() => { console.error(`Incomplete drone scope QA: ${h.log.length}`); process.exit(1); }, 30000);
(async () => {
    await check('actual booking cards show all CMS drone deliverables, duration and unchanged price prefix', async () => {
        window.history.replaceState(null, '', '/rezerwacja?service=Dron');
        await mount(Booking, {});
        for (const text of ['10 wybranych', '12 wybranych', 'minimum 15', '30–45 sekund', '45–60 sekund']) assert.ok(document.body.textContent.includes(text), text);
        assert.match(document.body.textContent, /od\s*1\s?290 zł/);
        assert.ok(!document.querySelector('[data-analytics="drone_addon_select"]'));
    });
    await check('real booking submission carries the displayed drone scope into the cart and checkout', async () => {
        await click([...document.querySelectorAll('[data-analytics="package_select"]')].find(node => node.textContent.includes('Nieruchomość z powietrza')));
        await click(button('Wybierz dzień QA'));
        await set(document.querySelector('#booking-start-time'), '09:00');
        for (const [key, value] of Object.entries({ name: 'Klient QA', email: 'client@example.test', venue_city: 'Toruń', venue_place: 'Lokalizacja', drone_goal: config.booking.goalOptions[0] })) await set(document.querySelector(`[data-booking-field="${key}"]`), value);
        await click(document.querySelector('[data-booking-field="drone_terms"]')); await click(document.querySelector('[data-booking-field="rodo"]'));
        await click(document.querySelector('button[type="submit"]'));
        assert.equal(cart.length, 1); assert.equal(cart[0].price, 44900);
        assert.deepEqual(cart[0].metadata.package_scope_lines, dronePackageScopeLines(config.packages[0]));
        await reset(); await mount(Checkout, {});
        assert.ok(document.body.textContent.includes('10 wybranych i opracowanych zdjęć'));
    });
    await check('addon keeps existing eligibility and exposes its full CMS scope on booking and checkout', async () => {
        await reset(); window.history.replaceState(null, '', '/rezerwacja?service=Urodziny'); await mount(Booking, {});
        const addon = config.packages.find(item => item.bookingMode === 'addon');
        const card = document.querySelector('[data-analytics="drone_addon_select"]');
        assert.ok(card.textContent.includes(addon.name)); assert.ok(card.textContent.includes('8–12 opracowanych zdjęć')); assert.ok(card.textContent.includes(addon.delivery)); assert.ok(card.textContent.includes('+690 zł'));
        cart = [{ id: 'addon', type: 'booking', title: `${pkg.name} + ${addon.name}`, price: pkg.price + addon.price * 100, metadata: metadataFor(addon, false) }];
        await reset(); await mount(Checkout, {}); assert.ok(document.body.textContent.includes('8–12 opracowanych zdjęć'));
    });
    await check('changed drone scope or duration is rejected before booking creation or payment', async () => {
        for (const [item, standalone] of [[config.packages[0], true], [config.packages.find(item => item.bookingMode === 'addon'), false]]) {
            const md = metadataFor(item, standalone);
            for (const changed of [standalone ? { package_scope_lines: ['Podmieniony zakres'] } : { drone_scope_lines: ['Podmieniony dodatek'] }, { hours: 20 }]) {
                assert.equal((await checkoutApi.POST(request(item, { ...md, ...changed }))).status, 409);
                assert.equal(bookings.length, 0); assert.equal(payu.length, 0);
            }
        }
    });
    await check('server freezes all standalone and addon scopes without changing amounts or payment routing', async () => {
        for (const item of config.packages.filter(item => item.bookingMode !== 'addon')) {
            const result = await checkoutApi.POST(request(item, metadataFor(item)));
            assert.equal(result.status, 200, JSON.stringify(await result.clone().json()));
            const saved = bookings.at(-1); assert.deepEqual(saved.booking_snapshot.package.scopeLines, dronePackageScopeLines(item));
            assert.deepEqual(saved.booking_snapshot.drone.scopeLines, dronePackageScopeLines(item));
            assert.deepEqual(bookingSnapshotScopeLines(saved.booking_snapshot), dronePackageScopeLines(item));
            assert.equal(saved.price, item.price * 100); assert.equal(payu.at(-1).totalAmount, item.price * 100);
        }
        const addon = config.packages.find(item => item.bookingMode === 'addon');
        assert.equal((await checkoutApi.POST(request(addon, metadataFor(addon, false)))).status, 200);
        const saved = bookings.at(-1); assert.deepEqual(saved.booking_snapshot.drone.scopeLines, dronePackageScopeLines(addon));
        assert.deepEqual(bookingSnapshotScopeLines(saved.booking_snapshot), ['Zakres reportażu przyjęty w koszyku', ...dronePackageScopeLines(addon)]);
        assert.equal(saved.price, 119000); assert.equal(payu.at(-1).totalAmount, 119000);
    });
    await check('emails and actual account history retain old drone scope after CMS changes without inventing missing history', async () => {
        config.packages.forEach(item => { item.features = ['Nowy zakres po zakupie']; item.summary = 'Nowa oferta'; item.delivery = 'Nowy termin'; });
        const { sendBookingConfirmationEmail } = require('../../src/lib/email/booking.ts');
        await sendBookingConfirmationEmail(bookings[1]); await sendBookingConfirmationEmail(bookings.at(-1));
        assert.equal(sent.length, 4); assert.ok(sent[0].html.includes('12 wybranych')); assert.ok(sent[2].html.includes('8–12 opracowanych'));
        for (const message of sent) assert.ok(!message.html.includes('Nowy zakres po zakupie'));
        assert.deepEqual(bookingSnapshotScopeLines({ service: 'Dron', package: { name: 'Dawny pakiet' }, drone: { name: 'Dawny dron' } }), []);
        await reset(); window.history.replaceState(null, '', '/konto?tab=bookings');
        global.fetch = async url => url === '/api/user/action-summary' ? Response.json({ nextAction: null, counts: { bookings: bookings.length, galleries: 0, challenges: 0, offers: 0, contracts: 0, giftCards: 0 }, modules: { workshops: false, galleries: false } }) : { ok: true, status: 200, headers: new Headers(), json: async () => ({ user: { bookings: clone(bookings), permissions: {} } }) };
        const { AuthenticatedAccountPage } = require('../../src/components/client/AccountPage.tsx');
        await mount(AuthenticatedAccountPage, { user: { id: 7, email: 'client@example.test', name: 'Klient', role: 'CLIENT' }, token: 'test', readOnly: true, logout: async () => {} });
        await click(button(/Rezerwacje/)); assert.ok(document.body.textContent.includes('30–45 sekund')); assert.ok(document.body.textContent.includes('8–12 opracowanych')); assert.ok(!document.body.textContent.includes('Nowy zakres po zakupie'));
    });
    await reset(); clearTimeout(deadline); console.log(`${h.log.length} drone booking scope checks passed`);
})().catch(error => { clearTimeout(deadline); console.error(error); process.exit(1); });
