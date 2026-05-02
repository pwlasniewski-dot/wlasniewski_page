'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Clock, User } from 'lucide-react';

export type CalendarBooking = {
    id: number;
    service: string;
    package: string;
    date: string;
    start_time: string | null;
    end_time: string | null;
    client_name: string;
    venue_city?: string | null;
    venue_place?: string | null;
    status: string;
    photographer_id?: number | null;
};

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-900 border-amber-300',
    confirmed: 'bg-blue-100 text-blue-900 border-blue-300',
    paid: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    completed: 'bg-zinc-200 text-zinc-700 border-zinc-300',
    cancelled: 'bg-rose-100 text-rose-700 border-rose-300 line-through',
};

const STATUS_LABELS: Record<string, string> = {
    pending: 'Oczekuje',
    confirmed: 'Potwierdzona',
    paid: 'Op\u0142acona',
    completed: 'Zako\u0144czona',
    cancelled: 'Anulowana',
};

const DAYS_PL = ['Pn', 'Wt', '\u015ar', 'Cz', 'Pt', 'So', 'Nd'];
const MONTHS_PL = [
    'Stycze\u0144', 'Luty', 'Marzec', 'Kwiecie\u0144', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpie\u0144', 'Wrzesie\u0144', 'Pa\u017adziernik', 'Listopad', 'Grudzie\u0144',
];

function ymd(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function BookingsCalendar({
    bookings,
    onSelectBooking,
    initialMonth,
}: {
    bookings: CalendarBooking[];
    onSelectBooking?: (b: CalendarBooking) => void;
    initialMonth?: Date;
}) {
    const [view, setView] = useState<'month' | 'list'>('month');
    const [cursor, setCursor] = useState<Date>(() => {
        const d = initialMonth ? new Date(initialMonth) : new Date();
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
    });
    const [selectedDay, setSelectedDay] = useState<string | null>(ymd(new Date()));

    const byDay = useMemo(() => {
        const map = new Map<string, CalendarBooking[]>();
        for (const b of bookings) {
            const key = b.date.slice(0, 10);
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(b);
        }
        for (const arr of map.values()) {
            arr.sort((a, b) => (a.start_time || '00:00').localeCompare(b.start_time || '00:00'));
        }
        return map;
    }, [bookings]);

    const monthGrid = useMemo(() => {
        const first = new Date(cursor);
        const startWeekday = (first.getDay() + 6) % 7; // pon=0
        const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
        const cells: { date: Date; inMonth: boolean }[] = [];
        for (let i = 0; i < startWeekday; i++) {
            const d = new Date(first);
            d.setDate(d.getDate() - (startWeekday - i));
            cells.push({ date: d, inMonth: false });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            cells.push({ date: new Date(cursor.getFullYear(), cursor.getMonth(), i), inMonth: true });
        }
        while (cells.length % 7 !== 0 || cells.length < 42) {
            const last = cells[cells.length - 1].date;
            const d = new Date(last);
            d.setDate(d.getDate() + 1);
            cells.push({ date: d, inMonth: d.getMonth() === cursor.getMonth() });
            if (cells.length >= 42) break;
        }
        return cells;
    }, [cursor]);

    const todayKey = ymd(new Date());
    const upcomingFromCursor = useMemo(() => {
        return [...bookings]
            .filter(b => new Date(b.date) >= new Date(cursor.getFullYear(), cursor.getMonth(), 1)
                && new Date(b.date) < new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
            .sort((a, b) => a.date.localeCompare(b.date) || (a.start_time || '').localeCompare(b.start_time || ''));
    }, [bookings, cursor]);

    const selectedDayBookings = selectedDay ? (byDay.get(selectedDay) || []) : [];

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-zinc-200 bg-gradient-to-r from-amber-50 to-rose-50">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
                        className="p-2 rounded-lg hover:bg-white/60 transition"
                        aria-label="Poprzedni miesi\u0105c"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg sm:text-xl font-bold text-zinc-900 min-w-[10rem] text-center">
                        {MONTHS_PL[cursor.getMonth()]} {cursor.getFullYear()}
                    </h2>
                    <button
                        onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
                        className="p-2 rounded-lg hover:bg-white/60 transition"
                        aria-label="Nast\u0119pny miesi\u0105c"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => {
                            const t = new Date();
                            t.setDate(1);
                            setCursor(t);
                            setSelectedDay(todayKey);
                        }}
                        className="ml-2 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-sm font-medium text-zinc-700 hover:border-amber-400"
                    >
                        Dzi\u015b
                    </button>
                </div>
                <div className="flex items-center gap-1 bg-white rounded-lg border border-zinc-200 p-1 self-start sm:self-auto">
                    <button
                        onClick={() => setView('month')}
                        className={`px-3 py-1.5 text-sm font-medium rounded ${view === 'month' ? 'bg-zinc-900 text-white' : 'text-zinc-600'}`}
                    >
                        Miesi\u0105c
                    </button>
                    <button
                        onClick={() => setView('list')}
                        className={`px-3 py-1.5 text-sm font-medium rounded ${view === 'list' ? 'bg-zinc-900 text-white' : 'text-zinc-600'}`}
                    >
                        Lista
                    </button>
                </div>
            </div>

            {view === 'month' ? (
                <>
                    {/* Days header */}
                    <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50">
                        {DAYS_PL.map(d => (
                            <div key={d} className="px-1 py-2 text-center text-[11px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wide">
                                {d}
                            </div>
                        ))}
                    </div>
                    {/* Cells */}
                    <div className="grid grid-cols-7">
                        {monthGrid.map(({ date, inMonth }, idx) => {
                            const key = ymd(date);
                            const dayBookings = byDay.get(key) || [];
                            const isToday = key === todayKey;
                            const isSelected = key === selectedDay;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedDay(key)}
                                    className={`relative min-h-[64px] sm:min-h-[88px] border-r border-b border-zinc-100 p-1 sm:p-1.5 text-left transition
                                        ${inMonth ? 'bg-white hover:bg-amber-50' : 'bg-zinc-50/50 text-zinc-400'}
                                        ${isSelected ? 'ring-2 ring-amber-400 ring-inset z-10' : ''}
                                    `}
                                >
                                    <div className={`text-xs sm:text-sm font-semibold mb-1 inline-flex items-center justify-center w-6 h-6 rounded-full
                                        ${isToday ? 'bg-rose-500 text-white' : inMonth ? 'text-zinc-800' : 'text-zinc-400'}
                                    `}>
                                        {date.getDate()}
                                    </div>
                                    <div className="space-y-0.5">
                                        {dayBookings.slice(0, 2).map(b => (
                                            <div
                                                key={b.id}
                                                className={`text-[10px] sm:text-[11px] px-1 py-0.5 rounded truncate border ${STATUS_COLORS[b.status] || STATUS_COLORS.pending}`}
                                                title={`${b.client_name} \u2014 ${b.service}`}
                                            >
                                                {b.start_time || ''} {b.client_name}
                                            </div>
                                        ))}
                                        {dayBookings.length > 2 && (
                                            <div className="text-[10px] text-zinc-500 font-semibold">
                                                +{dayBookings.length - 2}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Selected day detail */}
                    {selectedDay && (
                        <div className="border-t border-zinc-200 p-4 bg-zinc-50">
                            <h3 className="font-bold text-zinc-900 mb-3 flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4 text-rose-500" />
                                {new Date(selectedDay).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                <span className="ml-auto text-sm font-normal text-zinc-500">
                                    {selectedDayBookings.length} {selectedDayBookings.length === 1 ? 'rezerwacja' : 'rezerwacji'}
                                </span>
                            </h3>
                            {selectedDayBookings.length === 0 ? (
                                <p className="text-sm text-zinc-500">Brak rezerwacji w tym dniu.</p>
                            ) : (
                                <div className="space-y-2">
                                    {selectedDayBookings.map(b => (
                                        <BookingRow key={b.id} b={b} onClick={() => onSelectBooking?.(b)} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : (
                /* LIST view */
                <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
                    {upcomingFromCursor.length === 0 ? (
                        <p className="text-sm text-zinc-500 text-center py-8">Brak rezerwacji w tym miesi\u0105cu.</p>
                    ) : (
                        upcomingFromCursor.map(b => (
                            <BookingRow key={b.id} b={b} showDate onClick={() => onSelectBooking?.(b)} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

function BookingRow({ b, showDate, onClick }: { b: CalendarBooking; showDate?: boolean; onClick?: () => void }) {
    const colors = STATUS_COLORS[b.status] || STATUS_COLORS.pending;
    const label = STATUS_LABELS[b.status] || b.status;
    return (
        <button
            onClick={onClick}
            className="w-full text-left bg-white border border-zinc-200 rounded-xl p-3 hover:border-amber-400 hover:shadow-sm transition flex flex-col sm:flex-row sm:items-center gap-2"
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    {showDate && (
                        <span className="text-xs font-semibold text-zinc-500">
                            {new Date(b.date).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}
                        </span>
                    )}
                    {b.start_time && (
                        <span className="text-xs font-semibold text-zinc-700 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />{b.start_time}{b.end_time ? `\u2013${b.end_time}` : ''}
                        </span>
                    )}
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${colors}`}>{label}</span>
                </div>
                <div className="font-semibold text-zinc-900 truncate inline-flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-zinc-400" />{b.client_name}
                </div>
                <div className="text-xs text-zinc-600 truncate">
                    {b.service} \u00b7 {b.package}
                    {(b.venue_city || b.venue_place) && (
                        <span className="ml-2 inline-flex items-center gap-1 text-zinc-500">
                            <MapPin className="w-3 h-3" />{[b.venue_place, b.venue_city].filter(Boolean).join(', ')}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
}
