const h = require('./gallery-shop-dom.cjs');
const { assert, act, check, mount, reset, click, button, field, set } = h;
const AnalyticsPage = require('../../src/app/admin/analytics/page.tsx').default;
const SessionJourneys = require('../../src/components/admin/analytics/SessionJourneys.tsx').default;
const { buildSessionJourneys } = require('../../src/lib/analytics/sessionJourney.ts');
const { dashboard, session, historical } = require('../fixtures/analytics-journey.cjs');
const clone = value => JSON.parse(JSON.stringify(value));
let responseBody = dashboard, status = 200, calls = [];
global.fetch = async (url, init) => {
  if (String(url).startsWith('/api/admin/analytics/finance')) return new Response(JSON.stringify({ success: true, data: { receivedPaymentsGross: 0, refundsGross: 0, receivedPaymentsNet: 0, currency: 'PLN', unit: 'minor', coverageStartedAt: null, details: { ledgerPaymentsGross: 0, legacyPaymentsGross: 0, notes: ['Dane syntetyczne testu.'] } }, generatedAt: '2026-09-24T12:00:00Z', range: { startDate: new URL(String(url),'http://localhost').searchParams.get('startDate'), endDate: new URL(String(url),'http://localhost').searchParams.get('endDate'), timeZone: 'Europe/Warsaw' } }));
  calls.push({ url, init }); return { ok: status < 400, status, json: async () => clone(responseBody) };
};
const sessionToggle = index => document.querySelectorAll('[data-testid="session-path"] article > button')[index];

(async () => {
  await check('wizyty są domyślnym pierwszym raportem; pozostałe raporty pozostają w zakładkach', async () => {
    await mount(AnalyticsPage);
    assert.equal(document.querySelector('[role="tab"][aria-selected="true"]').textContent, 'Wizyty i rezerwacje');
    const visiblePanel = document.querySelector('[role="tabpanel"]:not([hidden])');
    assert.ok(visiblePanel.querySelector('[data-testid="session-path"]'));
    assert.equal(visiblePanel.firstElementChild.dataset.testid, 'session-path');
    assert.ok(document.querySelector('[data-testid="gsc-query-page-report"]').closest('[hidden]'));
    await click(button('Wyniki sprzedaży'));
    assert.equal(document.getElementById('analytics-panel-sales').hidden, false);
    assert.ok(document.getElementById('analytics-panel-sales').querySelector('[data-testid="photo-sales-funnel"]'));
    assert.ok(document.getElementById('analytics-panel-sales').querySelector('[data-testid="aero-sales-funnel"]'));
    await click(button('Google i SEO'));
    assert.equal(document.getElementById('analytics-panel-seo').hidden, false);
    assert.ok(document.querySelector('[data-testid="gsc-mobile-cards"]').textContent.includes('fotograf rodzinny Toruń'));
    assert.ok(document.querySelector('[data-testid="page-baseline-status"]'));
    const state = [...document.querySelectorAll('details')].find(el => el.querySelector('summary').textContent.startsWith('Stan danych'));
    assert.equal(state.open, false);
    assert.ok(state.textContent.includes('800 zdarzeń'));
  });
  await check('klawiatura przełącza zakładkę wraz z fokusem', async () => {
    const tab = button('Google i SEO'); tab.focus();
    await act(async () => tab.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Home', bubbles: true })));
    assert.equal(document.activeElement, button('Wizyty i rezerwacje'));
    assert.equal(document.getElementById('analytics-panel-visits').hidden, false);
  });
  await check('rozwiniecie wizyty pokazuje konkretne kroki, wybory, pola i obcięcie historii', async () => {
    const toggle = sessionToggle(0);
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    await click(toggle);
    assert.equal(toggle.getAttribute('aria-expanded'), 'true');
    const detail = document.getElementById(toggle.getAttribute('aria-controls'));
    for (const text of ['Wypełniono pole: Imię i nazwisko', 'Przejście do danych kontaktowych', 'E-mail: nieprawidłowy format', 'Rodzinny plener', '17:00', 'Wypełnione', 'Wymaga poprawy', '257 wcześniejszych wpisów', 'Brak zdarzenia nie oznacza pustego pola', '#123']) assert.ok(detail.textContent.includes(text), text);
    assert.equal(detail.querySelector('a').getAttribute('href'), '/admin/bookings');
    assert.equal(detail.querySelectorAll('ol li').length, 3);
    await click(toggle);
    assert.equal(document.getElementById(toggle.getAttribute('aria-controls')), null);
  });
  await check('filtry rezerwacji, problemów i domeny oraz wyszukiwarka działają razem', async () => {
    await click(button('Rezerwacje'));
    assert.equal(document.querySelectorAll('[data-testid="session-path"] article').length, 1);
    await click(button('Z problemami'));
    assert.equal(document.querySelectorAll('[data-testid="session-path"] article').length, 1);
    await set(field('Domena wizyty'), 'aeroanaliza.pl');
    assert.equal(document.querySelectorAll('[data-testid="session-path"] article').length, 0);
    assert.ok(document.body.textContent.includes('Brak wizyt pasujących do filtrów.'));
    await click(button('Wyczyść filtry'));
    assert.equal(document.querySelectorAll('[data-testid="session-path"] article').length, 2);
    await set(field('Szukaj wizyty po stronie, źródle lub urządzeniu'), 'Firefox');
    assert.equal(document.querySelectorAll('[data-testid="session-path"] article').length, 1);
    await click(sessionToggle(0));
    assert.ok(document.querySelector('[data-testid="session-path"]').textContent.includes('Brak zapisanych informacji o wypełnieniu pól'));
    assert.ok(document.querySelector('[data-testid="session-path"]').textContent.includes('brak szczegółów w starszym zapisie'));
    await set(field('Szukaj wizyty po stronie, źródle lub urządzeniu'), '');
  });
  await check('odświeżenie z błędem zachowuje oznaczony poprzedni odczyt, ponowienie usuwa błąd', async () => {
    status = 503; responseBody = { success: false, message: 'Chwilowo niedostępne' };
    await click(button('Odśwież ruch i rezerwacje'));
    assert.ok(document.querySelector('[role="alert"]').textContent.includes('poprzedni odczyt'));
    assert.equal(document.querySelectorAll('[data-testid="session-path"] article').length, 2);
    status = 200; responseBody = { ...dashboard, recentSessions: [historical] };
    await click(button('Spróbuj ponownie'));
    assert.equal(document.querySelector('[role="alert"]'), null);
    assert.equal(document.querySelectorAll('[data-testid="session-path"] article').length, 1);
  });
  await check('Dzisiaj wysyła zakres jednego polskiego dnia; stare dane nie udają nowego okresu', async () => {
    status = 503; responseBody = { success: false, message: 'Brak odczytu zakresu' };
    await click(button('Dzisiaj'));
    const url = new URL(calls.at(-1).url, 'http://localhost');
    assert.equal(url.searchParams.get('startDate'), url.searchParams.get('endDate'));
    assert.equal(document.querySelector('[data-testid="session-path"]'), null);
    status = 200; responseBody = dashboard;
    await click(button('Spróbuj ponownie'));
    assert.ok(document.querySelector('[data-testid="session-path"]'));
  });
  await check('niedozwolony odczyt nie pozostawia danych klientów; niepoprawne daty nie uruchamiają zapytania', async () => {
    status = 401; responseBody = { success: false, message: 'Zaloguj się ponownie' };
    await click(button('Odśwież ruch i rezerwacje'));
    assert.equal(document.querySelector('[data-testid="session-path"]'), null);
    const count = calls.length;
    await set(field('Data początkowa'), '2099-01-01');
    assert.equal(calls.length, count);
    assert.ok(document.querySelector('[role="alert"]').textContent.includes('poprawny zakres dat'));
  });
  await check('nowe finanse należą do stale dostępnej zakładki; przełączenie nie gubi szkicu', async () => {
    await reset(); status = 503; responseBody = { success: false, message: 'Awaria v3' };
    await mount(AnalyticsPage); await click(button('Wyniki sprzedaży'));
    const sales = document.getElementById('analytics-panel-sales');
    assert.ok(sales.querySelector('[data-testid="finance-actuals"]'));
    const simulator = sales.querySelector('[data-testid="pod-simulator"]'); assert.ok(simulator);
    assert.equal(simulator.closest('details').open, false);
    await click(simulator.closest('details').querySelector('summary'));
    await set(document.getElementById('pod-monthlyVisits'), '4321');
    await click(button('Wizyty i rezerwacje')); await click(button('Wyniki sprzedaży'));
    assert.equal(document.getElementById('pod-monthlyVisits').value, '4321');
    assert.equal(document.querySelectorAll('#analytics-panel-sales').length, 1);
  });
  await check('skrót z oferty otwiera właściwy raport sprzedaży', async () => {
    await reset(); window.history.replaceState({}, '', '/admin/analytics?view=sales');
    await mount(AnalyticsPage); assert.equal(document.getElementById('analytics-panel-sales').hidden, false);
    window.history.replaceState({}, '', '/admin/analytics');
  });
  await check('brak sesji ma czytelny stan pusty bez sugerowania porzuconej rezerwacji', async () => {
    await reset(); await mount(SessionJourneys, { sessions: [] });
    assert.ok(document.body.textContent.includes('Brak zapisanych wizyt w wybranym okresie.'));
    assert.ok(document.body.textContent.includes('nie podgląd na żywo'));
  });
  await check('rzeczywisty serializer: filtr zachowuje rezerwację po obcięciu osi czasu i pomija samo zapytanie', async () => {
    const event = (sessionId, type, at, metadata = {}) => ({ event_type: type, page_url: '/', session_id: sessionId, created_at: new Date(1_790_000_000_000 + at * 1000), metadata: { site_host: 'wlasniewski.pl', device: 'mobile', ...metadata } });
    const events = [event('long-booking', 'v2_booking_view', 0), ...Array.from({ length: 130 }, (_, i) => event('long-booking', 'v2_page_view', i + 1)), event('inquiry-only', 'v2_photo_inquiry_started', 200)];
    const journeys = buildSessionJourneys(events);
    const booking = journeys.find(row => row.sessionId === 'long-booking');
    assert.equal(booking.bookingVisited, true);
    assert.equal(booking.path.some(row => row.event.startsWith('booking_')), false);
    assert.ok(booking.omittedSteps > 0);
    await reset(); await mount(SessionJourneys, { sessions: journeys });
    await click(button('Rezerwacje'));
    assert.equal(document.querySelectorAll('[data-testid="session-path"] article').length, 1);
    assert.ok(sessionToggle(0).textContent.includes('Telefon'));
    await click(sessionToggle(0));
    assert.ok(document.querySelector('[data-testid="session-path"]').textContent.includes('120 najnowszych z 131'));
  });
  await check('awaria źródła zdarzeń pojawia się na głównym widoku zamiast fałszywego zera wizyt', async () => {
    await reset(); status = 200; responseBody = { ...dashboard, recentSessions: [], dataQuality: { unavailableSources: ['analytics-current'] } };
    await mount(AnalyticsPage);
    const visits = document.querySelector('[data-testid="session-path"]');
    assert.ok(visits.querySelector('[role="alert"]').textContent.includes('To nie oznacza braku ruchu'));
    assert.ok(!visits.textContent.includes('Brak zapisanych wizyt'));
  });
  await reset();
  console.log(`${h.log.length} grup testów analityki: PASS`);
})().catch(error => { console.error(error); process.exitCode = 1; });
