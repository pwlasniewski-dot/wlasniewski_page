export const FUNNEL_STEPS = [
  { event: 'v2_booking_view', label: 'Rezerwacja' },
  { event: 'v2_service_selected', label: 'Usługa' },
  { event: 'v2_package_selected', label: 'Pakiet i cena' },
  { event: 'v2_date_selected', label: 'Data' },
  { event: 'v2_time_selected', label: 'Godzina' },
  { event: 'v2_booking_form_started', label: 'Formularz' },
  { event: 'v2_booking_added_to_cart', label: 'Formularz i koszyk' },
  { event: 'v2_checkout_view', label: 'Checkout' },
  { event: 'v2_checkout_submit', label: 'Zlecenie płatności' },
  { event: 'v2_payu_redirect', label: 'Przekierowanie PayU' },
] as const;

export type DiagnosticEvent = {
  event_type: string;
  session_id: string;
  metadata?: Record<string, unknown>;
  created_at?: Date | string | number;
};

export type FunnelDiagnostic = {
  kind: 'error' | 'availability' | 'dropoff' | 'performance' | 'hypothesis' | 'empty';
  title: string;
  evidence: string;
  sessions: number;
  confidence: 'wysoka' | 'średnia' | 'niska';
  recommendation: string;
};

const PRIORITY: Record<FunnelDiagnostic['kind'], number> = {
  error: 0,
  availability: 1,
  dropoff: 2,
  performance: 3,
  hypothesis: 4,
  empty: 5,
};

const uniqueSessions = (events: DiagnosticEvent[]) => new Set(events.map(event => event.session_id)).size;

export function diagnoseFunnel(events: DiagnosticEvent[]): { funnel: Array<{ event: string; label: string; sessions: number; dropoff: number }>; actions: FunnelDiagnostic[] } {
  const reachedByStep = FUNNEL_STEPS.map(() => new Set<string>());
  const sessions = new Map<string, Array<{ event: DiagnosticEvent; index: number }>>();
  events.forEach((event, index) => {
    const rows = sessions.get(event.session_id) || [];
    rows.push({ event, index });
    sessions.set(event.session_id, rows);
  });
  for (const [sessionId, rows] of sessions) {
    rows.sort((a, b) => {
      const timestamp = (value: DiagnosticEvent['created_at']) => value instanceof Date
        ? value.getTime()
        : value !== undefined ? new Date(value).getTime() : Number.NaN;
      const left = timestamp(a.event.created_at);
      const right = timestamp(b.event.created_at);
      return Number.isFinite(left) && Number.isFinite(right) && left !== right ? left - right : a.index - b.index;
    });
    let expected = 0;
    for (const { event } of rows) {
      if (event.event_type !== FUNNEL_STEPS[expected]?.event) continue;
      reachedByStep[expected].add(sessionId);
      expected++;
      if (expected === FUNNEL_STEPS.length) break;
    }
  }
  const funnel = FUNNEL_STEPS.map((step, index) => {
    const count = reachedByStep[index].size;
    const previous = index ? reachedByStep[index - 1].size : count;
    return { ...step, sessions: count, dropoff: Math.max(0, previous - count) };
  });
  const actions: FunnelDiagnostic[] = [];

  const errorGroups = new Map<string, Set<string>>();
  for (const event of events.filter(item => ['v2_service_load_result', 'v2_availability_result', 'v2_checkout_result', 'v2_client_error'].includes(item.event_type))) {
    const status = String(event.metadata?.status || '');
    if (!['error', 'failed'].includes(status) && event.event_type !== 'v2_client_error') continue;
    const area = String(event.metadata?.area || event.metadata?.endpoint || event.event_type.replace('v2_', ''));
    const key = area.replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || 'unknown';
    const set = errorGroups.get(key) || new Set<string>();
    set.add(event.session_id);
    errorGroups.set(key, set);
  }
  for (const [area, sessions] of errorGroups) {
    actions.push({
      kind: 'error', title: `Awaria lub błąd: ${area}`, sessions: sessions.size,
      evidence: `${sessions.size} sesji z technicznym zdarzeniem błędu.`, confidence: sessions.size >= 2 ? 'wysoka' : 'średnia',
      recommendation: `Sprawdź logi i odtwórz ścieżkę ${area} na telefonie oraz komputerze.`,
    });
  }

  const noSlots = events.filter(event => event.event_type === 'v2_availability_result'
    && event.metadata?.status === 'ok' && event.metadata?.has_available_slots === false);
  const noSlotSessions = uniqueSessions(noSlots);
  const availabilitySessions = uniqueSessions(events.filter(event => event.event_type === 'v2_availability_result'));
  if (noSlotSessions) actions.push({
    kind: 'availability', title: 'Brak dostępnych terminów', sessions: noSlotSessions,
    evidence: `${noSlotSessions} z ${availabilitySessions} sesji sprawdzających dostępność otrzymało poprawną odpowiedź, ale bez wolnych godzin.`,
    confidence: noSlotSessions >= 3 && availabilitySessions > 0 && noSlotSessions / availabilitySessions >= 0.2
      ? 'wysoka'
      : availabilitySessions >= 3 ? 'średnia' : 'niska',
    recommendation: 'Sprawdź kalendarz dostępności i rozważ pokazanie najbliższych alternatywnych terminów.',
  });

  const validationFailures = events.filter(event => event.event_type === 'v2_booking_validation_failed');
  const validationSessions = uniqueSessions(validationFailures);
  if (validationSessions) actions.push({
    kind: 'dropoff', title: 'Formularz zatrzymuje rezerwację', sessions: validationSessions,
    evidence: `${validationSessions} sesji próbowało przejść dalej z brakującą wymaganą grupą danych.`,
    confidence: validationSessions >= 3 ? 'wysoka' : validationSessions === 2 ? 'średnia' : 'niska',
    recommendation: validationSessions < 3
      ? 'Próba jest mała. Obserwuj walidację i sprawdź formularz technicznie bez przesądzania o zmianie UX.'
      : 'Sprawdź czy komunikaty i oznaczenia wymaganych pól są widoczne przed wysłaniem formularza.',
  });

  const slow = events.filter(event => event.event_type === 'v2_performance' && Number(event.metadata?.duration_ms || 0) >= 2500);
  const slowSessions = uniqueSessions(slow);
  if (slowSessions) actions.push({
    kind: 'performance', title: 'Wolne ładowanie kluczowych stron', sessions: slowSessions,
    evidence: `${slowSessions} sesji z ładowaniem LCP co najmniej 2,5 s.`, confidence: slowSessions >= 3 ? 'wysoka' : 'średnia',
    recommendation: 'Sprawdź obrazy, odpowiedź serwera i skrypty na wskazanych trasach, zaczynając od urządzeń mobilnych.',
  });

  let strongestDrop: { index: number; count: number; rate: number } | null = null;
  for (let index = 1; index < funnel.length; index++) {
    const previous = funnel[index - 1].sessions;
    if (!previous) continue;
    const count = Math.max(0, previous - funnel[index].sessions);
    const rate = count / previous;
    if (count >= 2 && rate >= 0.3 && (!strongestDrop || count > strongestDrop.count)) strongestDrop = { index, count, rate };
  }
  if (strongestDrop) {
    const before = funnel[strongestDrop.index - 1];
    const after = funnel[strongestDrop.index];
    const priceStep = before.event === 'v2_package_selected';
    actions.push({
      kind: priceStep ? 'hypothesis' : 'dropoff',
      title: priceStep ? 'Cena lub oferta może być barierą' : `Największy odpływ: ${before.label} → ${after.label}`,
      sessions: strongestDrop.count,
      evidence: `${strongestDrop.count} z ${before.sessions} sesji (${Math.round(strongestDrop.rate * 100)}%) nie przeszło do kroku „${after.label}”.`,
      confidence: priceStep ? 'niska' : (before.sessions >= 10 ? 'średnia' : 'niska'),
      recommendation: priceStep
        ? 'Traktuj cenę wyłącznie jako hipotezę. Najpierw sprawdź błędy, dostępność terminów i czytelność pakietów; potwierdzenie ceny wymaga odpowiedzi klienta lub testu wariantów.'
        : before.sessions < 10
          ? `Próba jest mała. Obserwuj krok „${after.label}” i najpierw odtwórz go technicznie, bez przesądzania o zmianie UX.`
          : `Przetestuj krok „${after.label}” i uprość przejście z poprzedniego etapu.`,
    });
  }

  if (!events.length) actions.push({
    kind: 'empty', title: 'Brak danych do diagnozy', sessions: 0,
    evidence: 'W wybranym okresie nie zapisano zdarzeń Analytics 2.1.', confidence: 'wysoka',
    recommendation: 'Sprawdź zgodę cookies i wykonaj kontrolną ścieżkę rezerwacji na urządzeniu nieoznaczonym jako administrator.',
  });

  return { funnel, actions: actions.sort((a, b) => PRIORITY[a.kind] - PRIORITY[b.kind] || b.sessions - a.sessions).slice(0, 5) };
}
