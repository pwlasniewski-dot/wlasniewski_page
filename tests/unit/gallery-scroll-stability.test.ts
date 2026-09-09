import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GalleryGridImage from '../../src/components/galleries/GalleryGridImage';

test('portrait and landscape photos reserve their recorded ratio before loading', () => {
    for (const [width, height] of [[4000, 6000], [6000, 4000]]) {
        const html = renderToStaticMarkup(React.createElement(GalleryGridImage, { src: '/fixture.jpg', alt: 'Zdjęcie', width, height }));
        assert.match(html, new RegExp(`width="${width}" height="${height}"`));
        assert.ok(html.includes(`aspect-ratio:${width} / ${height}`));
        assert.match(html, /object-contain/);
        assert.match(html, /decoding="async"/);
    }
});

test('missing or invalid dimensions keep a fixed fallback box after the image loads', () => {
    for (const [width, height] of [[null, null], [4000, null], [0, 6000], [-1, 20], [Infinity, 10]]) {
        const html = renderToStaticMarkup(React.createElement(GalleryGridImage, { src: '/portrait-without-metadata.jpg', alt: 'Zdjęcie', width, height }));
        assert.match(html, /width="1500" height="1000"/);
        // Explicit CSS ratio, without "auto", also fixes the loaded image box.
        assert.match(html, /aspect-ratio:1500 \/ 1000/);
        assert.match(html, /object-contain/);
    }
});

test('mobile hero ignores height-only resize, recalculates width changes and releases desktop', () => {
    const window = Object.assign(new EventTarget(), { innerWidth: 390, innerHeight: 844 });
    const properties = new Map<string, string>();
    let measurements = 0;
    const element = {
        style: {
            setProperty: (key: string, value: string) => properties.set(key, value),
            removeProperty: (key: string) => properties.delete(key),
        },
        getBoundingClientRect: () => { measurements++; return { height: Math.max(600, window.innerHeight * 0.9) }; },
    };
    let effect: () => (() => void);
    const exports: { useStableMobileHeight?: (ref: unknown) => void } = {};
    const code = ts.transpileModule(readFileSync('src/hooks/useStableMobileHeight.ts', 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
    }).outputText;
    runInNewContext(code, { window, exports, require: () => ({ useEffect: (fn: typeof effect) => { effect = fn; } }) });
    exports.useStableMobileHeight!({ current: element });
    const cleanup = effect!();
    const initial = properties.get('--gallery-hero-height');
    for (const height of [780, 720, 844, 920, 800]) {
        window.innerHeight = height;
        window.dispatchEvent(new Event('resize'));
        assert.equal(properties.get('--gallery-hero-height'), initial);
    }
    assert.equal(measurements, 1);
    window.innerWidth = 430;
    window.dispatchEvent(new Event('resize'));
    assert.equal(properties.get('--gallery-hero-height'), '720px');
    window.innerWidth = 1024;
    window.dispatchEvent(new Event('resize'));
    assert.equal(properties.has('--gallery-hero-height'), false);
    window.innerWidth = 390;
    window.dispatchEvent(new Event('resize'));
    assert.equal(properties.get('--gallery-hero-height'), '720px');
    cleanup();
    window.innerWidth = 400;
    window.dispatchEvent(new Event('resize'));
    assert.equal(properties.has('--gallery-hero-height'), false);
    assert.equal(measurements, 3);
});
