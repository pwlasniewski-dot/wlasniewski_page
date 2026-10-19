import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
const { JSDOM } = createRequire(import.meta.url)('jsdom');

test('Google sync: verified callback, auth, revision, failures, pending and disconnect preserve truthful state', async () => {
    const bundle = await build({ stdin: { contents: `import React, {act} from 'react'; import {createRoot} from 'react-dom/client';
        import GoogleCalendarSync from './src/components/admin/GoogleCalendarSync';
        window.IS_REACT_ACT_ENVIRONMENT=true; window.act=act; window.root=createRoot(document.getElementById('root'));
        window.mount=(revision=0)=>window.root.render(<GoogleCalendarSync revision={revision}/>);`, loader: 'tsx', resolveDir: process.cwd() },
        bundle: true, write: false, platform: 'browser', format: 'iife', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"' } });
    const dom = new JSDOM('<div id="root"></div>', { url: 'https://example.test/admin/dashboard?keep=yes&google_calendar=connected#calendar', runScripts: 'dangerously' });
    const win = dom.window as any;
    win.MessageChannel = class { port1 = { onmessage: null as any }; port2 = { postMessage: () => setTimeout(() => this.port1.onmessage?.(), 0) }; };
    let connected = true, fail = false, pending = false;
    let skipped: string | undefined;
    const requests: any[] = [];
    win.localStorage.setItem('admin_token', 'admin-test');
    win.fetch = async (url: string, init: any) => {
        requests.push({ url, ...init });
        if (url.endsWith('/disconnect') && !fail) connected = false;
        return { ok: !fail, status: fail ? 500 : 200, json: async () => url.endsWith('/sync') ? { created: 4, updated: 0, unchanged: 0, cancelled: 0, pending, skipped }
            : url.endsWith('/connect') ? { url: 'https://evil.example/steal' }
            : { configured: true, connected, email: connected ? 'admin@example.test' : null } };
    };
    win.eval(bundle.outputFiles[0].text);
    const act = async (fn: () => void) => win.act(async () => { fn(); await new Promise(resolve => setImmediate(resolve)); });
    const click = (label: string) => Array.from(win.document.querySelectorAll('button')).find((b: any) => b.textContent === label) as any;
    const syncCount = () => requests.filter(r => r.url.endsWith('/sync')).length;
    try {
        await act(() => win.mount());
        assert.equal(syncCount(), 1);
        assert.match(win.document.body.textContent, /Dodano: 4/);
        assert.match(win.document.body.textContent, /admin@example.test/);
        assert.equal(win.location.search, '?keep=yes'); assert.equal(win.location.hash, '#calendar');
        assert.ok(requests.every(r => r.headers.Authorization === 'Bearer admin-test'));
        await act(() => win.mount()); assert.equal(syncCount(), 1);
        pending = true;
        await act(() => win.mount(1)); assert.equal(syncCount(), 2);
        assert.match(win.document.body.textContent, /oczekuje lub jest w toku/);
        assert.doesNotMatch(win.document.body.textContent, /Synchronizacja zakończona/);
        pending = false; skipped = 'disconnected';
        await act(() => click('Synchronizuj teraz').click());
        assert.match(win.document.querySelector('[role="alert"]').textContent, /nie została wykonana/);
        assert.doesNotMatch(win.document.body.textContent, /Synchronizacja zakończona/);
        skipped = undefined;
        fail = true;
        await act(() => click('Synchronizuj teraz').click());
        assert.match(win.document.querySelector('[role="alert"]').textContent, /Nie udało/);
        assert.equal(click('Synchronizuj teraz').disabled, false);
        await act(() => click('Odłącz Google').click());
        await act(() => click('Tak, odłącz').click());
        assert.ok(click('Synchronizuj teraz'), 'failed disconnect must preserve connected state');
        fail = false;
        await act(() => click('Tak, odłącz').click());
        assert.match(win.document.body.textContent, /wydarzenia pozostają/);
        assert.ok(click('Połącz z Google'));
        await act(() => click('Połącz z Google').click());
        assert.match(win.document.querySelector('[role="alert"]').textContent, /Nieprawidłowy adres/);
        assert.ok(click('Połącz z Google'), 'connect response alone never marks connected');
    } finally { await act(() => win.root.unmount()); win.close(); }
});
