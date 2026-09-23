import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSessionJourneys } from '../../src/lib/analytics/sessionJourney';

const event = (event_type: string, second: number, metadata: Record<string, unknown> = {}, session_id = 'session-a') => ({
  event_type: `v2_${event_type}`, session_id, page_url: '/rezerwacja',
  created_at: new Date(Date.UTC(2026, 8, 23, 19, 0, second)),
  metadata: { site_host: 'wlasniewski.pl', source: 'Direct', device: 'mobile', browser: 'Safari', ...metadata },
});

test('journey describes choices, validated field states, blockers and actual booking references', () => {
  const [journey] = buildSessionJourneys([
    event('page_view', 0), event('booking_form_started', 1),
    event('click', 2, { analytics_id: 'package_select' }),
    event('package_selected', 3, { service_id: 2, service_name: 'Portret', package_id: 5, package_name: 'Klasyczny' }),
    event('date_selected', 4, { booking_date: '2026-10-01' }),
    event('time_selected', 5, { booking_date: '2026-10-01', booking_time: '16:30' }),
    event('booking_field_state', 6, { field: 'email', state: 'invalid', value: 'private@example.org' }),
    event('booking_validation_failed', 7, { field_group: 'contact' }),
    event('booking_field_state', 8, { field: 'email', state: 'filled', email: 'private@example.org' }),
    event('booking_added_to_cart', 9), event('booking_created', 10),
  ], [{ id: 91, analytics_session_id: 'session-a' }, { id: 92, analytics_session_id: 'other-session' }]);
  assert.equal(journey.bookingStarted, true);
  assert.equal(journey.clientConversion, true);
  assert.equal(journey.path[2].detail, 'Wybór pakietu');
  assert.equal(journey.path[3].detail, 'Portret · Klasyczny');
  assert.deepEqual(journey.fieldStates, [{ field: 'email', label: 'E-mail', state: 'filled' }]);
  assert.deepEqual(journey.bookingIds, [91]);
  assert.equal(journey.issueCount, 2);
  assert.equal(journey.choices.find(choice => choice.label === 'Godzina')?.value, '16:30');
  assert.ok(!JSON.stringify(journey).includes('private@example.org'));
});

test('older unnamed clicks stay explicitly unknown; no inferred completion, identity or untyped field', () => {
  const [journey] = buildSessionJourneys([
    event('page_view', 0), event('click', 1, { analytics_id: 'button:button', element_text: 'Jan Kowalski' }),
    event('booking_field_state', 2, { field: 'password', state: 'filled', value: 'secret' }),
  ]);
  assert.match(journey.path[1].detail!, /Brak zapisanej nazwy/);
  assert.equal(journey.fieldStates.length, 0);
  assert.equal(journey.clientConversion, false);
  assert.equal(journey.path.length, 2);
  assert.doesNotMatch(JSON.stringify(journey), /Jan Kowalski|secret|password/);
});

test('sessions sort by last received activity, and long timelines retain the latest events', () => {
  const first = Array.from({ length: 130 }, (_, i) => event('click', i));
  const journeys = buildSessionJourneys([
    event('page_view', 3, {}, 'session-b'),
    ...first.reverse(), event('engagement', 131, { active_ms: 15000 }),
  ]);
  assert.equal(journeys[0].sessionId, 'session-a');
  assert.equal(journeys[0].totalSteps, 130);
  assert.equal(journeys[0].omittedSteps, 10);
  assert.equal(journeys[0].path.length, 120);
  assert.equal(journeys[0].path[0].at, event('click', 10).created_at.toISOString());
  assert.equal(journeys[0].path.at(-1)!.at, event('click', 129).created_at.toISOString());
  assert.equal(journeys[0].lastSeenAt, event('engagement', 131).created_at.toISOString());
});

test('changed selections clear stale dependent choices without claiming missing data was entered', () => {
  const initial = [
    event('service_selected', 0, { service_name: 'Portret' }),
    event('package_selected', 1, { package_name: 'Pełny' }),
    event('date_selected', 2, { booking_date: '2026-10-01' }),
    event('time_selected', 3, { booking_time: '17:00' }),
  ];
  const [changedPackage] = buildSessionJourneys([...initial, event('package_selected', 4, { package_name: 'Krótki' })]);
  assert.equal(changedPackage.choices.find(choice => choice.label === 'Data')?.value, '2026-10-01');
  assert.equal(changedPackage.choices.some(choice => choice.label === 'Godzina'), false);
  const [clearedDate] = buildSessionJourneys([...initial, event('date_selected', 4, { selection_cleared: true })]);
  assert.equal(clearedDate.choices.some(choice => ['Data', 'Godzina'].includes(choice.label)), false);
  const [changedService] = buildSessionJourneys([...initial, event('service_selected', 4, { service_name: 'Rodzinna' })]);
  assert.deepEqual(changedService.choices, [{ label: 'Usługa', value: 'Rodzinna' }]);
});

test('availability and payment failures are visible; hidden payloads and private link targets are not', () => {
  const [journey] = buildSessionJourneys([
    event('availability_result', 0, { status: 'ok', has_available_slots: false }),
    event('checkout_result', 1, { status: 'error', reason_code: 'http_error', http_status: 503, message: 'private payload' }),
    event('payment_failed', 2),
    event('click', 3, { analytics_id: 'link:/galeria/secret' }),
    event('click', 4, { analytics_id: 'link:/kontakt?email=secret@example.org' }),
    event('click', 5, { analytics_id: 'link:/karta-podarunkowa/dostep/secret' }),
  ]);
  assert.equal(journey.issueCount, 3);
  assert.match(journey.path[0].detail!, /Brak dostępnych godzin/);
  assert.match(journey.path[1].detail!, /HTTP 503/);
  assert.equal(journey.path[3].detail, 'Link: [strona prywatna]');
  assert.equal(journey.path[4].detail, 'Link: /kontakt');
  assert.equal(journey.path[5].detail, 'Link: [strona prywatna]');
  assert.doesNotMatch(JSON.stringify(journey), /secret|private payload/);
});

test('revisiting the booking page starts a fresh form summary and preserves previous attempt history', () => {
  const [journey] = buildSessionJourneys([
    event('page_view', 0),
    event('package_selected', 1, { package_name: 'Pełny' }),
    event('booking_field_state', 2, { field: 'phone', state: 'filled' }),
    event('page_view', 3),
    event('booking_view', 4, { service_name: 'Portret' }),
  ]);
  assert.equal(journey.fieldStates.length, 0);
  assert.deepEqual(journey.choices, [{ label: 'Usługa', value: 'Portret' }]);
  assert.ok(journey.path.some(step => step.detail === 'Telefon — uzupełniono'));
});

test('incomplete historical outcomes do not imply a successful response', () => {
  const [journey] = buildSessionJourneys([
    event('checkout_result', 0), event('availability_result', 1, { status: 'unknown' }),
    event('service_load_result', 2, { status: null }),
  ]);
  assert.ok(journey.path.every(step => step.tone === 'info'));
  assert.ok(journey.path.every(step => step.detail === 'Brak zapisanego wyniku operacji.'));
  assert.equal(journey.clientConversion, false);
});

test('delayed requests retain action order without a late page view wiping entered fields', () => {
  const [journey] = buildSessionJourneys([
    event('booking_field_state', 3, { field: 'phone', state: 'filled', client_ts: event('', 2).created_at.toISOString() }),
    event('page_view', 4, { client_ts: event('', 0).created_at.toISOString() }),
    event('booking_view', 5, { service_name: 'Portret', client_ts: event('', 1).created_at.toISOString() }),
  ]);
  assert.deepEqual(journey.path.map(step => step.event), ['page_view', 'booking_view', 'booking_field_state']);
  assert.deepEqual(journey.path.map(step => step.at), [0, 1, 2].map(second => event('', second).created_at.toISOString()));
  assert.equal(journey.fieldStates[0].state, 'filled');
  assert.equal(journey.startedAt, event('', 3).created_at.toISOString());
  assert.equal(journey.lastSeenAt, event('', 5).created_at.toISOString());
});

test('invalid or widely skewed browser timestamps fall back to server receipt time', () => {
  const [journey] = buildSessionJourneys([
    event('page_view', 0, { client_ts: '2099-01-01T00:00:00.000Z' }),
    event('booking_view', 1, { client_ts: 'not-a-date' }),
    event('booking_field_state', 2, { field: 'email', state: 'filled', client_ts: event('', -301).created_at.toISOString() }),
  ]);
  assert.deepEqual(journey.path.map(step => step.at), [0, 1, 2].map(second => event('', second).created_at.toISOString()));
});
