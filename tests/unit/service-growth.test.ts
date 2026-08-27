import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { getServiceGrowthConfig } from '../../src/lib/serviceGrowth.ts';

test('family service page owns family intent and routes to the family booking service', () => {
    const config = getServiceGrowthConfig('sesja-rodzinna');

    assert.ok(config);
    assert.equal(config.bookingService, 'Sesja');
    assert.match(config.metaTitle, /Sesja rodzinna Toruń/i);
    assert.doesNotMatch(`${config.metaTitle} ${config.metaDescription}`, /\d+\s*zł/);
});

test('wedding service page owns wedding intent and routes to the wedding booking service', () => {
    const config = getServiceGrowthConfig('slub');

    assert.ok(config);
    assert.equal(config.bookingService, 'Ślub');
    assert.match(config.metaTitle, /Fotograf ślubny Toruń/i);
    assert.doesNotMatch(`${config.metaTitle} ${config.metaDescription}`, /\d+\s*zł/);
});

test('service SEO price is derived from active Package records at render time', async () => {
    const source = await readFile(new URL('../../src/app/[slug]/page.tsx', import.meta.url), 'utf8');
    assert.match(source, /findActivePublicPackages\(\{ serviceName: growthConfig\.bookingService \}\)/);
    assert.match(source, /minimumPrice = packages\.length > 0 \? Math\.min/);
    assert.match(source, /Aktywne pakiety od \$\{formatPrice\(minimumPrice\)\}/);
});

test('growth copy does not use rejected generic phrases', () => {
    const copy = [getServiceGrowthConfig('sesja-rodzinna'), getServiceGrowthConfig('slub')]
        .filter(Boolean)
        .map((config) => JSON.stringify(config))
        .join(' ')
        .toLowerCase();

    for (const phrase of ['bez sztucznego pozowania', 'naturalne emocje', 'magiczne chwile', 'opowiedz swoją historię']) {
        assert.equal(copy.includes(phrase), false, `Rejected phrase found: ${phrase}`);
    }
});

test('unknown slug does not receive an SEO growth override', () => {
    assert.equal(getServiceGrowthConfig('portfolio'), null);
});
