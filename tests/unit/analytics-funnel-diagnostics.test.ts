import assert from 'node:assert/strict';
import test from 'node:test';
import { diagnoseFunnel, type DiagnosticEvent } from '../../src/lib/analytics/funnelDiagnostics.ts';

const event = (session_id: string, event_type: string, metadata: Record<string, unknown> = {}): DiagnosticEvent => ({ session_id, event_type, metadata });

test('reports technical failures as high-confidence evidence', () => {
  const result = diagnoseFunnel([
    event('a', 'v2_availability_result', { status: 'error', area: 'availability' }),
    event('b', 'v2_availability_result', { status: 'error', area: 'availability' }),
  ]);
  assert.equal(result.actions[0].kind, 'error');
  assert.equal(result.actions[0].sessions, 2);
  assert.equal(result.actions[0].confidence, 'wysoka');
});

test('one technical failure has medium confidence', () => {
  const result = diagnoseFunnel([event('a', 'v2_checkout_result', { status: 'error', area: 'checkout' })]);
  assert.equal(result.actions[0].kind, 'error');
  assert.equal(result.actions[0].confidence, 'średnia');
});

test('labels package drop-off as a price hypothesis, never a fact', () => {
  const events: DiagnosticEvent[] = [];
  for (let i = 0; i < 10; i++) {
    events.push(event(String(i), 'v2_booking_view'), event(String(i), 'v2_service_selected'), event(String(i), 'v2_package_selected'));
    if (i < 3) events.push(event(String(i), 'v2_date_selected'));
  }
  const action = diagnoseFunnel(events).actions.find(item => item.kind === 'hypothesis');
  assert.ok(action);
  assert.match(action.title, /może/);
  assert.equal(action.confidence, 'niska');
  assert.match(action.recommendation, /wyłącznie jako hipotezę/);
});

test('works with zero data and returns a complete zero funnel', () => {
  const result = diagnoseFunnel([]);
  assert.ok(result.funnel.every(step => step.sessions === 0));
  assert.equal(result.actions[0].kind, 'empty');
});

test('does not report small random drop-offs', () => {
  const result = diagnoseFunnel([event('a', 'v2_booking_view'), event('a', 'v2_service_selected')]);
  assert.equal(result.actions.length, 0);
});

test('separates no availability from an API failure', () => {
  const result = diagnoseFunnel([
    event('a', 'v2_availability_result', { status: 'ok', has_available_slots: false }),
  ]);
  assert.equal(result.actions[0].title, 'Brak dostępnych terminów');
  assert.equal(result.actions[0].kind, 'availability');
  assert.equal(result.actions[0].confidence, 'niska');
});

test('raises no-slots confidence only with at least three affected sessions and twenty percent of checks', () => {
  const rows: DiagnosticEvent[] = [];
  for (let i = 0; i < 10; i++) rows.push(event(String(i), 'v2_availability_result', { status: 'ok', has_available_slots: i >= 3 }));
  const action = diagnoseFunnel(rows).actions.find(item => item.kind === 'availability');
  assert.equal(action?.confidence, 'wysoka');
  assert.equal(action?.sessions, 3);
});

test('requires funnel events to occur in canonical order', () => {
  const result = diagnoseFunnel([
    event('a', 'v2_service_selected'),
    event('a', 'v2_booking_view'),
    event('a', 'v2_package_selected'),
  ]);
  assert.equal(result.funnel[0].sessions, 1);
  assert.equal(result.funnel[1].sessions, 0);
  assert.equal(result.funnel[2].sessions, 0);
});

test('uses created_at ordering when timestamps are provided', () => {
  const result = diagnoseFunnel([
    { ...event('a', 'v2_service_selected'), created_at: '2026-01-01T10:00:02Z' },
    { ...event('a', 'v2_booking_view'), created_at: '2026-01-01T10:00:01Z' },
  ]);
  assert.equal(result.funnel[1].sessions, 1);
});

test('prioritizes a small technical error above larger availability and UX findings', () => {
  const rows: DiagnosticEvent[] = [event('error', 'v2_client_error', { status: 'error', area: 'javascript' })];
  for (let i = 0; i < 4; i++) rows.push(event(`slot-${i}`, 'v2_availability_result', { status: 'ok', has_available_slots: false }));
  for (let i = 0; i < 5; i++) rows.push(event(`form-${i}`, 'v2_booking_validation_failed', { field_group: 'contact' }));
  const result = diagnoseFunnel(rows);
  assert.equal(result.actions[0].kind, 'error');
  assert.equal(result.actions[1].kind, 'availability');
  assert.equal(result.actions[2].kind, 'dropoff');
});

test('reports booking validation without inspecting field values', () => {
  const result = diagnoseFunnel([event('a', 'v2_booking_validation_failed', { field_group: 'contact', reason_code: 'required_missing' })]);
  const action = result.actions.find(item => item.title === 'Formularz zatrzymuje rezerwację');
  assert.equal(action?.confidence, 'niska');
});

test('treats empty active services as a confirmed service error signal', () => {
  const result = diagnoseFunnel([event('a', 'v2_service_load_result', { status: 'error', area: 'services', reason_code: 'no_active_services' })]);
  assert.equal(result.actions[0].kind, 'error');
  assert.match(result.actions[0].title, /services/);
});

test('an all-day booking can progress through the canonical time and form stages', () => {
  const types = [
    'v2_booking_view', 'v2_service_selected', 'v2_package_selected', 'v2_date_selected',
    'v2_time_selected', 'v2_booking_form_started', 'v2_booking_added_to_cart',
  ];
  const result = diagnoseFunnel(types.map(type => event('all-day', type)));
  assert.equal(result.funnel.find(step => step.event === 'v2_booking_form_started')?.sessions, 1);
  assert.equal(result.funnel.find(step => step.event === 'v2_booking_added_to_cart')?.sessions, 1);
});
