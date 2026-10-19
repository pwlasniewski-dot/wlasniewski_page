import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');

test('dashboard shows every upcoming source beyond selected year with one shared request, refresh and retry', async () => {
    const bundle = await build({
        stdin: { contents: `import React, {act} from 'react'; import {createRoot} from 'react-dom/client';
            import Widget from './src/components/admin/DashboardCalendarWidget';
            window.IS_REACT_ACT_ENVIRONMENT=true; window.act=act;
            window.root=createRoot(document.getElementById('root'));
            window.mount=()=>window.root.render(<Widget/>);`, loader: 'tsx', resolveDir: process.cwd() },
        bundle: true, write: false, platform: 'browser', format: 'iife', jsx: 'automatic',
        define: { 'process.env.NODE_ENV': '"development"' },
        plugins: [{ name: 'framework-boundaries', setup(build) {
            build.onResolve({ filter: /^(next\/link|next\/navigation|@\/components\/admin\/AddCalendarBooking)$/ }, args => ({ path: args.path, namespace: 'stub' }));
            build.onLoad({ filter: /.*/, namespace: 'stub' }, args => ({ loader: 'tsx', resolveDir: process.cwd(), contents:
                args.path === 'next/link' ? 'export default function Link({href,children,...props}) {return <a href={href} {...props}>{children}</a>}'
                    : args.path === 'next/navigation' ? 'export const useRouter=()=>({push:url=>window.destination=url})'
                    : 'export default function Add({onCreated}) {window.saved=onCreated;return null}' }));
        } }],
    });
    const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'https://example.test/admin/dashboard', runScripts: 'dangerously' });
    const win = dom.window as any;
    win.MessageChannel = class { port1: { onmessage: (() => void) | null } = { onmessage: null }; port2 = { postMessage: () => setTimeout(() => this.port1.onmessage?.(), 0) }; };
    const RealDate = win.Date;
    win.Date = class extends RealDate { constructor(...args: any[]) { super(...(args.length ? args : ['2026-10-19T22:30:00Z'])); } static now() { return new RealDate('2026-10-19T22:30:00Z').getTime(); } };
    const event = (id: number, date: string, status = 'confirmed', source = 'booking', time = '12:00') => ({ id: `${source}-${id}`, source, date, status, start_time: time, end_time: '14:00', title: `Usługa ${id}`, client_name: `Klient ${id}`, detail_url: `/admin/bookings?id=${id}`, deposit_status: 'pending', deposit_amount: 100 });
    const events = [event(99, '2026-10-19'), event(98, '2028-01-01', 'cancelled'), event(97, '2028-01-01', 'completed'),
        ...Array.from({ length: 12 }, (_, i) => event(i + 1, `2028-02-${String(i + 1).padStart(2, '0')}`, 'confirmed', ['booking','offer','challenge','contract','workshop'][i % 5])),
        event(13, '2028-02-01', 'pending', 'booking', '09:00')].reverse();
    const requests: any[] = [];
    let fail = false;
    win.localStorage.setItem('admin_token', 'admin-test');
    win.fetch = async (url: string, init: any) => {
        requests.push({ url, ...init });
        return { ok: !fail, json: async () => ({ events }) };
    };
    win.eval(bundle.outputFiles[0].text);
    const act = async (run: () => void) => win.act(async () => { run(); await new Promise(resolve => setImmediate(resolve)); });
    const list = () => win.document.querySelector('[aria-labelledby="upcoming-bookings-heading"]');
    try {
        await act(() => win.mount());
        assert.equal(requests.length, 1, 'calendar and upcoming list share a single request');
        assert.equal(new URL(requests[0].url, win.location.origin).searchParams.has('to'), false);
        assert.equal(requests[0].headers.Authorization, 'Bearer admin-test');
        assert.equal(list().querySelectorAll('button').length, 13, 'no arbitrary 5/10 item limit');
        assert.match(list().textContent, /2028/);
        assert.doesNotMatch(list().textContent, /Klient 99|Klient 98|Klient 97/);
        assert.match(list().querySelector('button').textContent, /Klient 13/, 'same day ordered by time');
        assert.match(list().textContent, /Zaliczka oczekuje/);
        await act(() => list().querySelector('button').click());
        assert.equal(win.destination, '/admin/bookings?id=13');
        // Repeated month navigation must retain the entire future list and fetch from today at the latest.
        const beforeNavigation = requests.length;
        for (let i = 0; i < 3; i++) await act(() => win.document.querySelector('button[aria-label="Następny miesiąc"]').click());
        assert.equal(requests.length, beforeNavigation + 3, 'one request per month change, no separate list read');
        assert.equal(list().querySelectorAll('button').length, 13);
        assert.equal(new URL(requests.at(-1).url, win.location.origin).searchParams.get('from'), '2026-10-20', 'Warsaw day, not UTC/browser day');
        const before = requests.length;
        events.push(event(50, '2029-01-01'));
        await act(() => win.saved());
        assert.equal(requests.length, before + 1);
        assert.match(list().textContent, /Klient 50/);
        fail = true;
        await act(() => win.saved());
        assert.match(list().textContent, /Nie udało się/);
        assert.doesNotMatch(list().textContent, /Brak nadchodzących/);
        fail = false;
        await act(() => Array.from(win.document.querySelectorAll('button')).find((b: any) => b.textContent === 'Ponów')!.click());
        assert.equal(list().querySelectorAll('button').length, 14);
        events.length = 0;
        await act(() => win.saved());
        assert.match(list().textContent, /Brak nadchodzących/);
    } finally {
        await act(() => win.root.unmount());
        win.close();
    }
});
