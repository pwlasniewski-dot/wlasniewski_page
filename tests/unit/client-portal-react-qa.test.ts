import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const root = process.cwd();
const mocks: Record<string, string> = {
    '@/context/AuthContext': `
        import React, {createContext, useContext, useState} from 'react';
        const Context = createContext(null);
        export function useAuth() { return useContext(Context); }
        export function QaAuth({children}) {
            const [auth, setAuth] = useState(window.__qaInitialAuth);
            window.__qaSetAuth = setAuth;
            return <Context.Provider value={auth}>{children}</Context.Provider>;
        }
    `,
    'next/navigation': `export function useRouter() { return window.__qaRouter; }`,
    'next/link': `import React from 'react'; export default function Link({href, children, onClick, ...rest}) {
        return <a href={href} {...rest} onClick={event => { event.preventDefault(); onClick?.(event); }}>{children}</a>;
    }`,
    'framer-motion': `import React from 'react'; const cache={};
        export const motion = new Proxy({}, {get:(_, tag) => cache[tag] ||= React.forwardRef(function Motion({initial,animate,exit,transition,whileHover,whileTap,...props},ref) {return React.createElement(tag,{...props,ref});})});
        export function AnimatePresence({children}) { return children; }
    `,
    '@/components/client/ClientOfferRecommendedAlbums': `export default function Stub(){return null;}`,
    '@/components/StyleGuide/ClientStyleGuidePanel': `export default function Stub(){return null;}`,
    '@/components/SignaturePad': `export default function Stub(){return null;}`,
    '@/components/client/ClientOfferAddonCheckbox': `export default function Stub(){return null;}`,
    'qrcode': `export default {toDataURL: async () => 'data:image/png;base64,iVBORw0KGgo='};`,
};

const bundle = build({
    stdin: { contents: `
        import React, {act} from 'react';
        import {createRoot} from 'react-dom/client';
        import AccountPage from './src/app/konto/page';
        import {QaAuth} from '@/context/AuthContext';
        window.IS_REACT_ACT_ENVIRONMENT = true;
        window.__qaAct = act;
        window.__qaRoot = createRoot(document.getElementById('root'));
        window.__qaMount = () => window.__qaRoot.render(<React.StrictMode><QaAuth><AccountPage/></QaAuth></React.StrictMode>);
    `, loader: 'tsx', resolveDir: root },
    bundle: true, write: false, platform: 'browser', format: 'iife', jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [{ name: 'isolated-portal-boundaries', setup(builder) {
        builder.onResolve({ filter: /.*/ }, args => args.path in mocks ? { path: args.path, namespace: 'qa-mock' } : undefined);
        builder.onLoad({ filter: /.*/, namespace: 'qa-mock' }, args => ({ contents: mocks[args.path], loader: 'tsx', resolveDir: root }));
    } }],
}).then(result => result.outputFiles[0].text);

const summary = {
    nextAction: null,
    counts: { offers: 0, contracts: 0, galleries: 1, challenges: 0, bookings: 0, giftCards: 1 },
    modules: { workshops: false, galleries: true },
};
const auth = (id: number) => ({ user: { id, name: `QA${id}`, email: `qa${id}@example.test`, role: 'CLIENT' }, token: `fake-token-${id}`, isLoading: false, logout: async () => {} });
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const account = (code: string) => ({ user: { gift_cards: [{ id: 10, value: 100, code, access_token: 'SECRET_VOUCHER_ACCESS_TOKEN' }], bookings: [], offers: [], contracts: [], photo_orders: [] } });

test('QA: actual React portal repeats navigation/retry/cache/identity/logging-failure scenario three times', async () => {
    const script = await bundle;
    for (let trial = 1; trial <= 3; trial++) {
        const errors: string[] = [];
        const vc = new VirtualConsole();
        vc.on('jsdomError', (error: Error) => errors.push(error.message));
        const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
            url: 'https://portal.test/konto', runScripts: 'dangerously', virtualConsole: vc,
        });
        const win = dom.window as any;
        // jsdom does not implement MessageChannel; React's async act uses only this task bridge.
        win.MessageChannel = class {
            port1: { onmessage: (() => void) | null } = { onmessage: null };
            port2 = { postMessage: () => setTimeout(() => this.port1.onmessage?.(), 0) };
        };
        const observations: Array<{ token: string; event: any }> = [];
        const accountRequests: Array<{ token: string; signal: AbortSignal; resolve: (value: Response) => void }> = [];
        let mode: 'deferred' | 'failed' | 'success' = 'deferred';
        let summaryFail = false;
        let loggingFail = false;
        let activeCode = 'QA-VOUCHER-ONE';
        win.__qaInitialAuth = auth(116);
        win.__qaRouter = { push: () => {} };
        win.fetch = async (path: string, init: RequestInit = {}) => {
            const token = new Headers(init.headers).get('Authorization') || '';
            if (path === '/api/user/events') {
                observations.push({ token, event: JSON.parse(String(init.body)) });
                if (loggingFail) throw new Error('diagnostic network unavailable');
                return new Response(null, { status: 204 });
            }
            if (path === '/api/user/action-summary') return summaryFail ? json({ error: 'Podsumowanie niedostępne', caseCode: '63b6e109-77a5-436d-94cd-fe622da99da6' }, 500) : json(summary);
            if (path === '/api/user/me') {
                if (mode === 'failed') return json({ error: 'Sekcja niedostępna', caseCode: '69896238-e4b2-46b9-8369-bffcf60d50c0' }, 500);
                if (mode === 'success') return json(account(activeCode));
                return new Promise<Response>((resolve, reject) => {
                    accountRequests.push({ token, signal: init.signal as AbortSignal, resolve });
                    init.signal?.addEventListener('abort', () => reject(new win.DOMException('Aborted', 'AbortError')), { once: true });
                });
            }
            if (path === '/api/galleries/client') return json({ galleries: [] });
            if (path === '/api/photo-challenge/client/challenges') return json({ challenges: [] });
            throw new Error(`Unexpected API boundary: ${path}`);
        };
        win.eval(script);
        const flush = async (action: () => void = () => {}) => { await win.__qaAct(async () => { action(); await new Promise(resolve => setImmediate(resolve)); }); };
        const clickTab = async (label: string) => {
            const button = [...win.document.querySelectorAll('[data-account-tab]')].find((element: any) => element.textContent.includes(label)) as HTMLElement | undefined;
            assert.ok(button, `trial ${trial}: tab ${label} exists`);
            await flush(() => button.click());
        };
        const body = () => win.document.body.textContent || '';
        try {
            await flush(() => win.__qaMount());
            assert.match(body(), /Witaj, QA116/);
            await clickTab('Karty Podarunkowe');
            assert.equal(accountRequests.length, 1, 'one lazy-load, despite React Strict Mode');
            assert.match(body(), /Ładowanie sekcji/);
            assert.doesNotMatch(body(), /Nie posiadasz jeszcze/, 'never show a false empty wallet during loading');
            await clickTab('Ustawienia');
            assert.equal(accountRequests[0].signal.aborted, true, 'navigation cancels abandoned request');
            await clickTab('Karty Podarunkowe');
            assert.equal(accountRequests.length, 2, 'return reloads cancelled module');
            await flush(() => accountRequests[1].resolve(json(account(activeCode))));
            assert.match(body(), /QA-VOUCHER-ONE/, 'successful account response actually renders');
            await clickTab('Przegląd');
            await clickTab('Karty Podarunkowe');
            assert.equal(accountRequests.length, 2, 'successful data survives return without refetch/self-cancellation');
            const voucherLink = win.document.querySelector('a[href*="SECRET_VOUCHER_ACCESS_TOKEN"]');
            assert.ok(voucherLink);
            await flush(() => voucherLink.click());
            assert.ok(observations.some(item => item.event.action === 'voucher_open'), 'click intent is logged');
            assert.doesNotMatch(JSON.stringify(observations.map(item => item.event)), /SECRET_VOUCHER|fake-token|example\.test|QA-VOUCHER/);

            mode = 'failed';
            activeCode = 'QA-VOUCHER-TWO';
            await flush(() => win.__qaSetAuth(auth(117)));
            assert.doesNotMatch(body(), /QA-VOUCHER-ONE/, 'identity change clears old data');
            assert.match(body(), /Witaj, QA117/);
            await clickTab('Karty Podarunkowe');
            assert.match(body(), /Sekcja niedostępna/);
            assert.doesNotMatch(body(), /Nie posiadasz jeszcze/, 'failed request is not an empty wallet');
            const retry = [...win.document.querySelectorAll('button')].find((element: any) => element.textContent.includes('Spróbuj ponownie')) as HTMLElement;
            assert.ok(retry);
            loggingFail = true;
            mode = 'success';
            await flush(() => retry.click());
            assert.match(body(), /QA-VOUCHER-TWO/, 'retry works even when telemetry throws');
            assert.equal(win.document.querySelector('[role="alert"]'), null);
            await clickTab('Ustawienia');
            await clickTab('Karty Podarunkowe');
            assert.match(body(), /QA-VOUCHER-TWO/);

            const firstSession = observations.find(item => item.token === 'Bearer fake-token-116')?.event.sessionId;
            const secondSession = observations.find(item => item.token === 'Bearer fake-token-117')?.event.sessionId;
            assert.ok(firstSession && secondSession && firstSession !== secondSession, 'identity change starts new diagnostic session');
            assert.ok(observations.some(item => item.event.event === 'module_load_failed' && item.event.httpStatus === 500));
            assert.ok(observations.some(item => item.event.event === 'retry_clicked' && item.event.module === 'account'));

            summaryFail = true;
            await flush(() => win.__qaSetAuth(auth(118)));
            assert.match(body(), /Podsumowanie niedostępne/);
            summaryFail = false;
            const summaryRetry = [...win.document.querySelectorAll('button')].find((element: any) => element.textContent.includes('Spróbuj ponownie')) as HTMLElement;
            await flush(() => summaryRetry.click());
            assert.match(body(), /Witaj, QA118/);
            assert.equal(win.document.querySelector('[role="alert"]'), null);
            assert.deepEqual(errors, []);
        } finally {
            await flush(() => win.__qaRoot.unmount());
            dom.window.close();
        }
    }
});

test('QA: accepted family offer renders its parents voucher preview and private PDF download with hidden price', async () => {
    const result = await build({
        stdin: { contents: `
            import React, {act} from 'react';
            import {createRoot} from 'react-dom/client';
            import OfferDetailPage from './src/app/strefa-klienta/oferty/[id]/page';
            window.IS_REACT_ACT_ENVIRONMENT = true;
            window.__qaAct = act;
            window.__qaRoot = createRoot(document.getElementById('root'));
            const params = Promise.resolve({id: '900078'});
            window.__qaMount = () => window.__qaRoot.render(<React.StrictMode><OfferDetailPage params={params}/></React.StrictMode>);
        `, loader: 'tsx', resolveDir: root },
        bundle: true, write: false, platform: 'browser', format: 'iife', jsx: 'automatic',
        define: { 'process.env.NODE_ENV': '"development"' },
        plugins: [{ name: 'isolated-offer-boundaries', setup(builder) {
            builder.onResolve({ filter: /.*/ }, args => args.path in mocks ? { path: args.path, namespace: 'qa-mock' } : undefined);
            builder.onLoad({ filter: /.*/, namespace: 'qa-mock' }, args => ({ contents: mocks[args.path], loader: 'tsx', resolveDir: root }));
        } }],
    });
    const errors: string[] = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', (error: Error) => errors.push(error.message));
    const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
        url: 'https://portal.test/strefa-klienta/oferty/900078', runScripts: 'dangerously', virtualConsole: vc,
    });
    const win = dom.window as any;
    win.MessageChannel = class {
        port1: { onmessage: (() => void) | null } = { onmessage: null };
        port2 = { postMessage: () => setTimeout(() => this.port1.onmessage?.(), 0) };
    };
    win.__qaRouter = { push: () => assert.fail('authenticated synthetic fixture must not redirect') };
    win.localStorage.setItem('user_token', 'QA_OFFER_AUTH_ONLY');
    const requested: string[] = [];
    win.fetch = async (path: string, init: RequestInit = {}) => {
        requested.push(path);
        assert.equal(path, '/api/client/portal/offers/900078');
        assert.equal(new Headers(init.headers).get('Authorization'), 'Bearer QA_OFFER_AUTH_ONLY');
        return json({ offer: {
            id: 900078, category: 'family', status: 'accepted', title: 'Synthetic QA family session', total_price: 1234,
            client_selection: {
                selectedPackage: { index: 2, name: 'RODZINNY KOMFORT', price: '1234 zł' },
                familyVoucher: { enabled: true, hidePrice: true, senderName: 'Synthetic sender', recipientName: 'Rodzice QA', packageName: 'RODZINNY KOMFORT', packagePriceLabel: '1234 zł' },
            },
            template_data: {
                title: 'Synthetic family offer', pricingHeaders: ['Pakiet', 'START', 'KOMFORT', 'PREMIUM'], footerPrices: ['', '1000 zł', '1234 zł', '2000 zł'], pricingRows: [],
                labels: { footerDisclaimer: '' }, footerCompany: '',
                sectionVisibility: { eventInfo: false, preparations: false, features: false, pricing: false, album: false, delivery: false },
            },
        } });
    };
    win.eval(result.outputFiles[0].text);
    const flush = async (action: () => void) => { await win.__qaAct(async () => { action(); await new Promise(resolve => setImmediate(resolve)); }); };
    try {
        await flush(() => win.__qaMount());
        const text = win.document.body.textContent;
        assert.match(text, /Voucher dla rodziców do wydruku/);
        assert.match(text, /Voucher na sesję/);
        assert.match(text, /Rodzice QA/);
        assert.match(text, /RODZINNY KOMFORT/);
        const previewHeading = [...win.document.querySelectorAll('h3')].find((element: any) => element.textContent === 'Voucher na sesję') as HTMLElement;
        assert.ok(previewHeading);
        assert.doesNotMatch(previewHeading.parentElement!.textContent!, /1234 zł/, 'hidePrice omits voucher price while the offer may still show its own price');
        const download = [...win.document.querySelectorAll('a')].find((element: any) => element.textContent.includes('Pobierz voucher PDF')) as HTMLAnchorElement;
        assert.ok(download, 'family voucher exists under the offer, independently of gift-card wallet');
        const url = new URL(download.href);
        assert.equal(url.pathname, '/api/client/portal/offers/900078/family-voucher');
        assert.equal(url.searchParams.get('hidePrice'), '1');
        assert.equal(url.searchParams.get('packageName'), 'RODZINNY KOMFORT');
        assert.doesNotMatch(download.href, /QA_OFFER_AUTH_ONLY/);
        assert.equal(download.getAttribute('download'), 'voucher-rodzinny-900078.pdf');
        assert.equal(requested.length, 1);
        assert.deepEqual(errors, []);
    } finally {
        await flush(() => win.__qaRoot.unmount());
        dom.window.close();
    }
});

test('QA: actual AuthProvider survives temporary backend failure, rejects stale responses and clears only invalid sessions', async () => {
    const result = await build({
        stdin: { contents: `
            import React, {act} from 'react';
            import {createRoot} from 'react-dom/client';
            import {AuthProvider, useAuth} from './src/context/AuthContext';
            function Probe() { const auth = useAuth(); window.__qaAuth = auth; return <pre>{JSON.stringify({user:auth.user, token:auth.token, isLoading:auth.isLoading})}</pre>; }
            window.IS_REACT_ACT_ENVIRONMENT = true;
            window.__qaAct = act;
            window.__qaRoot = createRoot(document.getElementById('root'));
            window.__qaMount = () => window.__qaRoot.render(<React.StrictMode><AuthProvider><Probe/></AuthProvider></React.StrictMode>);
        `, loader: 'tsx', resolveDir: root },
        bundle: true, write: false, platform: 'browser', format: 'iife', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"' },
    });
    for (const failureMode of ['http503', 'network'] as const) {
        const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://portal.test/konto', runScripts: 'dangerously', virtualConsole: new VirtualConsole() });
        const win = dom.window as any;
        win.MessageChannel = class {
            port1: { onmessage: (() => void) | null } = { onmessage: null };
            port2 = { postMessage: () => setTimeout(() => this.port1.onmessage?.(), 0) };
        };
        win.localStorage.setItem('user_token', 'QA_SAVED_AUTH');
        win.localStorage.setItem('user_info', JSON.stringify({ id: 999, name: 'STALE_CACHED_PRIVATE_USER' }));
        let mode: string = failureMode;
        let resolvePending: ((response: Response) => void) | undefined;
        const urls: string[] = [];
        win.fetch = async (path: string) => {
            urls.push(path);
            if (mode === 'network') throw new Error('synthetic network failure');
            if (mode === 'http503') return json({ error: 'Temporary failure' }, 503);
            if (mode === 'unauthorized') return json({ error: 'Unauthorized' }, 401);
            if (mode === 'pending') return new Promise<Response>(resolve => { resolvePending = resolve; });
            return json({ user: auth(900001).user });
        };
        win.eval(result.outputFiles[0].text);
        const flush = async (action: () => void) => { await win.__qaAct(async () => { action(); await new Promise(resolve => setImmediate(resolve)); }); };
        try {
            await flush(() => win.__qaMount());
            assert.equal(win.__qaAuth.token, 'QA_SAVED_AUTH', failureMode);
            assert.equal(win.__qaAuth.user, null, 'do not restore stale cached private user on failure');
            assert.equal(win.__qaAuth.isLoading, false);
            assert.equal(win.localStorage.getItem('user_token'), 'QA_SAVED_AUTH');
            assert.ok(urls.every(path => path === '/api/user/session'), 'identity check does not depend on optional /api/user/me modules');
            mode = 'success';
            await flush(() => { void win.__qaAuth.refreshUser(); });
            assert.equal(win.__qaAuth.user.id, 900001);
            mode = 'pending';
            await flush(() => { void win.__qaAuth.refreshUser(); });
            await flush(() => win.__qaAuth.login('QA_NEW_AUTH', auth(900002).user));
            assert.ok(resolvePending);
            await flush(() => resolvePending!(json({ user: auth(900001).user })));
            assert.equal(win.__qaAuth.token, 'QA_NEW_AUTH', 'old refresh cannot overwrite new login');
            assert.equal(win.__qaAuth.user.id, 900002);
            mode = 'unauthorized';
            await flush(() => { void win.__qaAuth.refreshUser(); });
            assert.equal(win.__qaAuth.token, null);
            assert.equal(win.__qaAuth.user, null);
            assert.equal(win.__qaAuth.isLoading, false);
            assert.equal(win.localStorage.getItem('user_token'), null);
            assert.equal(win.localStorage.getItem('user_info'), null);
        } finally {
            await flush(() => win.__qaRoot.unmount());
            dom.window.close();
        }
    }
});

test('QA: actual admin Activity component shows errors, distinct evidence sources, correlation and 100-row pagination', async () => {
    const adminMocks = {
        ...mocks,
        'next/navigation': `export function useRouter() {return window.__qaRouter;} export function useSearchParams() {return new URLSearchParams('tab=activity');}`,
        'react-hot-toast': `export default {success:()=>{},error:()=>{}};`,
        '@/components/admin/GalleryAdmin': `export default function Stub(){return null;}`,
    };
    const result = await build({
        stdin: { contents: `
            import React, {act} from 'react'; import {createRoot} from 'react-dom/client';
            import {__qaClientDetailsContent} from './src/app/admin/clients/[id]/page';
            window.IS_REACT_ACT_ENVIRONMENT = true; window.__qaAct = act;
            window.__qaRoot = createRoot(document.getElementById('root'));
            window.__qaMount = () => window.__qaRoot.render(<React.StrictMode><__qaClientDetailsContent id="900116"/></React.StrictMode>);
        `.replaceAll('__qaClientDetailsContent', 'QaClientDetailsContent'), loader: 'tsx', resolveDir: root },
        bundle: true, write: false, platform: 'browser', format: 'iife', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"' },
        plugins: [{ name: 'isolated-admin-render', setup(builder) {
            // Expose the unchanged inner component for this test only. Next's React.use(params) wrapper is not under test.
            builder.onLoad({ filter: /\/src\/app\/admin\/clients\/\[id\]\/page\.tsx$/ }, args => ({ contents: `${readFileSync(args.path, 'utf8')}\nexport {ClientDetailsContent as QaClientDetailsContent};`, loader: 'tsx' }));
            builder.onResolve({ filter: /.*/ }, args => args.path in adminMocks ? { path: args.path, namespace: 'qa-mock' } : undefined);
            builder.onLoad({ filter: /.*/, namespace: 'qa-mock' }, args => ({ contents: adminMocks[args.path as keyof typeof adminMocks], loader: 'tsx', resolveDir: root }));
        } }],
    });
    const errors: string[] = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', (error: Error) => errors.push(error.message));
    const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://portal.test/admin/clients/900116?tab=activity', runScripts: 'dangerously', virtualConsole: vc });
    const win = dom.window as any;
    win.MessageChannel = class {
        port1: { onmessage: (() => void) | null } = { onmessage: null };
        port2 = { postMessage: () => setTimeout(() => this.port1.onmessage?.(), 0) };
    };
    win.__qaRouter = { push: () => assert.fail('synthetic admin fixture must not redirect') };
    win.localStorage.setItem('admin_token', 'QA_ADMIN_AUTH');
    let historyFailed = true;
    const offsets: string[] = [];
    win.fetch = async (path: string, init: RequestInit = {}) => {
        assert.equal(init.method || 'GET', 'GET', 'render/navigation must never submit admin writes');
        assert.equal(new Headers(init.headers).get('Authorization'), 'Bearer QA_ADMIN_AUTH');
        if (path === '/api/admin/clients/900116') return json({ success: true, client: {
            id: 900116, name: 'Synthetic QA client', email: 'qa@example.test', created_at: '2026-09-01T00:00:00Z', is_active: true,
            offers: [], contracts: [], orders: [], assigned_bookings: [], assigned_galleries: [], client_galleries: [], baskets: [],
        } });
        const url = new URL(path, 'https://portal.test');
        assert.equal(url.pathname, '/api/admin/crm-activity');
        assert.equal(url.searchParams.get('client_id'), '900116');
        assert.equal(url.searchParams.get('limit'), '100');
        offsets.push(url.searchParams.get('offset') || '0');
        if (historyFailed) return json({ error: 'Temporary history failure' }, 500);
        const offset = Number(url.searchParams.get('offset') || '0');
        return json({ total: 101, activities: Array.from({ length: offset === 0 ? 100 : 1 }, (_, index) => ({
            id: offset + index + 1, action: 'portal_event', entity_type: 'client_portal', created_at: '2026-09-13T08:53:41.000Z',
            details: { source: index % 2 ? 'server' : 'browser', event: index % 2 ? 'request_failed' : 'tab_opened', section: 'documents', module: 'account',
                durationMs: 500, httpStatus: index % 2 ? 500 : 200, correlationId: '69896238-e4b2-46b9-8369-bffcf60d50c0' },
        })) });
    };
    win.eval(result.outputFiles[0].text);
    const flush = async (action: () => void) => { await win.__qaAct(async () => { action(); await new Promise(resolve => setImmediate(resolve)); }); };
    const button = (label: string) => [...win.document.querySelectorAll('button')].find((element: any) => element.textContent.trim() === label) as HTMLElement;
    try {
        await flush(() => win.__qaMount());
        assert.ok(win.document.querySelector('[role="alert"]'));
        assert.doesNotMatch(win.document.body.textContent, /Brak zarejestrowanej aktywności/, 'failed read cannot masquerade as empty history');
        historyFailed = false;
        await flush(() => button('Odśwież').click());
        assert.match(win.document.body.textContent, /Obserwacja przeglądarki/);
        assert.match(win.document.body.textContent, /Wynik serwera/);
        assert.match(win.document.body.textContent, /69896238-e4b2-46b9-8369-bffcf60d50c0/);
        assert.match(win.document.body.textContent, /10:53:41/, 'timestamps use Warsaw, not server timezone');
        assert.match(win.document.body.textContent, /1–100 z 101/);
        assert.equal(win.document.querySelector('[role="alert"]'), null);
        await flush(() => button('Starsze').click());
        assert.equal(offsets.at(-1), '100');
        assert.match(win.document.body.textContent, /101–101 z 101/);
        await flush(() => button('Nowsze').click());
        assert.equal(offsets.at(-1), '0');
        assert.match(win.document.body.textContent, /1–100 z 101/);
        assert.deepEqual(errors, []);
    } finally {
        await flush(() => win.__qaRoot.unmount());
        dom.window.close();
    }
});
