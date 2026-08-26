import prisma from '../../src/lib/db/prisma';
import { sendEmail } from '../../src/lib/email/sender';
import { getAverageMonthlyBookingValue, getAverageMonthlyNetPayments, getFinanceSummary } from '../../src/lib/analytics/finance';
import { diagnoseFunnel } from '../../src/lib/analytics/funnelDiagnostics';
import { buildCrmDailySnapshot, renderCrmDailyHtml } from '../../src/lib/crm/daily-report';
import { recordAdminIncidentSafely } from '../../src/lib/admin-incidents';

const DAY = 24 * 60 * 60 * 1000;
const WARSAW = 'Europe/Warsaw';

function warsawParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: WARSAW, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find(part => part.type === type)?.value || 0);
  return { year: value('year'), month: value('month'), day: value('day'), hour: value('hour') };
}

function warsawBoundary(year: number, month: number, day: number) {
  const guess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const zone = new Intl.DateTimeFormat('en', { timeZone: WARSAW, timeZoneName: 'longOffset' })
    .formatToParts(guess).find(part => part.type === 'timeZoneName')?.value || 'GMT+00:00';
  const match = zone.match(/GMT([+-])(\d{2}):(\d{2})/);
  const offset = match ? (match[1] === '+' ? 1 : -1) * (Number(match[2]) * 60 + Number(match[3])) : 0;
  return new Date(guess.getTime() - offset * 60_000);
}

function shiftedDate(year: number, month: number, day: number, deltaDays: number) {
  const shifted = new Date(Date.UTC(year, month - 1, day + deltaDays));
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
}

function fullMonthRanges(now: Date, count: number) {
  const current = warsawParts(now);
  return Array.from({ length: count }, (_, index) => {
    const startCalendar = new Date(Date.UTC(current.year, current.month - 2 - index, 1));
    const endCalendar = new Date(Date.UTC(current.year, current.month - 1 - index, 1));
    return {
      start: warsawBoundary(startCalendar.getUTCFullYear(), startCalendar.getUTCMonth() + 1, 1),
      end: warsawBoundary(endCalendar.getUTCFullYear(), endCalendar.getUTCMonth() + 1, 1),
    };
  });
}

type EventRow = {
  event_type: string;
  page_url: string | null;
  user_id: string;
  session_id: string;
  created_at: Date;
  metadata: string | null;
};

function parseMetadata(value: string | null): Record<string, any> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function path(value: string | null) {
  if (!value) return '/';
  try {
    if (value.startsWith('http')) return new URL(value).pathname;
  } catch {}
  return value.split('?')[0] || '/';
}

function summarize(rows: EventRow[]) {
  const events = rows
    .filter(row => !path(row.page_url).startsWith('/admin'))
    .map(row => ({ ...row, meta: parseMetadata(row.metadata) }));
  const users = new Set(events.map(e => e.user_id));
  const sessions = new Set(events.map(e => e.session_id));
  const pageViews = events.filter(e => e.event_type === 'v2_page_view');
  const activeMs = events
    .filter(e => e.event_type === 'v2_engagement')
    .reduce((sum, e) => sum + Number(e.meta.active_ms || 0), 0);

  const bySession = new Map<string, any>();
  for (const e of events) {
    let s = bySession.get(e.session_id);
    if (!s) {
      s = {
        id: e.session_id,
        source: e.meta.source || 'Unknown',
        started: e.created_at,
        ended: e.created_at,
        pages: [] as string[],
        activeMs: 0,
        bookingStarted: false,
        bookingCompleted: false,
      };
    }
    if (e.created_at < s.started) s.started = e.created_at;
    if (e.created_at > s.ended) s.ended = e.created_at;
    if (e.event_type === 'v2_page_view') s.pages.push(path(e.page_url));
    if (e.event_type === 'v2_engagement') s.activeMs += Number(e.meta.active_ms || 0);
    if (['v2_booking_start','v2_booking_started'].includes(e.event_type)) s.bookingStarted = true;
    if (['v2_booking_created','v2_booking_complete','v2_booking_completed'].includes(e.event_type)) s.bookingCompleted = true;
    bySession.set(e.session_id, s);
  }

  const sessionsList = Array.from(bySession.values());
  const sourceMap = new Map<string, number>();
  const exitMap = new Map<string, number>();
  const routeMap = new Map<string, number>();

  for (const s of sessionsList) {
    sourceMap.set(s.source, (sourceMap.get(s.source) || 0) + 1);
    const last = s.pages.at(-1);
    if (last) exitMap.set(last, (exitMap.get(last) || 0) + 1);
    if (s.pages.length > 1) {
      const route = s.pages.slice(0, 5).join(' → ');
      routeMap.set(route, (routeMap.get(route) || 0) + 1);
    }
  }

  const top = (map: Map<string, number>, n = 5) => Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, count]) => ({ name, count }));

  const engaged = [...sessionsList]
    .filter(s => s.pages.length > 1 || s.activeMs >= 60_000)
    .sort((a, b) => b.activeMs - a.activeMs)
    .slice(0, 5);

  return {
    users: users.size,
    sessions: sessions.size,
    pageViews: pageViews.length,
    activeMinutes: Math.round(activeMs / 600) / 100,
    avgPages: sessions.size ? Math.round((pageViews.length / sessions.size) * 10) / 10 : 0,
    bookingStarts: sessionsList.filter(s => s.bookingStarted).length,
    bookingCompletes: sessionsList.filter(s => s.bookingCompleted).length,
    sources: top(sourceMap),
    exits: top(exitMap),
    routes: top(routeMap),
    engaged,
  };
}

function organicSeo(rows: EventRow[]) {
  const organic = rows.filter(row => {
    const meta = parseMetadata(row.metadata);
    return row.event_type === 'v2_page_view' && meta.source === 'Google Organic';
  });
  const sessions = new Set(organic.map(row => row.session_id));
  const pages = new Map<string, number>();
  organic.forEach(row => pages.set(path(row.page_url), (pages.get(path(row.page_url)) || 0) + 1));
  return {
    sessions: sessions.size,
    pageViews: organic.length,
    pages: Array.from(pages.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8),
  };
}

function esc(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function pct(current: number, previous: number) {
  if (!previous) return current ? 'nowe' : '0%';
  const value = Math.round(((current - previous) / previous) * 1000) / 10;
  return `${value > 0 ? '+' : ''}${value}%`;
}

function section(title: string, data: ReturnType<typeof summarize>, compare?: ReturnType<typeof summarize>) {
  const stat = (label: string, value: string | number, change?: string) => `<td style="padding:12px;border:1px solid #e5e7eb"><div style="font-size:11px;color:#6b7280;text-transform:uppercase">${label}</div><div style="font-size:22px;font-weight:700;margin-top:4px">${value}</div>${change ? `<div style="font-size:11px;color:#6b7280;margin-top:3px">${change} vs poprzedni okres</div>` : ''}</td>`;
  const rows = (items: Array<{name:string,count:number}>) => items.length
    ? items.map(x => `<tr><td style="padding:5px 0">${esc(x.name)}</td><td style="text-align:right;padding:5px 0;font-weight:600">${x.count}</td></tr>`).join('')
    : '<tr><td style="padding:5px 0;color:#9ca3af">Brak danych</td><td></td></tr>';

  return `
  <h2 style="font-size:20px;margin:30px 0 12px">${title}</h2>
  <table style="width:100%;border-collapse:collapse"><tr>
    ${stat('Użytkownicy', data.users, compare ? pct(data.users, compare.users) : undefined)}
    ${stat('Sesje', data.sessions, compare ? pct(data.sessions, compare.sessions) : undefined)}
    ${stat('Odsłony', data.pageViews, compare ? pct(data.pageViews, compare.pageViews) : undefined)}
    ${stat('Aktywny czas', `${data.activeMinutes} min`, compare ? pct(data.activeMinutes, compare.activeMinutes) : undefined)}
  </tr><tr>
    ${stat('Stron / sesję', data.avgPages)}
    ${stat('Start rezerwacji', data.bookingStarts)}
    ${stat('Rezerwacje V2', data.bookingCompletes)}
    ${stat('Konwersja sesji', data.sessions ? `${Math.round((data.bookingCompletes / data.sessions) * 1000) / 10}%` : '0%')}
  </tr></table>

  <table style="width:100%;margin-top:18px;border-collapse:collapse"><tr style="vertical-align:top">
    <td style="width:33%;padding-right:18px"><h3 style="font-size:14px;margin:0 0 8px">Źródła ruchu</h3><table style="width:100%">${rows(data.sources)}</table></td>
    <td style="width:33%;padding-right:18px"><h3 style="font-size:14px;margin:0 0 8px">Gdzie wychodzą</h3><table style="width:100%">${rows(data.exits)}</table></td>
    <td style="width:34%"><h3 style="font-size:14px;margin:0 0 8px">Najczęstsze ścieżki</h3><table style="width:100%">${rows(data.routes)}</table></td>
  </tr></table>`;
}

function insights(day: ReturnType<typeof summarize>, week: ReturnType<typeof summarize>, month: ReturnType<typeof summarize>) {
  const out: string[] = [];
  if (day.sessions === 0) out.push('Brak sesji V2 w poprzednim dniu kalendarzowym.');
  if (day.sessions > 0 && day.bookingStarts === 0) out.push('Był ruch, ale nikt nie rozpoczął rezerwacji — sprawdź CTA i stronę oferty.');
  if (day.bookingStarts > 0 && day.bookingCompletes === 0) out.push('Klienci rozpoczynali rezerwację, ale żadna nie została zakończona — to najważniejszy punkt do sprawdzenia.');
  if (day.avgPages >= 4) out.push(`Dzisiejszy ruch jest głęboki: średnio ${day.avgPages} strony na sesję.`);
  if (week.sessions > 0 && month.sessions > 0) {
    const weeklyShare = Math.round((week.sessions / month.sessions) * 100);
    if (weeklyShare >= 40) out.push(`Ostatnie 7 dni odpowiada za ${weeklyShare}% ruchu z ostatnich 30 dni — ruch przyspieszył.`);
  }
  const topExit = day.exits[0];
  if (topExit && topExit.count >= 2) out.push(`Najczęstsze miejsce wyjścia w ostatniej dobie: ${topExit.name} (${topExit.count} sesje).`);
  return out.slice(0, 6);
}

export default async () => {
  const now = new Date();
  const currentWarsaw = warsawParts(now);
  // Netlify invokes this at 06:00 and 07:00 UTC. Exactly one invocation is 08:00 in Warsaw.
  const forced = process.env.ANALYTICS_REPORT_FORCE_SEND === 'true';
  if (currentWarsaw.hour !== 8 && !forced) return;

  const recipient = process.env.ANALYTICS_REPORT_RECIPIENTS?.trim() || 'pwlasniewski@gmail.com';
  const reportPeriod = `${String(currentWarsaw.year)}-${String(currentWarsaw.month).padStart(2, '0')}-${String(currentWarsaw.day).padStart(2, '0')}`;
  const reportMarker = `DAILY_ANALYTICS_REPORT_SENT_${reportPeriod}`;
  const reportKey = forced ? `${reportMarker}_MANUAL` : reportMarker;

  const start30 = new Date(now.getTime() - 30 * DAY);
  const rows = await prisma.analyticsEvent.findMany({
    where: { event_type: { startsWith: 'v2_' }, created_at: { gte: start30, lt: now } },
    orderBy: { created_at: 'asc' },
    select: { event_type: true, page_url: true, user_id: true, session_id: true, created_at: true, metadata: true },
  });

  const slice = (from: Date, to: Date) => rows.filter(r => r.created_at >= from && r.created_at < to);
  const todayStart = warsawBoundary(currentWarsaw.year, currentWarsaw.month, currentWarsaw.day);
  const yesterday = shiftedDate(currentWarsaw.year, currentWarsaw.month, currentWarsaw.day, -1);
  const dayBefore = shiftedDate(currentWarsaw.year, currentWarsaw.month, currentWarsaw.day, -2);
  const dayStart = warsawBoundary(yesterday.year, yesterday.month, yesterday.day);
  const prevDayStart = warsawBoundary(dayBefore.year, dayBefore.month, dayBefore.day);
  const weekStart = new Date(now.getTime() - 7 * DAY);
  const prevWeekStart = new Date(now.getTime() - 14 * DAY);

  const day = summarize(slice(dayStart, todayStart));
  const prevDay = summarize(slice(prevDayStart, dayStart));
  const week = summarize(slice(weekStart, now));
  const prevWeek = summarize(slice(prevWeekStart, weekStart));
  const month = summarize(rows);
  const seo = organicSeo(rows);
  const currentMonthStart = warsawBoundary(currentWarsaw.year, currentWarsaw.month, 1);
  const [dayFinance, currentMonthFinance, averageSixMonths, averageBookingValue] = await Promise.all([
    getFinanceSummary(dayStart, todayStart),
    getFinanceSummary(currentMonthStart, now),
    getAverageMonthlyNetPayments(fullMonthRanges(now, 6)),
    getAverageMonthlyBookingValue(fullMonthRanges(now, 6)),
  ]);
  let crmHtml: string;
  try {
    crmHtml = renderCrmDailyHtml(await buildCrmDailySnapshot(dayStart, todayStart));
  } catch (error) {
    await recordAdminIncidentSafely({
      severity: 'P1', category: 'REPORTING', reasonCode: 'DAILY_CRM_REPORT_FAILED',
      summary: 'Nie udało się zbudować sekcji CRM raportu dziennego',
      details: { error: error instanceof Error ? error.message : String(error), report_period: reportPeriod },
    });
    throw error;
  }

  const notes = insights(day, week, month);
  const diagnostics = diagnoseFunnel(slice(dayStart, todayStart).map(row => ({
    event_type: row.event_type,
    session_id: row.session_id,
    metadata: parseMetadata(row.metadata),
    created_at: row.created_at,
  })));
  const actionRows = diagnostics.actions.map(action => `<div style="margin:10px 0;padding:12px;border:1px solid ${action.kind === 'error' ? '#fecaca' : '#fde68a'};border-radius:10px">
    <strong>${esc(action.title)}</strong> <span style="font-size:11px;color:#6b7280">pewność: ${esc(action.confidence)}</span><br>
    <span>${esc(action.evidence)}</span><br><span style="color:#374151">Działanie: ${esc(action.recommendation)}</span>
  </div>`).join('');
  const topSessions = day.engaged.map((s: any) => `<li style="margin:7px 0"><strong>${esc(s.source)}</strong> · ${Math.round(s.activeMs / 600) / 100} min aktywnie · ${s.pages.length} stron<br><span style="color:#6b7280">${esc(s.pages.slice(0, 7).join(' → '))}</span></li>`).join('');

  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:24px;color:#111827"><div style="max-width:980px;margin:auto;background:white;padding:28px;border-radius:16px">
  <div style="font-size:12px;color:#6b7280">FOTO-DRON · ANALYTICS 2.1</div>
  <h1 style="font-size:28px;margin:6px 0">Codzienny raport biznesowy</h1>
  <p style="color:#6b7280;margin-top:0">Stan na ${now.toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' })}. Wyłącznie dane Analytics V2; legacy, boty, /admin i wykluczone urządzenia administratorów nie są raportowane.</p>
  <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px"><strong>Co wymaga działania teraz</strong>${actionRows || '<p style="margin-bottom:0;color:#6b7280">Brak wystarczających dowodów na problem w ostatniej dobie.</p>'}</div>
  ${notes.length ? `<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:16px"><strong>Co dziś zwraca uwagę</strong><ul style="margin-bottom:0">${notes.map(n => `<li style="margin:6px 0">${esc(n)}</li>`).join('')}</ul></div>` : ''}
  ${section('Wczoraj — dzień kalendarzowy Europe/Warsaw', day, prevDay)}
  ${crmHtml}
  ${section('Ostatnie 7 dni', week, prevWeek)}
  ${section('Ostatnie 30 dni', month)}
  <h2 style="font-size:20px;margin:30px 0 12px">SEO — ruch organiczny z Google (30 dni)</h2>
  <p><strong>${seo.sessions}</strong> sesji · <strong>${seo.pageViews}</strong> odsłon organicznych.</p>
  ${seo.pages.length ? `<table style="width:100%;border-collapse:collapse">${seo.pages.map(([pageName, count]) => `<tr><td style="padding:6px;border-bottom:1px solid #eee">${esc(pageName)}</td><td style="padding:6px;text-align:right;border-bottom:1px solid #eee">${count}</td></tr>`).join('')}</table>` : '<p style="color:#9ca3af">Brak organicznych odsłon V2 w tym okresie.</p>'}
  <p style="font-size:12px;color:#6b7280">To dane własnej analityki strony. Kliknięcia, wyświetlenia, CTR i pozycje wymagają osobnego połączenia Google Search Console.</p>
  <h2 style="font-size:20px;margin:30px 0 10px">Najbardziej zaangażowane sesje z ostatniej doby</h2>
  ${topSessions ? `<ol>${topSessions}</ol>` : '<p style="color:#9ca3af">Brak zaangażowanych sesji.</p>'}
  <h2 style="font-size:20px;margin:30px 0 12px">Finanse — na końcu raportu</h2>
  <table style="width:100%;border-collapse:collapse"><tr>
    <td style="padding:12px;border:1px solid #e5e7eb"><div style="font-size:11px;color:#6b7280;text-transform:uppercase">Wpływy netto wczoraj</div><div style="font-size:22px;font-weight:700">${(dayFinance.receivedPaymentsNet / 100).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}</div></td>
    <td style="padding:12px;border:1px solid #e5e7eb"><div style="font-size:11px;color:#6b7280;text-transform:uppercase">Wpływy netto w tym miesiącu</div><div style="font-size:22px;font-weight:700">${(currentMonthFinance.receivedPaymentsNet / 100).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}</div></td>
    <td style="padding:12px;border:1px solid #e5e7eb"><div style="font-size:11px;color:#6b7280;text-transform:uppercase">Średnie zarejestrowane wpływy netto — 6 pełnych miesięcy</div><div style="font-size:22px;font-weight:700">${(averageSixMonths / 100).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}</div></td>
    <td style="padding:12px;border:1px solid #e5e7eb"><div style="font-size:11px;color:#6b7280;text-transform:uppercase">Średnia wartość nowych rezerwacji — 6 pełnych miesięcy</div><div style="font-size:22px;font-weight:700">${(averageBookingValue / 100).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}</div></td>
  </tr></table>
  <p style="font-size:12px;color:#6b7280">Zarejestrowane wpływy netto = transakcje z kanonicznego rejestru płatności oraz rozpoznane starsze wpłaty − zakończone zwroty. Pełna historia sprzed uruchomienia rejestru może być niekompletna. Dochód księgowy nie jest wyliczany, ponieważ system nie ma kompletnej ewidencji kosztów.</p>
  <p style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af">Raport automatyczny. Dane administratorów są odcinane po stronie trackera dla /admin, przez flagę urządzenia oraz listę ADMIN_IP.</p>
  </div></body></html>`;

  // The unique report key is the first delivery lock. For a retry, updateMany
  // atomically changes only FAILED or stale PENDING rows, so a concurrent
  // invocation cannot acquire the same delivery at the same time.
  let delivery: { id: number } | null = null;
  try {
    delivery = await prisma.reportDelivery.create({
      data: { report_key: reportKey, report_type: 'DAILY_ANALYTICS', period: reportPeriod, recipient, status: 'PENDING' },
      select: { id: true },
    });
  } catch (error) {
    const isUniqueConflict = typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
    if (!isUniqueConflict) throw error;

    const previous = await prisma.reportDelivery.findUnique({
      where: { report_key: reportKey },
      select: { id: true, status: true, attempted_at: true },
    });
    if (!previous || previous.status === 'SENT') return;

    const staleBefore = new Date(Date.now() - 30 * 60 * 1000);
    const retryable = previous.status === 'FAILED'
      ? { id: previous.id, status: 'FAILED' }
      : { id: previous.id, status: 'PENDING', attempted_at: { lt: staleBefore } };
    const claim = await prisma.reportDelivery.updateMany({
      where: retryable,
      data: { status: 'PENDING', attempted_at: new Date(), error: null, recipient },
    });
    if (claim.count !== 1) return;
    delivery = { id: previous.id };
  }

  if (!delivery) return;

  try {
    await sendEmail({
      to: recipient,
      subject: `Raport Foto-Dron — klienci, sprzedaż i wpływy — ${now.toLocaleDateString('pl-PL', { timeZone: WARSAW })}`,
      html,
    });
    await prisma.reportDelivery.update({ where: { id: delivery.id }, data: { status: 'SENT', sent_at: new Date() } });
  } catch (error) {
    await prisma.reportDelivery.update({
      where: { id: delivery.id },
      data: {
        status: 'FAILED',
        error: (error instanceof Error ? error.message : String(error)).slice(0, 2000),
      },
    }).catch(() => null);
    await recordAdminIncidentSafely({
      severity: 'P1', category: 'REPORTING', reasonCode: 'DAILY_REPORT_DELIVERY_FAILED',
      summary: 'Nie udało się wysłać dziennego raportu biznesowego',
      details: { error: error instanceof Error ? error.message : String(error), report_period: reportPeriod },
    });
    throw error;
  }
  await prisma.systemLog.create({
    data: {
      level: 'INFO',
      module: 'ANALYTICS_REPORT',
      message: reportMarker,
      metadata: JSON.stringify({ recipient, reportPeriod, timezone: WARSAW }),
    },
  });
};
