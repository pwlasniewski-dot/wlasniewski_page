import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const booking = readFileSync(new URL('../../src/app/rezerwacja/page.tsx', import.meta.url), 'utf8');
const checkout = readFileSync(new URL('../../src/app/api/basket/checkout/route.ts', import.meta.url), 'utf8');
const legacy = readFileSync(new URL('../../src/app/rezerwacja/dron/page.tsx', import.meta.url), 'utf8');
const schema = readFileSync(new URL('../../prisma/schema.prisma', import.meta.url), 'utf8');
const admin = readFileSync(new URL('../../src/app/admin/bookings/page.tsx', import.meta.url), 'utf8');

test('standalone drone and drone add-on share cart, checkout and PayU', () => {
    assert.match(booking, /productId: chosenPackage\.source === 'drone_cms'/);
    assert.match(booking, /selectedDroneAddonSlug/);
    assert.match(checkout, /createPayUOrder/);
    assert.match(checkout, /basePrice \+ \(isDroneStandalone \? 0 : dronePackage\?\.price \|\| 0\)/);
});

test('server derives drone prices from CMS and never accepts browser total as price', () => {
    assert.match(checkout, /selected\.price \* 100/);
    assert.match(checkout, /addon\.price \* 100/);
    assert.doesNotMatch(checkout, /verifiedPrice\s*=\s*totalAmount/);
});

test('booking stores account, flight, payment and immutable order context for admin', () => {
    for (const field of ['client_id', 'drone_package_slug', 'flight_check_status', 'booking_snapshot', 'booking_kind']) {
        assert.match(schema, new RegExp(field));
        assert.match(checkout, new RegExp(field));
    }
    assert.match(admin, /Dron i kontrola lotu/);
    assert.match(admin, /PayU order ID/);
});

test('old drone booking URL redirects into the one reservation interface', () => {
    assert.match(legacy, /redirect\(`\/rezerwacja\?/);
    assert.doesNotMatch(legacy, /DronePhotographyBookingForm/);
});
