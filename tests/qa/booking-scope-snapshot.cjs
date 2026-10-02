// Actual checkout, confirmation email and customer scope against in-memory data.
// PayU is a stub; no payment request, external database or email is sent.
const h = require('./gallery-shop-dom.cjs');
const { assert, React, mount, reset, check, click, button } = h;
global.Element = window.Element; global.SVGElement = window.SVGElement; global.getComputedStyle = window.getComputedStyle;
const Module = require('node:module');
const { renderToStaticMarkup } = require('react-dom/server');
let pkg = { id: 6, name: 'Pełny reportaż ślubny', price: 590000, hours: 12, is_active: true,
    service: { id: 2, name: 'Ślub', is_active: true }, description: '<ol><li>Zakres potwierdzony przez klienta</li><li>Pendrive</li><li>&lt;img src=x onerror=alert(1)&gt;</li></ol>', features: '["Sprzeczny stary zakres"]' };
let captured;
const sent = [];
const clone = value => JSON.parse(JSON.stringify(value));
const db = {
    setting: { findFirst: async () => ({ booking_min_days_ahead: 7 }) },
    user: { findUnique: async () => ({ id: 7 }) },
    package: { findFirst: async () => clone(pkg) },
    booking: { findUnique: async () => clone(captured), update: async ({ data }) => { captured = { ...captured, ...data }; return clone(captured); }, findMany: async () => [], create: async ({ data }) => { captured = { id: 9, ...data }; return clone(captured); }, updateMany: async () => ({ count: 1 }) },
    $queryRaw: async () => [{ acquired: 1 }], $transaction: async callback => callback(db),
};
const originalLoad = Module._load;
let payuInput;
Module._load = function(request, parent, isMain) {
    if (request === 'server-only') return {};
    if (request === '@/lib/db/prisma') return { __esModule: true, default: db };
    if (request === '@/lib/auth/middleware') return { requireAuth: async () => null };
    if (request === '@/lib/email/sender') return { sendEmail: async message => sent.push(message) };
    if (request === '@/lib/logger') return { logSystem: async () => {} };
    if (request === '@/lib/rate-limit') return { rateLimit: () => ({ ok: true }), getClientIp: () => '127.0.0.1' };
    if (request === '@/lib/bookingScheduleRepository') return { loadBookingScheduleConfiguration: async () => ({ rules: require('../../src/lib/bookingSchedule.ts').defaultBookingScheduleRules('SLUB'), exceptions: [] }) };
    if (request === '@/lib/packagePromotions') return { loadActivePromotionForPackage: async () => null };
    if (request === '@/lib/payu') return { createPayUOrder: async input => { payuInput = clone(input); return { orderId: 'mock-order', redirectUri: 'http://localhost/mock-payment' }; }, cancelPayUOrder: async () => {} };
    if (request === './sender' && parent?.filename.endsWith('/email/booking.ts')) return { sendEmail: async message => sent.push(message), getAdminEmail: async () => 'admin@example.test' };
    if (request === '@/context/AuthContext') return { useAuth: () => ({ user: null, token: null }) };
    if (request === 'next/navigation') return { useRouter: () => ({ push: () => {} }) };
    if (['@/components/client/ClientOfferRecommendedAlbums', '@/components/StyleGuide/ClientStyleGuidePanel', '@/components/client/AccountOrders', '@/components/shop/PhotoProductStorefront'].includes(request)) return { __esModule: true, default: () => null };
    if (request === '@/lib/client-portal-events-client') return { createPortalEventReporter: () => ({ track: () => {}, destroy: () => {}, flush: () => {} }), portalResponseDiagnostics: () => ({}) };
    if (request === '@/hooks/useAnalytics') return { useAnalytics: () => ({ trackEvent: async () => {} }) };
    return originalLoad.apply(this, arguments);
};
global.fetch = async () => { throw new Error('External fetch is forbidden in this test'); };
const checkout = require('../../src/app/api/basket/checkout/route.ts');
const { sendBookingConfirmationEmail } = require('../../src/lib/email/booking.ts');
const { bookingSnapshotScopeLines } = require('../../src/lib/bookingPackageScope.ts');
const Scope = require('../../src/components/booking/PackageScope.tsx').default;
const acceptedScope = ['Zakres potwierdzony przez klienta', 'Pendrive', '<img src=x onerror=alert(1)>'];
const requestForScope = (scopeLines, hours = 12) => {
    const date = new Date(Date.now() + 35 * 86400000);
    while (date.getUTCDay() !== 6) date.setUTCDate(date.getUTCDate() + 1);
    return new Request('http://localhost/api/basket/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        customer: { name: 'Klient Testowy', email: 'client@example.test', phone: '' }, totalAmount: 590000,
        items: [{ type: 'booking', productId: '6', price: 1, metadata: { date: date.toISOString().slice(0, 10), start_time: '08:00', end_time: '20:00', end_day_offset: 0,
            hours, package_scope_lines: scopeLines, booking_snapshot: { package: { scopeLines: ['Fałszywy snapshot'] } } } }],
    }) });
};

(async () => {
    await check('changed scope or duration stops checkout before any booking or payment is created', async () => {
        for (const request of [requestForScope(['Stary lub podmieniony zakres']), requestForScope(acceptedScope, 2)]) {
            assert.equal((await checkout.POST(request)).status, 409);
            assert.equal(captured, undefined);
            assert.equal(payuInput, undefined);
        }
    });
    await check('checkout freezes verified server scope and ignores a manipulated snapshot without changing price', async () => {
        const response = await checkout.POST(requestForScope(acceptedScope));
        assert.equal(response.status, 200, JSON.stringify(await response.clone().json()));
        assert.equal(captured.price, 590000);
        assert.equal(payuInput.totalAmount, 590000);
        assert.equal(payuInput.products[0].unitPrice, 590000);
        assert.equal(captured.booking_snapshot.package.hours, 12);
        assert.deepEqual(bookingSnapshotScopeLines(captured.booking_snapshot), ['Zakres potwierdzony przez klienta', 'Pendrive', '<img src=x onerror=alert(1)>']);
        pkg.description = '<p>Nowy zakres oferty</p>';
        assert.ok(!bookingSnapshotScopeLines(captured.booking_snapshot).includes('Nowy zakres oferty'));
    });
    await check('both confirmation emails use frozen plain text safely after the public offer changes', async () => {
        await sendBookingConfirmationEmail(captured);
        assert.equal(sent.length, 2);
        for (const message of sent) {
            assert.ok(message.html.includes('Zakres potwierdzony przez klienta'));
            assert.ok(message.html.includes('Pendrive'));
            assert.ok(!message.html.includes('Nowy zakres oferty'));
            assert.ok(!message.html.includes('<img src=x onerror='));
            assert.ok(message.html.includes('&lt;img src=x onerror=alert(1)&gt;'));
        }
        const html = renderToStaticMarkup(React.createElement(Scope, { scopeLines: bookingSnapshotScopeLines(captured.booking_snapshot) }));
        assert.ok(html.includes('Pendrive'));
        assert.ok(!html.includes('<img'));
        assert.equal(bookingSnapshotScopeLines({ package: { hours: 12 } }).length, 0);
        assert.equal(bookingSnapshotScopeLines(null).length, 0);
    });
    await check('manual admin confirmation uses the historical scope once and never rereads current Package', async () => {
        const bookingApi = require('../../src/app/api/bookings/route.ts');
        captured.status = 'pending'; const count = sent.length;
        const request = () => new Request('http://localhost/api/bookings?id=9', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'confirmed' }) });
        assert.equal((await bookingApi.PATCH(request())).status, 200);
        assert.equal(sent.length, count + 1);
        assert.ok(sent.at(-1).html.includes('Zakres potwierdzony przez klienta'));
        assert.ok(sent.at(-1).html.includes('Pendrive')); assert.ok(!sent.at(-1).html.includes('Nowy zakres oferty'));
        assert.ok(!sent.at(-1).html.includes('<img src=x onerror='));
        assert.equal((await bookingApi.PATCH(request())).status, 200); assert.equal(sent.length, count + 1);
    });
    await check('actual customer booking summary renders frozen scope without rereading the current package', async () => {
        window.history.replaceState(null, '', '/konto?tab=bookings');
        global.fetch = async url => {
            if (url === '/api/user/action-summary') return Response.json({ nextAction: null,
                counts: { bookings: 1, galleries: 0, challenges: 0, offers: 0, contracts: 0, giftCards: 0 }, modules: { workshops: false, galleries: false } });
            assert.ok(String(url).startsWith('/api/user/me'));
            return { ok: true, status: 200, headers: new Headers(), json: async () => ({ user: { bookings: [clone(captured)], permissions: {} } }) };
        };
        const { AuthenticatedAccountPage } = require('../../src/components/client/AccountPage.tsx');
        await mount(AuthenticatedAccountPage, { user: { id: 7, email: 'client@example.test', name: 'Klient', role: 'CLIENT' }, token: 'test', readOnly: true, logout: async () => {} });
        await click(button(/Rezerwacje/));
        assert.ok(document.body.textContent.includes('Zakres potwierdzony przez klienta'));
        assert.ok(document.body.textContent.includes('Pendrive'));
        assert.ok(!document.body.textContent.includes('Nowy zakres oferty'));
        assert.ok(!document.querySelector('img[onerror]'));
    });
    await reset(); console.log(`${h.log.length} booking scope snapshot checks passed`);
})().catch(error => { console.error(error); process.exitCode = 1; });
