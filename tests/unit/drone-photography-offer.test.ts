import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
    DRONE_PHOTOGRAPHY_AREAS,
    DRONE_PHOTOGRAPHY_PACKAGES,
    droneBookingHref,
    formatDronePrice,
    getDronePhotographyPackage,
} from '../../src/lib/dronePhotographyOffer.ts';

const landingSource = readFileSync(new URL('../../src/app/fotografia-z-drona/page.tsx', import.meta.url), 'utf8');
const bookingSource = readFileSync(new URL('../../src/components/DronePhotographyBookingForm.tsx', import.meta.url), 'utf8');

test('drone offer has three direct products and a wedding add-on', () => {
    assert.deepEqual(DRONE_PHOTOGRAPHY_PACKAGES.map(item => item.slug), [
        'nieruchomosc-foto',
        'foto-film',
        'firma-obiekt',
        'slub-dodatek',
    ]);
    assert.equal(getDronePhotographyPackage('slub-dodatek').audience, 'slub');
    assert.equal(formatDronePrice(getDronePhotographyPackage('slub-dodatek')), '+690 zł');
});

test('pricing matches the market-positioned entry points shown on the landing page', () => {
    assert.deepEqual(DRONE_PHOTOGRAPHY_PACKAGES.map(item => item.price), [449, 990, 1290, 690]);
    assert.match(landingSource, /Pakiety od/);
    assert.match(landingSource, /449 zł/);
});

test('offer owns the five target regions and sends every package to dedicated drone booking', () => {
    assert.deepEqual([...DRONE_PHOTOGRAPHY_AREAS], ['Toruń', 'Grudziądz', 'Wąbrzeźno', 'Chełmno', 'Świecie']);
    for (const item of DRONE_PHOTOGRAPHY_PACKAGES) {
        const href = droneBookingHref(item.slug, 'test');
        assert.match(href, /^\/rezerwacja\/dron\?/);
        assert.match(href, new RegExp(`pakiet=${item.slug}`));
    }
});

test('booking asks for the business task, location and preferred date before creating a lead', () => {
    assert.match(bookingSource, /Główne zadanie materiału/);
    assert.match(bookingSource, /Miejscowość realizacji/);
    assert.match(bookingSource, /Preferowana data/);
    assert.match(bookingSource, /drone_booking_submitted/);
    assert.match(bookingSource, /To rezerwacja wstępna — bez płatności na tym etapie/);
});

test('AI visualisations cannot be presented as completed portfolio work', () => {
    assert.match(landingSource, /Nie\. Portfolio służy do pokazania wykonanych przeze mnie materiałów/);
    assert.match(landingSource, /wyraźnie oznaczona/);
});
