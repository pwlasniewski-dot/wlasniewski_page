import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizeBookingJourneyMetadata as sanitize } from '../../src/lib/analytics/bookingJourneyContract.ts';

test('booking choices retain only catalog context appropriate to the event', () => {
  const raw = { service_id: 2, service_name: 'Sesja rodzinna', package_id: 3, package_name: 'Pakiet 30 zdjęć', promotion_id: 4,
    amount_bucket: '500_999', booking_date: '2026-11-23', booking_time: '18:00', email: 'private@example.test', name: 'Private Person',
    notes: 'PRIVATE-NOTES', promo_code: 'SECRET-CODE', gift_card_code: 'SECRET-GIFT' };
  assert.deepEqual(sanitize('service_selected', raw), { service_id: 2, service_name: 'Sesja rodzinna' });
  assert.deepEqual(sanitize('v2_promotion_package_selected', raw), {
    service_id: 2, service_name: 'Sesja rodzinna', package_id: 3, package_name: 'Pakiet 30 zdjęć', promotion_id: 4, amount_bucket: '500_999',
  });
  assert.deepEqual(sanitize('v2_time_selected', raw), { service_id: 2, package_id: 3, booking_date: '2026-11-23', booking_time: '18:00' });
  assert.deepEqual(sanitize('v2_click', raw), {});
});

test('malformed names, tokens, URLs, dates, IDs and non-string enums are rejected', () => {
  for (const label of ['private@example.test', 'https://example.test', 'javascript:alert(1)', 'Bearer secret', '530788694', 'X'.repeat(120), 'a'.repeat(48)]) {
    assert.deepEqual(sanitize('v2_service_selected', { service_name: label }), {}, label);
  }
  for (const id of ['15', 1.1, Infinity, 0, 2_147_483_648, {}, []]) {
    assert.deepEqual(sanitize('v2_package_selected', { package_id: id }), {});
  }
  assert.deepEqual(sanitize('v2_package_selected', { package_id: -1001 }), { package_id: -1001 });
  for (const date of ['2026-02-30', '2026-13-01', '2026-01-01?email=private', '2026-1-1']) {
    assert.deepEqual(sanitize('v2_date_selected', { booking_date: date }), {});
  }
  for (const time of ['24:00', '12:60', '12:00:00', '8:00', 'https://x']) {
    assert.deepEqual(sanitize('v2_time_selected', { booking_time: time }), {});
  }
  assert.deepEqual(sanitize('v2_booking_form_started', { step: ['service'] }), {});
});

test('field snapshots never preserve contents and require a known field and state', () => {
  assert.deepEqual(sanitize('v2_booking_field_state', { field: 'email', state: 'invalid', value: 'private@example.test', email: 'private@example.test' }), { field: 'email', state: 'invalid' });
  assert.deepEqual(sanitize('v2_booking_field_state', { field: 'password', state: 'filled' }), {});
  assert.deepEqual(sanitize('v2_booking_field_state', { field: 'email', state: 'private@example.test' }), {});
  assert.deepEqual(sanitize('v2_booking_field_state', { field: 'email' }), {});
});

test('code checks expose their outcome without the code or a server message', () => {
  assert.deepEqual(sanitize('v2_booking_code_result', { code_type: 'gift_card', status: 'failed', reason_code: 'invalid_code', code: 'SECRET', message: 'Gift SECRET invalid', value: 123 }), {
    code_type: 'gift_card', status: 'failed', reason_code: 'invalid_code',
  });
  assert.deepEqual(sanitize('v2_drone_addon_selected', { selected: false, analytics_id: 'drone_addon_remove', notes: 'private' }), { selected: false, analytics_id: 'drone_addon_remove' });
});
