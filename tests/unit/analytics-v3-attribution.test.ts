import assert from 'node:assert/strict';
import test from 'node:test';
import { isSemanticCta, pathsBeforeFirstBookingStart } from '../../src/lib/analytics/v3Attribution.ts';

const at = (seconds: number) => new Date(1_700_000_000_000 + seconds * 1000);

test('only semantically marked conversion clicks count as CTA', () => {
  assert.equal(isSemanticCta({ event_type: 'v2_click', session_id: 's', created_at: at(0), metadata: { analytics_id: 'open-gallery' } }), false);
  assert.equal(isSemanticCta({ event_type: 'v2_click', session_id: 's', created_at: at(0), metadata: { analytics_id: 'cta-rezerwacja' } }), true);
  assert.equal(isSemanticCta({ event_type: 'v2_click', session_id: 's', created_at: at(0), metadata: { analytics_id: 'aero-cta-phone' } }), true);
  assert.equal(isSemanticCta({ event_type: 'v2_page_view', session_id: 's', created_at: at(0), metadata: { analytics_id: 'cta-rezerwacja' } }), false);
});

test('assisted pages only include views before first booking start', () => {
  const paths = pathsBeforeFirstBookingStart([
    { event_type: 'v2_page_view', session_id: 's', page_url: '/oferta', created_at: at(0) },
    { event_type: 'v2_booking_start', session_id: 's', page_url: '/rezerwacja', created_at: at(1) },
    { event_type: 'v2_page_view', session_id: 's', page_url: '/kontakt', created_at: at(2) },
  ], event => event.page_url || '/');
  assert.deepEqual(paths, ['/oferta']);
});

test('drone booking start closes the assisted-page path', () => {
  const paths = pathsBeforeFirstBookingStart([
    { event_type: 'v2_page_view', session_id: 's', page_url: '/fotografia-z-drona', created_at: at(0) },
    { event_type: 'v2_drone_booking_started', session_id: 's', page_url: '/rezerwacja/dron', created_at: at(1) },
    { event_type: 'v2_page_view', session_id: 's', page_url: '/kontakt', created_at: at(2) },
  ], event => event.page_url || '/');
  assert.deepEqual(paths, ['/fotografia-z-drona']);
});

test('Aero inquiry start closes the assisted-page path', () => {
  const paths = pathsBeforeFirstBookingStart([
    { event_type: 'v2_page_view', session_id: 's', page_url: '/termowizja', created_at: at(0) },
    { event_type: 'v2_aero_inquiry_started', session_id: 's', page_url: '/termowizja', created_at: at(1) },
    { event_type: 'v2_page_view', session_id: 's', page_url: '/monitoring', created_at: at(2) },
  ], event => event.page_url || '/');
  assert.deepEqual(paths, ['/termowizja']);
});
