import prisma from '../../src/lib/db/prisma';
import { getAdminEmail, sendEmail } from '../../src/lib/email/sender';

const DAY = 24 * 60 * 60 * 1000;

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
    if (['v2_booking_start','v2_booking_started'].includes(e.event_type) || (e.event_type === 'v2_form_start' && path(e.page_url).includes('rezerwacja'))) s.bookingStarted = true;
    if (['v2_booking_complete','v2_booking_completed','v2_payment_success'].includes(e.event_type)) s.bookingCompleted = true;
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
  if (day.sessions === 0) out.push('Brak sesji V2 w ostatnich 24 godzinach.');
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
  const recipient = await getAdminEmail();
  if (!recipient) throw new Error('Analytics report: admin email is not configured');

  const now = new Date();
  const start30 = new Date(now.getTime() - 30 * DAY);
  const rows = await prisma.analyticsEvent.findMany({
    where: { event_type: { startsWith: 'v2_' }, created_at: { gte: start30, lt: now } },
    orderBy: { created_at: 'asc' },
    select: { event_type: true, page_url: true, user_id: true, session_id: true, created_at: true, metadata: true },
  });

  const slice = (from: Date, to: Date) => rows.filter(r => r.created_at >= from && r.created_at < to);
  const dayStart = new Date(now.getTime() - DAY);
  const prevDayStart = new Date(now.getTime() - 2 * DAY);
  const weekStart = new Date(now.getTime() - 7 * DAY);
  const prevWeekStart = new Date(now.getTime() - 14 * DAY);

  const day = summarize(slice(dayStart, now));
  const prevDay = summarize(slice(prevDayStart, dayStart));
  const week = summarize(slice(weekStart, now));
  const prevWeek = summarize(slice(prevWeekStart, weekStart));
  const month = summarize(rows);

  const notes = insights(day, week, month);
  const topSessions = day.engaged.map((s: any) => `<li style="margin:7px 0"><strong>${esc(s.source)}</strong> · ${Math.round(s.activeMs / 600) / 100} min aktywnie · ${s.pages.length} stron<br><span style="color:#6b7280">${esc(s.pages.slice(0, 7).join(' → '))}</span></li>`).join('');

  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:24px;color:#111827"><div style="max-width:980px;margin:auto;background:white;padding:28px;border-radius:16px">
  <div style="font-size:12px;color:#6b7280">FOTO-DRON · ANALYTICS 2.0</div>
  <h1 style="font-size:28px;margin:6px 0">Codzienny raport biznesowy</h1>
  <p style="color:#6b7280;margin-top:0">Stan na ${now.toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' })}. Wyłącznie dane Analytics V2; legacy, boty, /admin i wykluczone urządzenia administratorów nie są raportowane.</p>
  ${notes.length ? `<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:16px"><strong>Co dziś zwraca uwagę</strong><ul style="margin-bottom:0">${notes.map(n => `<li style="margin:6px 0">${esc(n)}</li>`).join('')}</ul></div>` : ''}
  ${section('Ostatnie 24 godziny', day, prevDay)}
  ${section('Ostatnie 7 dni', week, prevWeek)}
  ${section('Ostatnie 30 dni', month)}
  <h2 style="font-size:20px;margin:30px 0 10px">Najbardziej zaangażowane sesje z ostatniej doby</h2>
  ${topSessions ? `<ol>${topSessions}</ol>` : '<p style="color:#9ca3af">Brak zaangażowanych sesji.</p>'}
  <p style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af">Raport automatyczny. Dane administratorów są odcinane po stronie trackera dla /admin, przez flagę urządzenia oraz listę ADMIN_IP.</p>
  </div></body></html>`;

  await sendEmail({
    to: recipient,
    subject: `Analytics Foto-Dron — dzień / 7 dni / 30 dni — ${now.toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw' })}`,
    html,
  });
};
