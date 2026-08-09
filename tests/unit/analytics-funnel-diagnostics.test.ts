import assert from 'node:assert/strict';
import test from 'node:test';
import { diagnoseFunnel, type DiagnosticEvent } from '../../src/lib/analytics/funnelDiagnostics';

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
  assert.equal(result.actions[0].kind, 'dropoff');
  assert.equal(result.actions[0].confidence, 'wysoka');
});
