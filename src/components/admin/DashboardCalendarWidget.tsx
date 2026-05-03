'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar as CalendarIcon, ExternalLink, Clock, MapPin } from 'lucide-react';

type Event = {
    id: string;
    source: 'booking' | 'offer' | 'challenge' | 'contract';
    date: string;
    start_time: string | null;
    title: string;
    client_name: string;
    venue: string | null;
    status: string;
    detail_url: string;
    deposit_amount?: number | null;
    deposit_status?: 'paid' | 'overdue' | 'due_soon' | 'pending' | null;
};

const DEPOSIT_STYLE: Record<string, { cls: string; label: string; icon: string }> = {
    paid:     { cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40', label: 'Zaliczka opłacona', icon: '✓' },
    pending:  { cls: 'bg-zinc-700/30 text-zinc-300 border-zinc-600/40',           label: 'Zaliczka oczekuje', icon: '·'  },
    due_soon: { cls: 'bg-amber-500/15 text-amber-300 border-amber-500/40',        label: 'Zaliczka — termin blisko', icon: '!' },
    overdue:  { cls: 'bg-rose-600/20 text-rose-300 border-rose-500/50 animate-pulse', label: 'Zaliczka po terminie', icon: '⚠' },
};

const SOURCE_BADGE: Record<string, string> = {
    booking: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    offer: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    challenge: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    contract: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
};
const SOURCE_LABEL: Record<string, string> = {
    booking: 'Rezerwacja',
    offer: 'Oferta',
    challenge: 'Wyzwanie',
    contract: 'Umowa',
};

export default function DashboardCalendarWidget() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        if (!token) { setLoading(false); return; }
        const today = new Date();
        const horizon = new Date(today);
        horizon.setDate(horizon.getDate() + 60);
        const fmt = (d: Date) => d.toISOString().slice(0, 10);
        fetch(`/api/admin/calendar-events?from=${fmt(today)}&to=${fmt(horizon)}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.ok ? r.json() : { events: [] })
            .then(data => setEvents((data.events || []).slice(0, 8)))
            .catch(() => { /* ignore */ })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow">
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-rose-400" />
                    Najbliższe sesje (60 dni)
                </h3>
                <Link href="/admin/bookings/calendar"
                    className="text-xs text-gold-400 hover:text-gold-300 inline-flex items-center gap-1">
                    Pełny kalendarz <ExternalLink className="w-3 h-3" />
                </Link>
            </div>
            <div className="divide-y divide-zinc-800">
                {loading && <div className="p-5 text-sm text-zinc-500 text-center">Ładowanie...</div>}
                {!loading && events.length === 0 && (
                    <div className="p-5 text-sm text-zinc-500 text-center">
                        Brak nadchodzących sesji w ciągu 60 dni.
                    </div>
                )}
                {events.map(e => {
                    const d = new Date(e.date);
                    const day = d.getDate();
                    const month = d.toLocaleDateString('pl-PL', { month: 'short' });
                    return (
                        <Link key={e.id} href={e.detail_url}
                            className="flex items-stretch gap-3 px-4 py-3 hover:bg-zinc-800/50 transition">
                            <div className="flex flex-col items-center justify-center bg-zinc-800 rounded-lg px-3 min-w-[56px]">
                                <div className="text-xl font-bold text-white leading-none">{day}</div>
                                <div className="text-[10px] uppercase text-zinc-400 mt-1">{month}</div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${SOURCE_BADGE[e.source]}`}>
                                        {SOURCE_LABEL[e.source]}
                                    </span>
                                    {e.start_time && (
                                        <span className="text-xs text-zinc-400 inline-flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {e.start_time}
                                        </span>
                                    )}
                                    {e.deposit_status && (() => {
                                        const s = DEPOSIT_STYLE[e.deposit_status];
                                        return (
                                            <span
                                                title={`${s.label}${e.deposit_amount ? ` (${e.deposit_amount.toLocaleString('pl-PL')} PLN)` : ''}`}
                                                className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border inline-flex items-center gap-1 ${s.cls}`}
                                            >
                                                {s.icon} zaliczka{e.deposit_amount ? ` ${e.deposit_amount.toLocaleString('pl-PL')} zł` : ''}
                                            </span>
                                        );
                                    })()}
                                </div>
                                <div className="text-sm font-semibold text-white truncate">{e.client_name}</div>
                                <div className="text-xs text-zinc-400 truncate">{e.title}</div>
                                {e.venue && (
                                    <div className="text-xs text-zinc-500 truncate inline-flex items-center gap-1 mt-0.5">
                                        <MapPin className="w-3 h-3" /> {e.venue}
                                    </div>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
