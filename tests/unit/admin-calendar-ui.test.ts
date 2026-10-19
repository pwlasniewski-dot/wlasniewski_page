import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');

test('manual calendar form: save calls refresh, conflict preserves fields and reports error', async () => {
    const bundle = await build({
        stdin: { contents: `import React, {act} from 'react'; import {createRoot} from 'react-dom/client';
          import AddCalendarBooking from './src/components/admin/AddCalendarBooking';
          window.IS_REACT_ACT_ENVIRONMENT=true; window.act=act; window.created=0;
          window.root=createRoot(document.getElementById('root'));
          window.mount=()=>window.root.render(<AddCalendarBooking onCreated={()=>window.created++}/>);`, loader: 'tsx', resolveDir: process.cwd() },
        bundle: true, write: false, platform: 'browser', format: 'iife', jsx: 'automatic',
        define: { 'process.env.NODE_ENV': '"development"' },
    });
    const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'https://example.test/admin/dashboard', runScripts: 'dangerously' });
    const win = dom.window as any;
    win.MessageChannel = class { port1: { onmessage: (() => void) | null } = { onmessage: null }; port2 = { postMessage: () => setTimeout(() => this.port1.onmessage?.(), 0) }; };
    const requests: any[] = [];
    let conflict = false;
    win.localStorage.setItem('admin_token', 'admin-test');
    win.fetch = async (url: string, init: any) => {
        requests.push({ url, ...init });
        return { ok: !conflict, status: conflict ? 409 : 201, json: async () => conflict ? { message: 'Ten termin koliduje z istniejącą rezerwacją.' } : { ok: true, id: 17 } };
    };
    win.eval(bundle.outputFiles[0].text);
    const act = async (run: () => void) => win.act(async () => { run(); await new Promise(resolve => setImmediate(resolve)); });
    const fill = () => {
        const values = { client_name: 'Anna Testowa', email: 'anna@example.test', service: 'Sesja rodzinna', date: '2026-11-20', start_time: '12:00', end_time: '13:00', price: '450', notes: 'Rozmowa telefoniczna' };
        for (const [key, value] of Object.entries(values)) win.document.querySelector(`[name="${key}"]`).value = value;
    };
    try {
        await act(() => win.mount());
        assert.equal(win.document.querySelector('form'), null);
        await act(() => win.document.querySelector('button').click());
        fill();
        await act(() => win.document.querySelector('form').dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true })));
        assert.equal(requests.length, 1);
        assert.equal(requests[0].url, '/api/admin/calendar-events');
        assert.equal(requests[0].headers.Authorization, 'Bearer admin-test');
        assert.equal(JSON.parse(requests[0].body).price, 450);
        assert.equal(win.created, 1);
        assert.equal(win.document.querySelector('form'), null);
        assert.match(win.document.querySelector('[role="status"]').textContent, /Termin zapisany/);
        await act(() => win.document.querySelector('button').click());
        fill(); conflict = true;
        await act(() => win.document.querySelector('form').dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true })));
        assert.equal(win.created, 1);
        assert.match(win.document.querySelector('[role="alert"]').textContent, /koliduje/);
        assert.equal(win.document.querySelector('[name="client_name"]').value, 'Anna Testowa');
        assert.equal(win.document.querySelector('[name="date"]').value, '2026-11-20');
        assert.equal(win.document.querySelector('[name="notes"]').value, 'Rozmowa telefoniczna');
        assert.equal(win.document.querySelector('button[type="button"]').disabled, false);
    } finally {
        await act(() => win.root.unmount());
        win.close();
    }
});
