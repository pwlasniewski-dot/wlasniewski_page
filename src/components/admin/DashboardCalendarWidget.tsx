
'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BookingsCalendar, { CalendarBooking } from '@/components/BookingsCalendar';
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
    const reload = useCallback(() => setRevision(v => v + 1), []);
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true); setError('');
        const token = localStorage.getItem('admin_token');
        // Include adjacent days visible in the six-week month grid.
        const from = new Date(Date.UTC(month.getFullYear(), month.getMonth(), -6)).toISOString().slice(0, 10);
        const to = new Date(Date.UTC(month.getFullYear(), month.getMonth() + 1, 7)).toISOString().slice(0, 10);
        fetch(`/api/admin/calendar-events?from=${from}&to=${to}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: controller.signal,
        }).then(async response => {
            if (!response.ok) throw new Error('Nie udało się wczytać kalendarza. Sprawdź logowanie i ponów.');
            return response.json();
        }).then(data => setEvents((data.events || []).map((e: Event) => ({ ...e, service: e.title, package: '', venue_place: e.venue }))))
            .catch(e => { if (!controller.signal.aborted) { setEvents([]); setError(e.message || 'Błąd połączenia.'); } })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [month, revision]);
    return <section aria-label="Kalendarz na pulpicie">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-medium text-white">Kalendarz sesji</h2>
            <div className="flex flex-wrap items-center gap-3"><AddCalendarBooking onCreated={reload} /><Link href="/admin/bookings/calendar" className="text-sm text-gold-400">Pełny kalendarz i filtry →</Link></div>
        </div>
        {loading && <p role="status" className="mb-2 text-sm text-zinc-400">Wczytywanie terminów…</p>}
        {error && <p role="alert" className="mb-2 text-sm text-red-300">{error} <button onClick={reload} className="underline">Ponów</button></p>}
        <BookingsCalendar bookings={events} onMonthChange={changeMonth} onSelectBooking={event => { if (event.detail_url) router.push(event.detail_url); }} />
    </section>;
}
