'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, MonitorSmartphone, Search } from 'lucide-react';
import type { SessionJourney } from '@/lib/analytics/sessionJourneyTypes';

const FIELD_STATES = {
  filled: 'Wypełnione',
  empty: 'Puste przy sprawdzeniu',
  invalid: 'Wymaga poprawy',
  checked: 'Zaznaczone',
  unchecked: 'Niezaznaczone przy sprawdzeniu',
};

export function journeyDate(value: string, timeOnly = false) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Brak zapisu czasu';
  return new Intl.DateTimeFormat('pl-PL', {
    timeZone: 'Europe/Warsaw',
    ...(timeOnly ? {} : { day: '2-digit', month: '2-digit' }),
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(date);
}

function hasBookingJourney(session: SessionJourney) {
  return session.bookingVisited || session.path.some(step => step.page?.startsWith('/rezerwacja') || /^(booking_|drone_booking_|checkout_)/.test(step.event.replace(/^v2_/, '')))
    || session.landingPage.startsWith('/rezerwacja') || session.bookingIds.length > 0;
}

function deviceLabel(value: string) {
  return ({ mobile: 'Telefon', desktop: 'Komputer', tablet: 'Tablet', unknown: 'Nieustalone' } as Record<string, string>)[value] || value;
}

export default function SessionJourneys({ sessions, unavailable = false }: { sessions: SessionJourney[]; unavailable?: boolean }) {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [host, setHost] = useState('all');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const hosts = useMemo(() => Array.from(new Set(sessions.map(session => session.siteHost))), [sessions]);
  const filtered = useMemo(() => sessions.filter(session => {
    if (host !== 'all' && session.siteHost !== host) return false;
    if (filter === 'booking' && !hasBookingJourney(session)) return false;
    if (filter === 'issues' && session.issueCount === 0) return false;
    const text = `${session.siteHost} ${session.landingPage} ${session.source} ${session.device} ${session.browser} ${session.path.map(step => `${step.label} ${step.page}`).join(' ')}`;
    return text.toLocaleLowerCase('pl-PL').includes(search.trim().toLocaleLowerCase('pl-PL'));
  }), [sessions, host, filter, search]);
  const filtersActive = host !== 'all' || filter !== 'all' || search.length > 0;

  if (unavailable) return <section data-testid="session-path" aria-labelledby="session-heading" className="space-y-3"><h2 id="session-heading" className="text-xl font-semibold">Ostatnie wizyty</h2><div role="alert" className="rounded-xl border border-amber-800 bg-amber-950/30 p-4 text-sm text-amber-200">Nie udało się odczytać zdarzeń wizyt dla tego okresu. To nie oznacza braku ruchu. Użyj „Odśwież”, aby spróbować ponownie.</div></section>;

  return <section data-testid="session-path" aria-labelledby="session-heading" className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><h2 id="session-heading" className="text-xl font-semibold">Ostatnie wizyty</h2><p className="mt-1 text-sm text-zinc-400">Wybierz wizytę, aby zobaczyć kliknięcia i przebieg formularza.</p></div>
      <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300">{filtered.length} z {sessions.length}</span>
    </div>
    <div className="flex flex-wrap gap-2" aria-label="Filtr wizyt">
      {([['all', 'Wszystkie'], ['booking', 'Rezerwacje'], ['issues', 'Z problemami']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`min-h-11 rounded-xl border px-3 text-sm font-medium ${filter === value ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200' : 'border-zinc-700 bg-zinc-900 text-zinc-300'}`}>{label}</button>)}
    </div>
    <details className="rounded-xl border border-zinc-800 bg-zinc-900/40">
      <summary className="min-h-11 cursor-pointer px-3 py-3 text-sm text-zinc-300">Szukaj i wybierz domenę{filtersActive ? ' · filtry aktywne' : ''}</summary>
      <div className="grid gap-3 border-t border-zinc-800 p-3 sm:grid-cols-2">
        <label className="relative"><Search aria-hidden="true" size={17} className="absolute left-3 top-3.5 text-zinc-400"/><input aria-label="Szukaj wizyty po stronie, źródle lub urządzeniu" value={search} onChange={event => setSearch(event.target.value)} placeholder="Strona, źródło lub urządzenie" className="min-h-11 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-950 py-2 pl-9 pr-3 text-base"/></label>
        <select aria-label="Domena wizyty" value={host} onChange={event => setHost(event.target.value)} className="min-h-11 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-base"><option value="all">Wszystkie domeny</option>{hosts.map(value => <option key={value} value={value}>{value === 'unknown' ? 'Nieustalona domena (historia)' : value}</option>)}</select>
      </div>
    </details>
    <div className="space-y-3">
      {filtered.map((session, index) => {
        const expanded = expandedSession === session.sessionId;
        const detailId = `journey-details-${index}`;
        const buttonId = `journey-toggle-${index}`;
        const booking = hasBookingJourney(session);
        const lastStep = session.path[session.path.length - 1];
        return <article key={session.sessionId} className={`min-w-0 overflow-hidden rounded-2xl border ${session.issueCount ? 'border-amber-800/70' : 'border-zinc-800'} bg-zinc-900/60`}>
          <button id={buttonId} type="button" aria-expanded={expanded} aria-controls={detailId} onClick={() => setExpandedSession(expanded ? null : session.sessionId)} className="w-full min-w-0 p-4 text-left hover:bg-zinc-800/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400">
            <span className="flex items-start justify-between gap-3"><span className="font-semibold">{journeyDate(session.startedAt)}</span><ChevronDown aria-hidden="true" size={20} className={`shrink-0 text-zinc-400 transition-transform ${expanded ? 'rotate-180' : ''}`}/></span>
            <span className="mt-2 flex flex-wrap gap-2 text-sm">
              {booking && <span className="rounded-md bg-sky-950/70 px-2 py-1 text-sky-200">Rezerwacja</span>}
              {session.clientConversion && <span className="rounded-md bg-emerald-950/70 px-2 py-1 text-emerald-200">Zapisano zdarzenie wysłania</span>}
              {session.issueCount > 0 && <span className="flex items-center gap-1 rounded-md bg-amber-950/70 px-2 py-1 text-amber-200"><AlertTriangle aria-hidden="true" size={14}/>{session.issueCount} sygn. problemu</span>}
            </span>
            <span className="mt-2 block break-words text-sm text-zinc-300 [overflow-wrap:anywhere]">{session.siteHost === 'unknown' ? 'Nieustalona domena' : session.siteHost}<span className="text-zinc-400">{session.landingPage}</span></span>
            <span className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-zinc-300 sm:grid-cols-4">
              <span><span className="block text-zinc-400">Ostatni zapis</span>{journeyDate(session.lastSeenAt, true)}</span>
              <span><span className="block text-zinc-400">Odsłony</span>{session.pageViews}</span>
              <span className="min-w-0 break-words [overflow-wrap:anywhere]"><span className="block text-zinc-400">Źródło</span>{session.source || 'Nieustalone'}</span>
              <span className="min-w-0 break-words"><span className="flex items-center gap-1 text-zinc-400"><MonitorSmartphone aria-hidden="true" size={14}/>Urządzenie</span>{[deviceLabel(session.device), session.browser].filter(Boolean).join(' · ') || 'Nieustalone'}</span>
            </span>
            {lastStep && <span className="mt-3 block break-words border-t border-zinc-800 pt-3 text-sm text-zinc-300 [overflow-wrap:anywhere]">Ostatnie zdarzenie: <span className="text-zinc-100">{lastStep.label}</span></span>}
            <span className="mt-3 block text-sm font-medium text-emerald-300">{expanded ? 'Zwiń przebieg wizyty' : 'Zobacz przebieg wizyty'}</span>
          </button>
          {expanded && <div id={detailId} role="region" aria-labelledby={buttonId} className="space-y-5 border-t border-zinc-800 bg-zinc-950/50 p-4">
            {session.choices.length > 0 && <div><h3 className="text-sm font-semibold">Wybory w formularzu</h3><dl className="mt-3 grid gap-3 sm:grid-cols-2">{session.choices.map(choice => <div key={choice.label} className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900 p-3"><dt className="text-sm text-zinc-400">{choice.label}</dt><dd className="mt-1 break-words text-sm font-medium [overflow-wrap:anywhere]">{choice.value}</dd></div>)}</dl></div>}
            <div><h3 className="text-sm font-semibold">Pola formularza — ostatni zapisany stan</h3>
              {session.fieldStates.length > 0 ? <dl className="mt-3 grid gap-2 sm:grid-cols-2">{session.fieldStates.map(field => <div key={field.field} className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 rounded-lg bg-zinc-900 p-3 text-sm"><dt className="text-zinc-300">{field.label}</dt><dd className={field.state === 'invalid' ? 'text-amber-300' : field.state === 'filled' || field.state === 'checked' ? 'text-emerald-300' : 'text-zinc-400'}>{FIELD_STATES[field.state]}</dd></div>)}</dl> : <p className="mt-2 text-sm text-zinc-400">Brak zapisanych informacji o wypełnieniu pól dla tej wizyty.</p>}
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">Brak zdarzenia nie oznacza pustego pola ani porzucenia formularza. Treści prywatnych pól (np. imię, e-mail, telefon, wiadomość) nie zapisujemy w analityce. Dane klienta są dostępne w wysłanej rezerwacji.</p>
            </div>
            {session.bookingIds.length > 0 && <div className="rounded-xl border border-emerald-900 bg-emerald-950/20 p-3 text-sm"><p>Zapisane rezerwacje: {session.bookingIds.map(id => `#${id}`).join(', ')}. Sam zapis nie potwierdza opłacenia.</p><a href="/admin/bookings" className="mt-1 inline-flex min-h-11 items-center font-medium text-emerald-300 underline underline-offset-4">Otwórz listę rezerwacji</a></div>}
            <div><h3 className="text-sm font-semibold">Przebieg wizyty <span className="font-normal text-zinc-400">({session.path.length} zdarzeń)</span></h3>
              {session.omittedSteps > 0 && <p className="mt-2 rounded-lg border border-amber-900/70 bg-amber-950/20 p-3 text-sm text-amber-200">Długa wizyta: pokazujemy {session.path.length} najnowszych z {session.totalSteps} zdarzeń. Pominięto {session.omittedSteps} wcześniejszych wpisów.</p>}
              <ol className="mt-4 space-y-4 border-l border-zinc-700 pl-4">{session.path.map((step, stepIndex) => <li key={`${step.at}-${stepIndex}`} className="relative min-w-0 pl-1"><span aria-hidden="true" className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full ${step.tone === 'error' ? 'bg-red-400' : step.tone === 'warning' ? 'bg-amber-400' : step.tone === 'success' ? 'bg-emerald-400' : 'bg-zinc-500'}`}/><time dateTime={step.at} className="text-sm text-zinc-400">{journeyDate(step.at)}</time><p className={`mt-1 break-words text-sm font-medium [overflow-wrap:anywhere] ${step.tone === 'error' ? 'text-red-300' : step.tone === 'warning' ? 'text-amber-200' : 'text-zinc-100'}`}>{step.label}</p>{step.detail && <p className="mt-1 break-words text-sm text-zinc-300 [overflow-wrap:anywhere]">{step.detail}</p>}<p className="mt-1 break-words text-sm text-zinc-400 [overflow-wrap:anywhere]">{step.page}</p></li>)}</ol>
              {session.path.length === 0 && <p className="mt-2 text-sm text-zinc-400">Brak szczegółów zdarzeń tej wizyty.</p>}
            </div>
          </div>}
        </article>;
      })}
      {filtered.length === 0 && <div className="rounded-2xl border border-dashed border-zinc-700 p-5 text-sm text-zinc-300"><p>{sessions.length ? 'Brak wizyt pasujących do filtrów.' : 'Brak zapisanych wizyt w wybranym okresie.'}</p>{filtersActive && <button type="button" onClick={() => { setFilter('all'); setHost('all'); setSearch(''); }} className="mt-3 min-h-11 rounded-lg border border-zinc-600 px-4">Wyczyść filtry</button>}</div>}
    </div>
    <p className="text-sm leading-relaxed text-zinc-400">To najnowsze zapisane wizyty w wybranym okresie, nie podgląd na żywo. Czas ostatniego zdarzenia nie potwierdza, że osoba nadal jest na stronie. Godziny według czasu polskiego.</p>
  </section>;
}
