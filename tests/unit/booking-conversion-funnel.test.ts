import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { dateISOInTimeZone, isBookingDateAllowed, isBookingStartInFuture, isCurrentOrPastMonth, isPastBookingDate, localDateISO, minimumBookingDateISO } from '../../src/lib/bookingDate.ts';
import { hasBookingConflict, isRequestedTimeAllowed, parseAvailableHours, parseCalendarAvailabilityPayload } from '../../src/lib/bookingAvailability.ts';
import { checkoutItemsWithCurrentAttribution, parseConsentedClientAttribution, stripAttributionFromStoredCart } from '../../src/lib/analytics/clientAttribution.ts';
import { calculateFotoMatchDiscount } from '../../src/lib/fotoMatchDiscount.ts';

test('booking calendar rejects previous days and locks navigation before the current month', () => {
    const now = new Date(2026, 7, 26, 12, 0, 0);

    assert.equal(localDateISO(now), '2026-08-26');
    assert.equal(isPastBookingDate('2026-08-25', now), true);
    assert.equal(isPastBookingDate('2026-08-26', now), false);
    assert.equal(isPastBookingDate('2026-08-27', now), false);
    assert.equal(isPastBookingDate('invalid', now), true);
    assert.equal(isPastBookingDate('2026-02-31', now), true);
    assert.equal(dateISOInTimeZone(new Date('2026-08-26T22:30:00.000Z'), 'Europe/Warsaw'), '2026-08-27');
    assert.equal(isPastBookingDate('2026-08-26', new Date('2026-08-26T22:30:00.000Z'), 'Europe/Warsaw'), true);
    assert.equal(isCurrentOrPastMonth(new Date(2026, 7, 1), now), true);
    assert.equal(isCurrentOrPastMonth(new Date(2026, 8, 1), now), false);
});

test('minimum lead time and same-day hours are enforced in Warsaw time', () => {
    const now = new Date('2026-08-26T12:30:00.000Z'); // 14:30 in Warsaw
    assert.equal(minimumBookingDateISO(7, now, 'Europe/Warsaw'), '2026-09-02');
    assert.equal(isBookingDateAllowed('2026-09-01', 7, now, 'Europe/Warsaw'), false);
    assert.equal(isBookingDateAllowed('2026-09-02', 7, now, 'Europe/Warsaw'), true);
    assert.equal(isBookingStartInFuture('2026-08-26', '14:00', now, 'Europe/Warsaw'), false);
    assert.equal(isBookingStartInFuture('2026-08-26', '15:00', now, 'Europe/Warsaw'), true);
});

test('Foto-Match BOTH voucher has one shared frontend/backend calculation', () => {
    assert.deepEqual(calculateFotoMatchDiscount({
        baseAmountGrosze: 100_000,
        rewardType: 'BOTH',
        rewardAmountGrosze: 10_000,
        rewardPercent: 15,
    }), {
        discountGrosze: 25_000,
        amountPartGrosze: 10_000,
        percentPartGrosze: 15_000,
    });
});

test('availability uses configured hours and rejects overlaps or unreliable legacy ranges', () => {
    assert.deepEqual(parseAvailableHours('9, 10,17,17,invalid'), [9, 10, 17]);
    assert.deepEqual(parseAvailableHours(''), [9, 10, 11, 12, 13, 14, 15, 16, 17]);
    assert.equal(isRequestedTimeAllowed({ startTime: '09:00', endTime: '11:00', durationHours: 2, availableHours: '9,10,11', blocksEntireDay: false }), true);
    assert.equal(isRequestedTimeAllowed({ startTime: '17:00', endTime: '19:00', durationHours: 2, availableHours: '9,10,17', blocksEntireDay: false }), false);
    assert.equal(hasBookingConflict([{ start_time: '10:00', end_time: '12:00' }], { blocksEntireDay: false, startTime: '11:00', endTime: '13:00' }), true);
    assert.equal(hasBookingConflict([{ start_time: '10:00', end_time: '12:00' }], { blocksEntireDay: false, startTime: '12:00', endTime: '13:00' }), false);
    assert.equal(hasBookingConflict([{ blocks_entire_day: true }], { blocksEntireDay: false, startTime: '12:00', endTime: '13:00' }), true);
});

test('calendar accepts only a complete availability response and fails closed on API errors', async () => {
    assert.deepEqual(parseCalendarAvailabilityPayload({
        availability: {
            '2026-09-03': {
                fullDay: false,
                booked: ['09:00', 'invalid'],
                ranges: [{ start: '10:00', end: '12:00' }],
            },
        },
        minBookingDate: '2026-09-03',
    }), {
        availability: {
            '2026-09-03': {
                fullDay: false,
                booked: ['09:00'],
                ranges: [{ start: '10:00', end: '12:00' }],
            },
        },
        minBookingDate: '2026-09-03',
    });
    assert.equal(parseCalendarAvailabilityPayload({ ok: false, message: 'Błąd serwera' }), null);
    assert.equal(parseCalendarAvailabilityPayload({ availability: {}, minBookingDate: 'invalid' }), null);

    const calendar = await readFile(new URL('../../src/components/BookingCalendar.tsx', import.meta.url), 'utf8');
    const monthlyAvailability = await readFile(new URL('../../src/app/api/bookings/route.ts', import.meta.url), 'utf8');
    const dayAvailability = await readFile(new URL('../../src/app/api/availability/route.ts', import.meta.url), 'utf8');

    assert.match(calendar, /if \(!response\.ok\) throw/);
    assert.match(calendar, /availabilityStatus !== "ready"/);
    assert.match(calendar, /Kalendarz został bezpiecznie zablokowany/);
    assert.doesNotMatch(calendar, /data\.availability \|\| data/);
    for (const source of [monthlyAvailability, dayAvailability]) {
        assert.match(source, /select:\s*\{[\s\S]*?status:\s*true,[\s\S]*?start_time:\s*true,[\s\S]*?end_time:\s*true,[\s\S]*?blocks_entire_day:\s*true/);
    }
});

test('sales attribution leaves browser storage only after analytics consent', () => {
    const stored = JSON.stringify({
        id: 'b54ecbf0-f4b7-4fa3-86fd-ff4ef4fc043b',
        landing_page: '/fotograf-torun',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'family_august',
    });

    assert.deepEqual(parseConsentedClientAttribution(null, stored), {});
    assert.deepEqual(parseConsentedClientAttribution('rejected', stored), {});
    assert.deepEqual(parseConsentedClientAttribution('accepted', stored), {
        analytics_session_id: 'b54ecbf0-f4b7-4fa3-86fd-ff4ef4fc043b',
        landing_page: '/fotograf-torun',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'family_august',
    });
});

test('withdrawing consent removes attribution already persisted in the cart before checkout', () => {
    const storedItem = {
        id: 'booking-1',
        type: 'booking',
        metadata: {
            date: '2026-09-12',
            analytics_session_id: 'old-session',
            landing_page: '/fotograf-torun',
            utm_source: 'google',
            utm_medium: 'cpc',
            utm_campaign: 'old-campaign',
        },
    } as const;

    const rejectedCheckout = checkoutItemsWithCurrentAttribution([storedItem], {});
    assert.deepEqual(rejectedCheckout[0].metadata, { date: '2026-09-12' });

    const sanitizedStoredCart = stripAttributionFromStoredCart(JSON.stringify([storedItem]));
    assert.ok(sanitizedStoredCart);
    assert.deepEqual(JSON.parse(sanitizedStoredCart!)[0].metadata, { date: '2026-09-12' });

    const acceptedAgain = checkoutItemsWithCurrentAttribution([storedItem], {
        analytics_session_id: 'new-session',
        landing_page: '/slub',
    });
    assert.equal(acceptedAgain[0].metadata.analytics_session_id, 'new-session');
    assert.equal(acceptedAgain[0].metadata.landing_page, '/slub');
    assert.equal('utm_source' in acceptedAgain[0].metadata, false);
});

test('soft inquiry records a real start and only records submission after a canonical inquiry exists', async () => {
    const source = await readFile(new URL('../../src/components/CityLeadForm.tsx', import.meta.url), 'utf8');

    assert.match(source, /if \(inquiryStarted\.current\) return;/);
    assert.match(source, /localStorage\.getItem\('cookie_consent'\) !== 'accepted'/);
    assert.match(source, /trackEvent\('photo_inquiry_started'/);
    assert.match(source, /city_slug:/);
    assert.match(source, /service_slug:/);
    assert.match(source, /lead_source:/);
    assert.match(source, /return normalized\.startsWith\('photo:'\)/);
    assert.match(source, /if \(!response\.ok \|\| !result\?\.inquiryId\) throw/);
    assert.match(source, /trackEvent\('photo_inquiry_submitted'/);
    for (const field of ['analytics_session_id', 'landing_page', 'utm_source', 'utm_medium', 'utm_campaign']) {
        assert.ok((await readFile(new URL('../../src/lib/analytics/clientAttribution.ts', import.meta.url), 'utf8')).includes(field));
    }
    for (const field of ['preferred_date', 'city_slug', 'package_slug']) {
        assert.ok(source.includes(field), `missing soft inquiry context: ${field}`);
    }
});

test('full booking has one hour picker, early deposit disclosure and consented attribution', async () => {
    const source = await readFile(new URL('../../src/app/rezerwacja/page.tsx', import.meta.url), 'utf8');
    const checkoutApi = await readFile(new URL('../../src/app/api/basket/checkout/route.ts', import.meta.url), 'utf8');
    const funnelConfig = await readFile(new URL('../../src/lib/marketing/photo-funnel.ts', import.meta.url), 'utf8');

    assert.match(source, /showTimeSlots=\{false\}/);
    assert.match(source, /<BookingFunnelIntro config=\{photoFunnelConfig\}/);
    assert.match(funnelConfig, /paymentSplitTemplate:\s*'Możesz wybrać zaliczkę/);
    assert.match(source, /const attribution = readConsentedClientAttribution\(\);/);
    assert.doesNotMatch(source, /await trackEvent\('service_selected'\);/);
    assert.match(source, /onClick=\{\(\) => \{[\s\S]*?trackEvent\('service_selected'\)/);
    assert.match(source, /trackEvent\('booking_start'/);
    assert.match(source, /setSlot\(current => current \? \{ date: current\.date \} : null\)/);
    assert.match(source, /id="booking-start-time"/);
    assert.match(source, /end_day_offset: slot\.endDayOffset \?\? 0/);
    assert.doesNotMatch(source, /data\.fullDayAvailable === true/);
    assert.doesNotMatch(source, /fullDayAvailable === true/);
    assert.match(checkoutApi, /pg_advisory_xact_lock/);
    assert.match(checkoutApi, /const bookingDateISO = String\(md\.date \|\| ''\);/);
    assert.doesNotMatch(checkoutApi, /String\(md\.date \|\| ''\)\.slice\(0, 10\)/);
});

test('offer administration writes require administrator authentication', async () => {
    const serviceTypesApi = await readFile(new URL('../../src/app/api/service-types/route.ts', import.meta.url), 'utf8');
    const packageApi = await readFile(new URL('../../src/app/api/packages/route.ts', import.meta.url), 'utf8');
    assert.match(serviceTypesApi, /export async function POST[\s\S]*?requireAuth\(request\)/);
    assert.match(serviceTypesApi, /export async function DELETE[\s\S]*?requireAuth\(request\)/);
    assert.match(packageApi, /export async function POST[\s\S]*?requireAuth\(request\)/);
});

test('checkout reuses booking contact and promo API has no hard-coded returning discount', async () => {
    const checkout = await readFile(new URL('../../src/app/checkout/page.tsx', import.meta.url), 'utf8');
    const checkoutApi = await readFile(new URL('../../src/app/api/basket/checkout/route.ts', import.meta.url), 'utf8');
    const bookingPage = await readFile(new URL('../../src/app/rezerwacja/page.tsx', import.meta.url), 'utf8');
    const promoApi = await readFile(new URL('../../src/app/api/promo-codes/check/route.ts', import.meta.url), 'utf8');

    assert.match(checkout, /bookingContactPrefilled/);
    assert.match(checkout, /booking\.metadata\.name/);
    assert.doesNotMatch(bookingPage, /WRACAM15|FALLBACK_RETURNING_PROMO/);
    assert.doesNotMatch(promoApi, /WRACAM15/);
    assert.match(promoApi, /promoCode\.is_active/);
    assert.match(promoApi, /promoCode\.valid_until/);
    assert.match(checkoutApi, /code:\s*\{ equals: promoCode, mode: 'insensitive' \}/);
    assert.match(checkoutApi, /appliedPromoCode = promo\.code/);
});

test('checkout and confirmation count only a server-confirmed PayU payment', async () => {
    const checkoutPage = await readFile(new URL('../../src/app/checkout/page.tsx', import.meta.url), 'utf8');
    const checkoutApi = await readFile(new URL('../../src/app/api/basket/checkout/route.ts', import.meta.url), 'utf8');
    const confirmationPage = await readFile(new URL('../../src/app/rezerwacja/potwierdzenie/page.tsx', import.meta.url), 'utf8');
    const paymentStatusApi = await readFile(new URL('../../src/app/api/bookings/payment-status/route.ts', import.meta.url), 'utf8');

    assert.match(checkoutApi, /items\.length !== 1/);
    assert.match(checkoutApi, /const verifiedTotalAmount = payuProducts\.reduce/);
    assert.match(checkoutApi, /paymentRequired:\s*true/);
    assert.ok(checkoutPage.indexOf("trackEvent('payment_started'") > checkoutPage.indexOf('const paymentRequired = data.paymentRequired === true'));
    assert.match(confirmationPage, /\/api\/bookings\/payment-status\?order=/);
    assert.match(confirmationPage, /result\?\.state === 'confirmed'/);
    assert.match(confirmationPage, /transaction_id:\s*order/);
    assert.match(paymentStatusApi, /stripe_session_id:\s*order/);
    assert.match(paymentStatusApi, /state:\s*confirmed \? 'confirmed'/);
    assert.match(paymentStatusApi, /booking\.status === 'deposit_paid'/);
    assert.match(paymentStatusApi, /booking\.price === 0 \? 'covered'/);
    assert.match(confirmationPage, /bookingSettlement === 'deposit'/);
    assert.match(confirmationPage, /bookingSettlement === 'covered'/);
});

test('promo limits are reserved under a transaction lock and consumed once after payment', async () => {
    const checkoutApi = await readFile(new URL('../../src/app/api/basket/checkout/route.ts', import.meta.url), 'utf8');
    const notifyApi = await readFile(new URL('../../src/app/api/payu/notify/route.ts', import.meta.url), 'utf8');
    const promoCheckApi = await readFile(new URL('../../src/app/api/promo-codes/check/route.ts', import.meta.url), 'utf8');

    assert.match(checkoutApi, /promo-code:\$\{appliedPromoCode\.toUpperCase\(\)\}/);
    assert.match(checkoutApi, /pendingPromoReservations/);
    assert.match(checkoutApi, /lockedPromo\.usage_count \+ pendingPromoReservations >= lockedPromo\.max_usage/);
    assert.match(notifyApi, /payu-booking:\$\{initialBooking\.id\}:\$\{cartId\}/);
    assert.match(notifyApi, /if \(booking\.status !== 'pending'\) return null/);
    assert.match(notifyApi, /usage_count:\s*\{ increment: 1 \}/);
    assert.match(promoCheckApi, /promoCode\.usage_count \+ reservedUses >= promoCode\.max_usage/);
});

test('legacy UTM tracker cannot persist attribution before analytics consent', async () => {
    const source = await readFile(new URL('../../src/components/UtmTracker.tsx', import.meta.url), 'utf8');
    assert.match(source, /consent !== 'accepted'/);
    assert.match(source, /if \(consent === 'rejected'\) clearLegacyAttribution\(\)/);
    assert.match(source, /window\.addEventListener\('cookie-consent-changed'/);
    const checkout = await readFile(new URL('../../src/app/checkout/page.tsx', import.meta.url), 'utf8');
    const cookieBanner = await readFile(new URL('../../src/components/CookieBanner.tsx', import.meta.url), 'utf8');
    assert.match(checkout, /checkoutItemsWithCurrentAttribution\(items, readConsentedClientAttribution\(\)\)/);
    assert.match(cookieBanner, /stripAttributionFromStoredCart/);
});

test('city and service entry pages expose booking and no-payment inquiry paths', async () => {
    const servicePage = await readFile(new URL('../../src/app/[slug]/page.tsx', import.meta.url), 'utf8');
    const cityPage = await readFile(new URL('../../src/app/fotograf-[city]/page.tsx', import.meta.url), 'utf8');
    const funnelConfig = await readFile(new URL('../../src/lib/marketing/photo-funnel.ts', import.meta.url), 'utf8');
    const serviceGrowth = await readFile(new URL('../../src/lib/serviceGrowth.ts', import.meta.url), 'utf8');
    const cityLeadSection = await readFile(new URL('../../src/components/CityLeadSection.tsx', import.meta.url), 'utf8');

    assert.match(servicePage, /photoFunnelConfig\.copy\.inquiryCtaLabel/);
    assert.match(servicePage, /package_id/);
    assert.match(servicePage, /package_slug/);
    assert.match(cityPage, /<CityLeadSection/);
    assert.match(cityPage, /photoFunnelConfig/);
    assert.match(cityPage, /cityMetaDescription\(key, data, publicMinimumPrices\)/);
    assert.match(cityPage, /configuredBookingCta\(photoFunnelConfig, 'Sesja'\)/);
    assert.match(servicePage, /funnelConfig\.copy\.packageBookingCtaLabel/);
    assert.doesNotMatch(`${cityPage}\n${serviceGrowth}`, /(?:750|1900)\s*zł/);
    assert.doesNotMatch(serviceGrowth, /bookingLabel/);
    assert.match(servicePage, /<Suspense[\s\S]*?<CityLeadForm/);
    assert.match(cityLeadSection, /<Suspense[\s\S]*?<CityLeadForm/);
    assert.match(funnelConfig, /inquiryCtaLabel:\s*'Zapytaj o termin — bez płatności'/);
});
