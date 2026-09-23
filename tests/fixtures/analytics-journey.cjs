// Synthetic dashboard data for UI checks; contains no client data.
const step = (event, label, detail = null, tone = 'info') => ({ at: '2026-09-23T19:18:12Z', event, page: '/rezerwacja', label, detail, tone });
const session = {
  sessionId: 'test-booking-session', startedAt: '2026-09-23T19:16:27Z', lastSeenAt: '2026-09-23T19:19:12Z',
  siteHost: 'wlasniewski.pl', landingPage: '/', pageViews: 9, bookingStarted: true, bookingVisited: true, clientConversion: false,
  source: 'Google', device: 'Telefon', browser: 'Safari', totalSteps: 260, omittedSteps: 257, issueCount: 1,
  fieldStates: [{ field: 'name', label: 'Imię i nazwisko', state: 'filled' }, { field: 'email', label: 'E-mail', state: 'invalid' }],
  choices: [{ label: 'Usługa', value: 'Sesja rodzinna' }, { label: 'Pakiet', value: 'Rodzinny plener' }, { label: 'Termin', value: '2026-10-05' }, { label: 'Godzina', value: '17:00' }],
  bookingIds: [123],
  path: [step('booking_field_state', 'Wypełniono pole: Imię i nazwisko'), step('booking_step', 'Przejście do danych kontaktowych'), step('booking_validation_error', 'Formularz wymaga poprawy', 'E-mail: nieprawidłowy format', 'warning')],
};
const historical = {
  ...session, sessionId: 'test-historical', startedAt: '2026-09-22T18:00:00Z', lastSeenAt: '2026-09-22T18:03:00Z',
  siteHost: 'aeroanaliza.pl', landingPage: '/kontakt', pageViews: 2, bookingStarted: false, bookingVisited: false, clientConversion: false,
  source: 'Bezpośrednio', device: 'Komputer', browser: 'Firefox', totalSteps: 1, omittedSteps: 0, issueCount: 0,
  fieldStates: [], choices: [], bookingIds: [],
  path: [{ at: '2026-09-22T18:03:00Z', event: 'click', page: '/kontakt', label: 'Kliknięcie — brak szczegółów w starszym zapisie', detail: null, tone: 'info' }],
};
const dashboard = {
  success: true, version: 3, generatedAt: '2026-09-23T19:30:00Z',
  sources: {
    analytics: { status: 'connected', events: 800, unknownHostSessions: 0, hostNote: '' },
    gsc: { status: 'connected', latestCompleteDate: '2026-09-20', comparisonStatus: 'connected', message: '', sites: [{ siteUrl: 'sc-domain:wlasniewski.pl', status: 'connected', queryReport: 'connected' }] },
    finance: { bookingAttempts: 2, successfulBookings: 1, canonicalBookings: 2, attributedBookings: 1, note: '' },
    photoSales: { canonicalInquiries: 1, attributedInquiries: 1, note: '' }, aeroSales: { canonicalInquiries: 0, note: '' },
  },
  overview: { users: 12, sessions: 15, gscImpressions: 400, gscClicks: 30, salesIntentStartSessions: 3, canonicalPhotoInquiries: 1, bookingAttempts: 2, successfulBookings: 1, currentMonthSuccessfulBookings: 2, dataStatus: 'small_sample', dataStatusNote: 'Próba jest mała.', comparison: { usersPct: 20, sessionsPct: 30, gscImpressionsPct: 5 } },
  photo: { overview: {}, entryFunnel: [{ key: 'entry', label: 'Wejścia', value: 15 }], branches: { inquiry: [{ key: 'inquiry', label: 'Zapytania', value: 1 }], booking: [{ key: 'booking', label: 'Rezerwacje', value: 2 }] } },
  aero: { overview: {}, funnel: [{ key: 'aero', label: 'Wejścia Aero', value: 5 }] },
  funnel: [{ key: 'entry', label: 'Wszystkie wejścia', value: 20 }],
  diagnostics: { funnel: [{ event: 'v2_booking_started', label: 'Start formularza', sessions: 3, dropoff: 1 }], actions: [{ kind: 'validation', title: 'Walidacja formularza', evidence: 'Jeden sygnał', confidence: 'medium', recommendation: 'Sprawdź pola' }] },
  trafficSources: [{ source: 'Google', sessions: 8 }], ingest: [{ reason: 'valid', outcome: 'accepted', batches: 3, events: 50 }],
  dataQuality: { unavailableSources: [] }, actions: [{ kind: 'check', title: 'Sprawdź rezerwację', evidence: 'Sygnał walidacji', recommendation: 'Otwórz wizytę' }],
  searchQueries: [{ host: 'wlasniewski.pl', query: 'fotograf rodzinny Toruń', page: '/fotograf/torun', clicks: 4, impressions: 100, ctr: 0.04, position: 12.3, previousClicks: 2, previousImpressions: 80, clicksPct: 100, impressionsPct: 25, competingPages: [], multiplePagesSignal: false }],
  querySummary: { rows: 1, totalRows: 1, truncated: false, multiplePagesSignals: 0, note: 'Dane testowe Google.' },
  pages: [{ host: 'wlasniewski.pl', path: '/fotograf/torun', title: 'Fotograf Toruń', kind: 'landing', completeness: 80, stage: 'growing', blockers: [], updatedAt: '2026-09-20T00:00:00Z', publicationRecord: { publishedAt: null, status: 'unknown', note: 'Brak daty publikacji' }, firstSeenAt: '2026-08-01T00:00:00Z', firstSeenSource: 'analytics', gates: [{ key: 'title', label: 'Tytuł', state: 'pass', reason: 'Uzupełniony' }], impact: { sessions: 12, landingSessions: 10, assistedBookingStarts: 2, ctaSessions: 2, bookingStartSessions: 1, clientEventConversions: 1, canonicalInquiries: 1, canonicalBookings: 1, attributionNote: 'Dane testowe', gsc: { clicks: 4, impressions: 100, ctr: 0.04, position: 12.3, clicksPct: 100, impressionsPct: 25 }, baseline28: { sampleStatus: 'small_sample', growthConfidence: 'small_sample', note: 'Za mało danych do oceny.', sessions: 12, previousSessions: 10, sessionsPct: 20, impressions: 100, previousImpressions: 80, impressionsPct: 25 }, trend: [{ date: '2026-09-22', sessions: 4, clicks: 1, impressions: 15 }] } }],
  recentSessions: [session, historical],
};
module.exports = { dashboard, session, historical };
