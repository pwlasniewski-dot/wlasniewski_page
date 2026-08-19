import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
    DEFAULT_DRONE_PHOTOGRAPHY_CONFIG,
    DRONE_PHOTOGRAPHY_AREAS,
    DRONE_PHOTOGRAPHY_PACKAGES,
    droneBookingHref,
    formatDronePrice,
    getDronePhotographyPackage,
    parseDronePhotographyConfig,
    validateDronePhotographyConfig,
} from '../../src/lib/dronePhotographyOffer.ts';

const landingSource = readFileSync(new URL('../../src/app/fotografia-z-drona/page.tsx', import.meta.url), 'utf8');
const bookingSource = readFileSync(new URL('../../src/components/DronePhotographyBookingForm.tsx', import.meta.url), 'utf8');
const orderApiSource = readFileSync(new URL('../../src/app/api/drone/order/route.ts', import.meta.url), 'utf8');
const adminEditorSource = readFileSync(new URL('../../src/components/admin/DronePhotographyPageEditor.tsx', import.meta.url), 'utf8');

test('default drone offer has three direct products and a wedding add-on', () => {
    assert.deepEqual(DRONE_PHOTOGRAPHY_PACKAGES.map(item => item.slug), [
        'nieruchomosc-foto',
        'foto-film',
        'firma-obiekt',
        'slub-dodatek',
    ]);
    assert.equal(getDronePhotographyPackage('slub-dodatek').audience, 'slub');
    assert.equal(formatDronePrice(getDronePhotographyPackage('slub-dodatek')), '+690 zł');
});

test('market-positioned defaults survive a CMS JSON round trip', () => {
    const parsed = parseDronePhotographyConfig(JSON.stringify(DEFAULT_DRONE_PHOTOGRAPHY_CONFIG));
    assert.deepEqual(parsed.packages.map(item => item.price), [449, 990, 1290, 690]);
    assert.deepEqual(parsed.areas, ['Toruń', 'Grudziądz', 'Wąbrzeźno', 'Chełmno', 'Świecie']);
    assert.equal(validateDronePhotographyConfig(parsed).valid, true);
    assert.deepEqual([...DRONE_PHOTOGRAPHY_AREAS], parsed.areas);
});

test('invalid or unsafe CMS package state is rejected before save', () => {
    const invalid = parseDronePhotographyConfig(DEFAULT_DRONE_PHOTOGRAPHY_CONFIG);
    invalid.packages[1].slug = invalid.packages[0].slug;
    const result = validateDronePhotographyConfig(invalid);
    assert.equal(result.valid, false);
    if (!result.valid) assert.match(result.error, /więcej niż raz/);
});

test('every active CMS package leads to the dedicated booking funnel', () => {
    for (const item of DEFAULT_DRONE_PHOTOGRAPHY_CONFIG.packages) {
        const href = droneBookingHref(item.slug, 'test');
        assert.match(href, /^\/rezerwacja\/dron\?/);
        assert.match(href, new RegExp(`pakiet=${item.slug}`));
    }
});

test('offer, booking and order API consume the shared CMS configuration', () => {
    assert.match(landingSource, /loadDronePhotographyCmsPage/);
    assert.match(landingSource, /config\.packages/);
    assert.match(bookingSource, /packages: DronePhotographyPackage\[\]/);
    assert.match(bookingSource, /package_slug: selectedPackage\.slug/);
    assert.match(orderApiSource, /loadDronePhotographyCmsPage/);
    assert.match(orderApiSource, /config\.packages\.find/);
    assert.match(orderApiSource, /formatDronePrice\(selectedPackage\)/);
});

test('admin editor covers modules, packages, media and controlled visual variants', () => {
    assert.match(adminEditorSource, /Pakiety — jedno źródło ceny/);
    assert.match(adminEditorSource, /duplicateModule/);
    assert.match(adminEditorSource, /moveModule/);
    assert.match(adminEditorSource, /MediaPicker/);
    assert.match(adminEditorSource, /Font nagłówków/);
    assert.match(adminEditorSource, /Kolor akcentu/);
});

test('AI visualisations cannot be presented as completed portfolio work', () => {
    const faq = DEFAULT_DRONE_PHOTOGRAPHY_CONFIG.modules.find(module => module.type === 'faq');
    assert.ok(faq && faq.type === 'faq');
    const aiAnswer = faq.items.find(item => item.id === 'faq-ai')?.answer || '';
    assert.match(aiAnswer, /Nie\. Portfolio służy do pokazania wykonanych przeze mnie materiałów/);
    assert.match(aiAnswer, /wyraźnie oznaczona/);
});
