
'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BookingsCalendar, { BookingRow, CalendarBooking } from '@/components/BookingsCalendar';
import AddCalendarBooking from '@/components/admin/AddCalendarBooking';

type Event = Omit<CalendarBooking, 'service' | 'package'> & { title: string; venue: string | null };
export default function DashboardCalendarWidget() {
    const router = useRouter();
    const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const changeMonth = useCallback((next: Date) => setMonth(current => current.getFullYear() === next.getFullYear() && current.getMonth() === next.getMonth() ? current : next), []);
    const [events, setEvents] = useState<CalendarBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [revision, setRevision] = useState(0);
    const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Warsaw' }).format(new Date());
    const upcoming = events.filter(event => event.date.slice(0, 10) >= today
        && !['cancelled', 'rejected', 'archived', 'payment_failed', 'completed'].includes(event.status))
        .sort((a, b) => a.date.localeCompare(b.date) || (a.start_time || '').localeCompare(b.start_time || ''));
    const selectEvent = (event: CalendarBooking) => { if (event.detail_url) router.push(event.detail_url); };
    const reload = useCallback(() => setRevision(v => v + 1), []);
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true); setError('');
        const token = localStorage.getItem('admin_token');
        // One shared read covers the visible grid and ALL future events, even years away.
        const gridStart = new Date(Date.UTC(month.getFullYear(), month.getMonth(), -6)).toISOString().slice(0, 10);
        const from = gridStart < today ? gridStart : today;
        fetch(`/api/admin/calendar-events?from=${from}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: controller.signal,
        }).then(async response => {
            if (!response.ok) throw new Error('Nie udało się wczytać kalendarza. Sprawdź logowanie i ponów.');
            return response.json();
        }).then(data => setEvents((data.events || []).map((e: Event) => ({ ...e, service: e.title, package: '', venue_place: e.venue }))))
            .catch(e => { if (!controller.signal.aborted) { setEvents([]); setError(e.message || 'Błąd połączenia.'); } })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [month, revision, today]);
    return <section aria-label="Kalendarz na pulpicie">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-medium text-white">Kalendarz sesji</h2>
            <div className="flex flex-wrap items-center gap-3"><AddCalendarBooking onCreated={reload} /><Link href="/admin/bookings/calendar" className="text-sm text-gold-400">Pełny kalendarz i filtry →</Link></div>
        </div>
        {loading && <p role="status" className="mb-2 text-sm text-zinc-400">Wczytywanie terminów…</p>}
        {error && <p role="alert" className="mb-2 text-sm text-red-300">{error} <button onClick={reload} className="underline">Ponów</button></p>}
        <BookingsCalendar bookings={events} onMonthChange={changeMonth} onSelectBooking={selectEvent} />
        <section aria-labelledby="upcoming-bookings-heading" className="mt-5 rounded-2xl border border-zinc-700 bg-zinc-900 p-4">
            <h3 id="upcoming-bookings-heading" className="text-lg font-medium text-white">Najbliższe rezerwacje</h3>
            <p className="mt-1 mb-3 text-sm text-zinc-400">Wszystkie nadchodzące terminy od dziś — niezależnie od wybranego miesiąca i roku.</p>
            {loading ? <p className="text-sm text-zinc-400">Wczytywanie rezerwacji…</p>
                : error ? <p className="text-sm text-red-300">Nie udało się wczytać najbliższych rezerwacji. Użyj przycisku „Ponów” powyżej.</p>
                : upcoming.length === 0 ? <p className="text-sm text-zinc-400">Brak nadchodzących rezerwacji.</p>
                : <div className="space-y-2">{upcoming.map(event => <BookingRow key={event.id} b={event} showDate onClick={() => selectEvent(event)} />)}</div>}
        </section>
    </section>;
}
