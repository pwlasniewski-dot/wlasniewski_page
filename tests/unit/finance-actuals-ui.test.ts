import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const bundle = build({
    stdin: { contents: `import React, {act} from 'react'; import {createRoot} from 'react-dom/client'; import FinanceActuals from './src/components/admin/analytics/FinanceActuals'; window.IS_REACT_ACT_ENVIRONMENT=true; window.__act=act; const root=createRoot(document.getElementById('root')); window.__mount=(startDate,endDate)=>root.render(<FinanceActuals startDate={startDate} endDate={endDate}/>); window.__unmount=()=>root.unmount();`, loader: 'tsx', resolveDir: process.cwd() },
    bundle: true, write: false, platform: 'browser', format: 'iife', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"' },
}).then(result => result.outputFiles[0].text);
const body = (amount = 123450) => ({ success: true, data: { receivedPaymentsGross: amount, refundsGross: 500, receivedPaymentsNet: amount - 500, currency: 'PLN', unit: 'minor', coverageStartedAt: null, details: { ledgerPaymentsGross: amount, legacyPaymentsGross: 0, notes: ['Zwroty częściowe mogą być niepełne.'] } }, range: { startDate: '2026-09-01', endDate: '2026-09-30', timeZone: 'Europe/Warsaw' } });
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });

test('actual React finance clears stale amounts across date changes, ignores old responses, then clears on access denial and retries', async () => {
    const errors: string[] = []; const vc = new VirtualConsole(); vc.on('jsdomError', (error: Error) => errors.push(error.message));
    const dom = new JSDOM('<div id="root"></div>', { url: 'https://test.local/admin/analytics', runScripts: 'dangerously', virtualConsole: vc });
    const win = dom.window as any;
    win.MessageChannel = class { port1: { onmessage: (() => void) | null } = { onmessage: null }; port2 = { postMessage: () => setTimeout(() => this.port1.onmessage?.(), 0) }; };
    win.localStorage.setItem('admin_token', 'qa-admin');
    const requests: Array<{ path: string; init: RequestInit; resolve: (value: Response) => void }> = [];
    win.fetch = (path: string, init: RequestInit) => new Promise(resolve => requests.push({ path, init, resolve }));
    win.eval(await bundle);
    const flush = async (fn = () => {}) => win.__act(async () => { fn(); await new Promise(resolve => setImmediate(resolve)); });
    const text = () => win.document.body.textContent as string;
    await flush(() => win.__mount('2026-09-01', '2026-09-30'));
    assert.equal(requests.length, 1); assert.equal(requests[0].init.cache, 'no-store'); assert.equal(new Headers(requests[0].init.headers).get('Authorization'), 'Bearer qa-admin');
    await flush(() => requests[0].resolve(json(body())));
    assert.match(text(), /1\s?234,50/); assert.match(text(), /Niedostępne — brak pełnych danych/);
    await flush(() => win.__mount('2026-08-01', '2026-08-31'));
    assert.doesNotMatch(text(), /1\s?234,50/); assert.match(text(), /Odczytuję/);
    await flush(() => win.__mount('2026-07-01', '2026-07-31'));
    assert.equal(requests[1].init.signal?.aborted, true);
    await flush(() => requests[1].resolve(json(body(999999))));
    assert.doesNotMatch(text(), /9\s?999,99/);
    await flush(() => requests[2].resolve(json({ error: 'Forbidden' }, 403)));
    assert.match(text(), /Zaloguj się ponownie/); assert.doesNotMatch(text(), /1\s?234,50|0,00/);
    await flush(() => win.document.querySelector('button').click());
    await flush(() => requests[3].resolve(json(body(5050))));
    assert.match(text(), /50,50/); assert.doesNotMatch(text(), /Zaloguj się ponownie/);
    await flush(() => win.__unmount()); dom.window.close(); assert.deepEqual(errors, []);
});
