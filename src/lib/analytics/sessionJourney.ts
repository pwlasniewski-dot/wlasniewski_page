import { sanitizeBookingJourneyMetadata } from './bookingJourneyContract';
import { safeAnalyticsSiteHost } from './siteHost';
import { isSalesIntentStart } from './v3Attribution';
import type { JourneyStep, SessionJourney } from './sessionJourneyTypes';

type JourneyEvent = {
  event_type: string;
  page_url: string | null;
  session_id: string;
  created_at: Date;
  metadata: Record<string, unknown>;
};
type BookingReference = { id: number; analytics_session_id: string | null };

const FIELD_LABELS: Record<string, string> = {
  name: 'Imię i nazwisko', email: 'E-mail', phone: 'Telefon', company: 'Firma',
  venue_city: 'Miejscowość', venue_place: 'Miejsce sesji', notes: 'Uwagi',
  drone_goal: 'Cel zdjęć z drona', rodo: 'Zgoda na przetwarzanie danych',
  drone_terms: 'Warunki lotu dronem', promo_code: 'Kod rabatowy', gift_card_code: 'Kod karty podarunkowej',
};
const FIELD_STATES: Record<string, string> = {
  filled: 'uzupełniono', empty: 'pozostawiono puste', invalid: 'niepoprawna wartość',
  checked: 'zaznaczono', unchecked: 'odznaczono',
};
const ACTION_LABELS: Record<string, string> = {
  service_select: 'Wybór usługi', package_select: 'Wybór pakietu',
  date_select: 'Wybór daty', time_select: 'Wybór godziny', booking_calendar: 'Kalendarz terminów',
  add_to_cart: 'Dodaj rezerwację do koszyka', promo_apply: 'Sprawdź kod rabatowy',
  promo_remove: 'Usuń kod rabatowy', gift_card_apply: 'Sprawdź kartę podarunkową',
  gift_card_remove: 'Usuń kartę podarunkową', drone_addon_select: 'Dodaj zdjęcia z drona',
  drone_addon_remove: 'Usuń zdjęcia z drona', photographer_change: 'Zmień fotografa',
  email_link: 'Kontakt przez e-mail', phone_link: 'Kontakt telefoniczny',
};
const EVENT_LABELS: Record<string, string> = {
  page_view: 'Otworzono stronę', booking_view: 'Wyświetlono formularz rezerwacji',
  booking_form_started: 'Rozpoczęto rezerwację', booking_start: 'Przygotowano rezerwację',
  booking_started: 'Rozpoczęto rezerwację', service_selected: 'Wybrano usługę',
  package_selected: 'Wybrano pakiet', promotion_package_selected: 'Wybrano pakiet w promocji',
  date_selected: 'Wybrano datę', time_selected: 'Wybrano godzinę',
  drone_addon_selected: 'Zmieniono dodatek z dronem', booking_added_to_cart: 'Dodano rezerwację do koszyka',
  booking_validation_failed: 'Formularz wymaga poprawienia', booking_field_state: 'Zmieniono pole formularza',
  booking_code_result: 'Sprawdzono kod', form_start: 'Rozpoczęto formularz', form_submit: 'Wysłano formularz',
  checkout_view: 'Otworzono podsumowanie zamówienia', checkout_submit: 'Podjęto próbę złożenia zamówienia',
  checkout_result: 'Wynik złożenia zamówienia', booking_created: 'Zapisano rezerwację',
  payment_started: 'Rozpoczęto płatność', payu_redirect: 'Przekierowano do PayU',
  payment_success: 'Potwierdzono płatność', payment_failed: 'Płatność nie powiodła się',
  service_load_result: 'Wczytywanie usług', availability_result: 'Sprawdzono dostępność terminu',
  client_error: 'Wystąpił błąd w przeglądarce',
  photo_inquiry_started: 'Rozpoczęto zapytanie o sesję', photo_inquiry_submitted: 'Wysłano zapytanie o sesję',
  aero_inquiry_started: 'Rozpoczęto zapytanie Aero', aero_inquiry_submitted: 'Wysłano zapytanie Aero',
  drone_booking_started: 'Rozpoczęto rezerwację drona', drone_booking_submitted: 'Wysłano rezerwację drona',
};
const GROUP_LABELS: Record<string, string> = {
  service: 'Wybór usługi', package: 'Wybór pakietu', date_time: 'Data lub godzina',
  contact: 'Dane kontaktowe', consent: 'Wymagana zgoda', venue: 'Miejsce sesji',
};
const REASON_LABELS: Record<string, string> = {
  http_error: 'Serwer zwrócił błąd', network_error: 'Błąd połączenia',
  runtime_error: 'Błąd działania strony', unhandled_promise: 'Nieobsłużony błąd strony',
  request_failed: 'Żądanie nie powiodło się', required_missing: 'Brakuje poprawnie uzupełnionych danych',
  no_active_services: 'Brak dostępnych usług', accepted: 'Kod zaakceptowany', invalid_code: 'Kod nieprawidłowy',
  wrong_code_type: 'Niewłaściwy rodzaj kodu', promotion_conflict: 'Kod nie łączy się z promocją pakietu',
};
const CONVERSIONS = new Set(['v2_booking_created', 'v2_booking_complete', 'v2_booking_completed', 'v2_payment_success', 'v2_drone_booking_submitted', 'v2_photo_inquiry_submitted', 'v2_aero_inquiry_submitted']);

// The timeline deliberately projects an allowlist rather than exposing raw
// metadata. Older metadata can contain arbitrary element IDs or free text.
function publicPath(raw: unknown): string {
  if (typeof raw !== 'string') return '/';
  let path = raw.split('?')[0].split('#')[0];
  try { if (/^https?:\/\//.test(raw)) path = new URL(raw).pathname; } catch { return '/'; }
  if (!path.startsWith('/') || /^\/(admin|api|galeria|konto|strefa-klienta|panel-fotografa|logowanie|rejestracja|invite|z|historia|foto-match|foto-wyzwanie\/invite|karta-podarunkowa\/dostep)(\/|$)/.test(path)) return '[strona prywatna]';
  let decoded = path;
  try { decoded = decodeURIComponent(path); } catch { /* keep encoded path */ }
  if (/@|[\r\n]|\b\d{9,}\b/.test(decoded)) return '[adres ukryty]';
  return path.split('/').map(segment => /^[a-f\d-]{32,}$/i.test(segment) || segment.length >= 80 ? ':id' : segment).join('/').slice(0, 500);
}

function choiceText(metadata: Record<string, unknown>) {
  return [metadata.service_name, metadata.package_name, metadata.booking_date, metadata.booking_time]
    .filter((value): value is string => typeof value === 'string').join(' · ') || null;
}

// Requests are sent independently and can arrive out of order. Use the browser
// timestamp only close to receipt; an invalid or badly skewed clock falls back
// to the server timestamp. Session recency always uses server receipt times.
function eventTime(event: JourneyEvent): number {
  const received = event.created_at.getTime();
  const raw = event.metadata.client_ts;
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(raw)) return received;
  const timestamp = Date.parse(raw);
  return Number.isFinite(timestamp) && Math.abs(timestamp - received) <= 300_000 ? timestamp : received;
}

function describeEvent(event: JourneyEvent): JourneyStep | null {
  const key = event.event_type.replace(/^v2_/, '');
  const raw = event.metadata;
  const safe = sanitizeBookingJourneyMetadata(event.event_type, raw);
  let label = EVENT_LABELS[key];
  let detail: string | null = null;
  let tone: JourneyStep['tone'] = 'info';
  if (key === 'click') {
    label = 'Kliknięto';
    const action = typeof raw.analytics_id === 'string' ? raw.analytics_id : '';
    if (ACTION_LABELS[action]) detail = ACTION_LABELS[action];
    else if (action.startsWith('link:/')) detail = `Link: ${publicPath(action.slice(5))}`;
    else detail = 'Brak zapisanej nazwy przycisku w tej wersji pomiaru.';
  } else if (!label) return null;
  else if (key === 'page_view') detail = publicPath(event.page_url);
  else if (key === 'booking_field_state') {
    const field = String(safe.field || ''); const state = String(safe.state || '');
    if (!FIELD_LABELS[field] || !FIELD_STATES[state]) return null;
    detail = `${FIELD_LABELS[field]} — ${FIELD_STATES[state]}`;
    tone = state === 'invalid' ? 'warning' : 'info';
  } else if (key === 'booking_validation_failed') {
    tone = 'warning';
    detail = GROUP_LABELS[String(raw.field_group)] || 'Wymagane dane są niepełne lub niepoprawne.';
  } else if (key === 'booking_code_result') {
    label = safe.code_type === 'gift_card' ? 'Sprawdzono kartę podarunkową' : 'Sprawdzono kod rabatowy';
    detail = REASON_LABELS[String(safe.reason_code)] || 'Brak szczegółów wyniku.';
    tone = safe.status === 'ok' ? 'success' : 'warning';
  } else if (key === 'date_selected' || key === 'time_selected') {
    label = safe.selection_cleared === true ? (key === 'date_selected' ? 'Wyczyszczono datę' : 'Wyczyszczono godzinę') : label;
    detail = choiceText(safe);
  } else if (key === 'drone_addon_selected') {
    label = safe.selected === false ? 'Usunięto dodatek z dronem' : 'Wybrano dodatek z dronem';
    detail = typeof safe.package_name === 'string' ? safe.package_name : null;
  } else if (['service_selected', 'package_selected', 'promotion_package_selected', 'booking_added_to_cart', 'booking_view'].includes(key)) {
    detail = choiceText(safe);
    if (!detail && key !== 'booking_view') detail = 'Szczegóły wyboru nie były zapisane w tej wersji pomiaru.';
  } else if (['service_load_result', 'availability_result', 'checkout_result', 'client_error'].includes(key)) {
    const failed = raw.status === 'error' || raw.status === 'failed' || key === 'client_error';
    const succeeded = raw.status === 'ok';
    tone = failed ? 'error' : succeeded ? 'success' : 'info';
    detail = REASON_LABELS[String(raw.reason_code)] || (failed ? 'Operacja zakończona błędem.' : succeeded ? 'Operacja zakończona poprawnie.' : 'Brak zapisanego wyniku operacji.');
    if (key === 'availability_result' && succeeded && raw.has_available_slots === false) {
      tone = 'warning'; detail = 'Brak dostępnych godzin dla wybranej daty.';
    }
    if (typeof raw.http_status === 'number' && raw.http_status >= 100 && raw.http_status <= 599) detail += ` (HTTP ${raw.http_status})`;
  }
  if (CONVERSIONS.has(event.event_type) || key === 'booking_added_to_cart') tone = 'success';
  if (key === 'payment_failed') tone = 'error';
  return { at: new Date(eventTime(event)).toISOString(), event: key, page: publicPath(event.page_url), label, detail, tone };
}

function sessionContext(events: JourneyEvent[], key: string, fallback: string) {
  const value = events.find(event => typeof event.metadata[key] === 'string')?.metadata[key];
  if (typeof value !== 'string' || value.length > 100 || /[@\r\n<>?]/.test(value)) return fallback;
  return value;
}

export function buildSessionJourneys(events: JourneyEvent[], bookings: BookingReference[] = [], limit = 50): SessionJourney[] {
  const grouped = new Map<string, JourneyEvent[]>();
  for (const event of events) {
    if (!Number.isFinite(event.created_at.getTime())) continue;
    const rows = grouped.get(event.session_id) || [];
    rows.push(event); grouped.set(event.session_id, rows);
  }
  const references = new Map<string, number[]>();
  for (const booking of bookings) if (booking.analytics_session_id && Number.isSafeInteger(booking.id) && booking.id > 0) {
    const ids = references.get(booking.analytics_session_id) || [];
    if (!ids.includes(booking.id)) ids.push(booking.id);
    references.set(booking.analytics_session_id, ids);
  }
  return Array.from(grouped.entries()).map(([sessionId, unsorted]): SessionJourney => {
    const received = [...unsorted].sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
    const items = [...received].sort((a, b) => eventTime(a) - eventTime(b));
    const page = items.find(event => event.event_type === 'v2_page_view');
    const steps = items.map(describeEvent).filter((step): step is JourneyStep => step !== null);
    const fields = new Map<string, SessionJourney['fieldStates'][number]>();
    const choices = new Map<string, string>();
    for (const item of items) {
      const safe = sanitizeBookingJourneyMetadata(item.event_type, item.metadata);
      if (item.event_type === 'v2_page_view' && publicPath(item.page_url) === '/rezerwacja') {
        // A fresh visit creates a fresh form. Keep prior steps in the timeline,
        // but do not present values from the previous attempt as current.
        fields.clear(); choices.clear();
      }
      if (item.event_type === 'v2_booking_field_state' && FIELD_LABELS[String(safe.field)] && FIELD_STATES[String(safe.state)]) {
        const field = String(safe.field);
        fields.set(field, { field, label: FIELD_LABELS[field], state: safe.state as SessionJourney['fieldStates'][number]['state'] });
      }
      if (item.event_type === 'v2_service_selected') {
        choices.clear();
        for (const field of ['drone_goal', 'drone_terms', 'promo_code']) fields.delete(field);
      }
      if (['v2_package_selected', 'v2_promotion_package_selected'].includes(item.event_type)) choices.delete('Godzina');
      if (item.event_type === 'v2_date_selected') {
        choices.delete('Godzina');
        if (safe.selection_cleared === true) choices.delete('Data');
      }
      if (item.event_type === 'v2_time_selected' && safe.selection_cleared === true) choices.delete('Godzina');
      if (item.event_type === 'v2_drone_addon_selected') {
        if (safe.selected === false) choices.delete('Dodatek z dronem');
        else if (typeof safe.package_name === 'string') choices.set('Dodatek z dronem', safe.package_name);
      } else {
        for (const [key, label] of [['service_name', 'Usługa'], ['package_name', 'Pakiet'], ['booking_date', 'Data'], ['booking_time', 'Godzina']]) {
          if (typeof safe[key] === 'string') choices.set(label, safe[key] as string);
        }
      }
    }
    const maxSteps = 120;
    return {
      sessionId, startedAt: received[0].created_at.toISOString(), lastSeenAt: received[received.length - 1].created_at.toISOString(),
      siteHost: safeAnalyticsSiteHost(page?.metadata.site_host || items[0].metadata.site_host),
      landingPage: publicPath(page?.page_url || items[0].page_url), pageViews: items.filter(item => item.event_type === 'v2_page_view').length,
      bookingVisited: items.some(item => /^v2_(booking_|checkout_|drone_booking_)/.test(item.event_type) || /^\/(rezerwacja|checkout)(\/|$)/.test(publicPath(item.page_url))),
      bookingStarted: items.some(isSalesIntentStart), clientConversion: items.some(item => CONVERSIONS.has(item.event_type)),
      source: sessionContext(items, 'source', 'Nieznane'), device: sessionContext(items, 'device', 'Nieznane'), browser: sessionContext(items, 'browser', 'Nieznana'),
      path: steps.slice(-maxSteps), totalSteps: steps.length, omittedSteps: Math.max(0, steps.length - maxSteps),
      issueCount: steps.filter(step => step.tone === 'error' || step.tone === 'warning').length,
      fieldStates: Array.from(fields.values()), choices: Array.from(choices, ([label, value]) => ({ label, value })),
      bookingIds: references.get(sessionId) || [],
    };
  }).sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt)).slice(0, Math.max(0, limit));
}
