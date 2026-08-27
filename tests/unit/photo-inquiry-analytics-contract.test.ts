import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('analytics ingest accepts explicit photography inquiry lifecycle events', async () => {
  const source = await readFile(new URL('../../src/app/api/analytics/v2/track/route.ts', import.meta.url), 'utf8');
  assert.ok(source.includes("'v2_photo_inquiry_started'"));
  assert.ok(source.includes("'v2_photo_inquiry_submitted'"));
});

test('contact API persists canonical attribution before sending notification', async () => {
  const source = await readFile(new URL('../../src/app/api/contact/route.ts', import.meta.url), 'utf8');
  const attribution = await readFile(new URL('../../src/lib/analytics/salesAttribution.ts', import.meta.url), 'utf8');
  assert.ok(source.indexOf('prisma.inquiry.create') < source.indexOf('const result = await sendEmail'));
  for (const contract of ['salesAttributionFromPayload(body)', '...attribution', 'city_slug', 'package_slug']) {
    assert.ok(source.includes(contract), `missing contact attribution contract: ${contract}`);
  }
  for (const field of ['analytics_session_id', 'landing_page', 'utm_source', 'utm_medium', 'utm_campaign']) {
    assert.ok(attribution.includes(field), `missing sanitized attribution field: ${field}`);
  }
});

test('canonical bookings retain the consented landing and campaign attribution', async () => {
  const checkout = await readFile(new URL('../../src/app/api/basket/checkout/route.ts', import.meta.url), 'utf8');
  const schema = await readFile(new URL('../../prisma/schema.prisma', import.meta.url), 'utf8');
  assert.ok(checkout.includes('salesAttributionFromPayload(md)'));
  for (const field of ['analytics_session_id', 'landing_page', 'utm_source', 'utm_medium', 'utm_campaign']) {
    assert.ok(schema.includes(field), `missing schema attribution field: ${field}`);
  }
});

test('V3 exposes a separate photography funnel and canonical inquiries', async () => {
  const source = await readFile(new URL('../../src/app/api/analytics/v3/dashboard/route.ts', import.meta.url), 'utf8');
  for (const contract of ['canonicalPhotoInquiries', 'isPhotoInquirySource', 'v2_photo_inquiry_started', 'v2_photo_inquiry_submitted', 'photoSales:', 'photo: {']) {
    assert.ok(source.includes(contract), `missing V3 photography funnel contract: ${contract}`);
  }
  for (const contract of ['SUCCESSFUL_BOOKING_STATUSES', 'canonicalBookingAttempts', 'successfulBookings', 'entryFunnel:', 'branches:', 'photo_checkout_submit', 'photo_booking_success']) {
    assert.ok(source.includes(contract), `missing dual-path sales contract: ${contract}`);
  }
});
