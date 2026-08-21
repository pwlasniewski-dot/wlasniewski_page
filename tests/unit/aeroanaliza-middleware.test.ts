import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import middleware from '../../src/middleware.ts';

function request(host: string, path: string) {
    return new NextRequest(`https://${host}${path}`, { headers: { host } });
}

test('canonicalizes the www Aero host in one permanent redirect', async () => {
    const response = await middleware(request('www.aeroanaliza.pl', '/termowizja?utm_source=test'));
    assert.equal(response.status, 308);
    assert.equal(response.headers.get('location'), 'https://aeroanaliza.pl/termowizja?utm_source=test');
});

test('moves historical B2B subdomains directly to the canonical Aero host', async () => {
    const response = await middleware(request('b2b.wlasniewski.pl', '/b2b/termowizja?utm_source=legacy'));
    assert.equal(response.status, 308);
    assert.equal(response.headers.get('location'), 'https://aeroanaliza.pl/termowizja?utm_source=legacy');

    const drone = await middleware(request('dron.wlasniewski.pl', '/dron'));
    assert.equal(drone.status, 308);
    assert.equal(drone.headers.get('location'), 'https://aeroanaliza.pl/');
});

test('does not rewrite Aero robots to the old missing B2B route', async () => {
    const response = await middleware(request('aeroanaliza.pl', '/robots.txt'));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-middleware-next'), '1');
    assert.equal(response.headers.get('x-middleware-rewrite'), null);
});

test('rewrites only the canonical sitemap implementation', async () => {
    const response = await middleware(request('aeroanaliza.pl', '/sitemap.xml'));
    assert.equal(response.headers.get('x-middleware-rewrite'), 'https://aeroanaliza.pl/b2b/sitemap.xml');
});

test('removes old generic and photography routes from Aero', async () => {
    const oldDrone = await middleware(request('aeroanaliza.pl', '/dron'));
    assert.equal(oldDrone.status, 308);
    assert.equal(oldDrone.headers.get('location'), 'https://aeroanaliza.pl/');

    const gallery = await middleware(request('aeroanaliza.pl', '/galeria/test'));
    assert.equal(gallery.status, 308);
    assert.equal(gallery.headers.get('location'), 'https://wlasniewski.pl/galeria/test');
});

test('does not treat a b2b-looking external path as an Aero redirect', async () => {
    const response = await middleware(request('aeroanaliza.pl', '/b2bevil.com'));
    assert.equal(response.headers.get('location'), null);
    assert.equal(response.headers.get('x-middleware-rewrite'), 'https://aeroanaliza.pl/b2b/b2bevil.com');
});

test('moves legacy technical paths away from the photography host', async () => {
    const response = await middleware(request('wlasniewski.pl', '/b2b/fotowoltaika?source=old'));
    assert.equal(response.status, 308);
    assert.equal(response.headers.get('location'), 'https://aeroanaliza.pl/inspekcja-fotowoltaiki-dronem?source=old');
});
