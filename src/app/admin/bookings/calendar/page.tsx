'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, Users, Download, Filter, X } from 'lucide-react';
import BookingsCalendar, { CalendarBooking } from '@/components/BookingsCalendar';

type Photographer = {
    id: number;
    name: string | null;
    email: string;
    photographer_profile?: {
        display_name: string | null;
        is_active: boolean;
    } | null;
    _count?: { assigned_bookings: number };
};

export default function AdminCalendarPage() {
    const router = useRouter();
    const [bookings, setBookings] = useState<CalendarBooking[]>([]);
    const [photographers, setPhotographers] = useState<Photographer[]>([]);
    const [photographerFilter, setPhotographerFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<CalendarBooking | null>(null);

    const fetchAll = useCallback(async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        if (!token) {
            router.replace('/admin/login');
            return;
        }
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.set('status', statusFilter);
            if (photographerFilter !== 'all') params.set('photographer_id', photographerFilter);

            const [bRes, pRes] = await Promise.all([
                fetch(`/api/admin/calendar-events?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/admin/photographers', { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            if (bRes.status === 401) {
                localStorage.removeItem('admin_token');
                router.replace('/admin/login');
                return;
            }
            const bData = await bRes.json();
            const pData = await pRes.json();
            // Mapuj events na CalendarBooking shape (kalendarz oczekuje service/package zamiast title)
            type RawEvent = {
                id: string; source: 'booking' | 'offer' | 'challenge' | 'contract'; source_id: number;
                date: string; start_time: string | null; end_time: string | null;
                title: string; client_name: string;
                venue: string | null; status: string;
                photographer_id: number | null; detail_url: string;
                deposit_amount?: number | null;
                deposit_status?: 'paid' | 'overdue' | 'due_soon' | 'pending' | null;
            };
            let events: CalendarBooking[] = (bData.events || []).map((e: RawEvent) => ({
                id: e.id,
                service: e.title.split(' — ')[0] || e.title,
                package: e.title.split(' — ')[1] || '',
                date: e.date,
                start_time: e.start_time,
                end_time: e.end_time,
                client_name: e.client_name,
                venue_city: e.venue,
                venue_place: null,
                status: e.status,
                photographer_id: e.photographer_id,
                source: e.source,
                detail_url: e.detail_url,
                deposit_amount: e.deposit_amount ?? null,
                deposit_status: e.deposit_status ?? null,
            }));
            // Filtry po stronie klienta (nasz endpoint nie ma jeszcze status/photographer)
            if (statusFilter !== 'all') events = events.filter(e => e.status === statusFilter);
            if (photographerFilter !== 'all') events = events.filter(e => String(e.photographer_id) === photographerFilter);
            setBookings(events);
            setPhotographers(pData.photographers || []);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, photographerFilter, router]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const downloadIcs = () => {
        const token = localStorage.getItem('admin_token');
        if (!token) return;
        const params = new URLSearchParams();
        if (photographerFilter !== 'all') params.set('photographer_id', photographerFilter);
        // Stworzymy ICS w nowej karcie - admin musi wpisac token jako Bearer; otwarcie w nowej karcie nie wysle Bearer.
        // Zamiast tego pobierz blob:
        fetch(`/api/bookings/ics?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'rezerwacje.ics';
                a.click();
                URL.revokeObjectURL(url);
            });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-rose-50">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 flex items-center gap-2">
                            <CalendarIcon className="w-7 h-7 text-rose-500" /> Kalendarz rezerwacji
                        </h1>
                        <p className="text-sm text-zinc-500 mt-1">
                            Wszystkie sesje w jednym miejscu. Eksport do Google Calendar / Apple Calendar.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/admin/bookings"
                            className="px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm font-semibold text-zinc-700 hover:border-amber-400"
                        >
                            Lista
                        </Link>
                        <Link
                            href="/admin/photographers"
                            className="px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm font-semibold text-zinc-700 hover:border-amber-400 inline-flex items-center gap-1"
                        >
                            <Users className="w-4 h-4" /> Fotografowie
                        </Link>
                        <button
                            onClick={downloadIcs}
                            className="px-3 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-amber-500 text-white text-sm font-semibold inline-flex items-center gap-1 shadow"
                        >
                            <Download className="w-4 h-4" /> Pobierz .ics
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-zinc-200 p-3 mb-4 flex flex-wrap gap-2 items-center">
                    <Filter className="w-4 h-4 text-zinc-400" />
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-sm"
                    >
                        <option value="all">Wszystkie statusy</option>
                        <option value="pending">Oczekujace</option>
                        <option value="confirmed">Potwierdzone</option>
                        <option value="paid">Oplacone</option>
                        <option value="completed">Zakonczone</option>
                        <option value="cancelled">Anulowane</option>
                    </select>
                    <select
                        value={photographerFilter}
                        onChange={e => setPhotographerFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-sm"
                    >
                        <option value="all">Wszyscy fotografowie</option>
                        {photographers.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.photographer_profile?.display_name || p.name || p.email}
                                {p._count?.assigned_bookings ? ` (${p._count.assigned_bookings})` : ''}
                            </option>
                        ))}
                    </select>
                    {loading && <span className="text-xs text-zinc-500">Wczytywanie\u2026</span>}
                    <span className="ml-auto text-xs text-zinc-500">
                        {bookings.length} {bookings.length === 1 ? 'rezerwacja' : 'rezerwacji'}
                    </span>
                </div>

                <BookingsCalendar bookings={bookings} onSelectBooking={setSelected} />

                {selected && (
                    <BookingDetailModal booking={selected} onClose={() => setSelected(null)} onChanged={fetchAll} />
                )}
            </div>
        </div>
    );
}

function BookingDetailModal({
    booking, onClose, onChanged,
}: { booking: CalendarBooking; onClose: () => void; onChanged: () => void }) {
    const [saving, setSaving] = useState(false);

    const updateStatus = async (status: string) => {
        const token = localStorage.getItem('admin_token');
        if (!token) return;
        if (booking.source && booking.source !== 'booking') {
            alert('Zmiana statusu działa tylko dla rezerwacji. Edytuj ofertę / wyzwanie w jego panelu.');
            return;
        }
        setSaving(true);
        try {
            await fetch(`/api/bookings?id=${booking.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status }),
            });
            onChanged();
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const sourceLabels: Record<string, { label: string; color: string }> = {
        booking: { label: 'Rezerwacja', color: 'bg-rose-100 text-rose-800' },
        offer: { label: 'Oferta handlowa', color: 'bg-amber-100 text-amber-800' },
        challenge: { label: 'Foto-wyzwanie', color: 'bg-violet-100 text-violet-800' },
        contract: { label: 'Umowa', color: 'bg-emerald-100 text-emerald-800' },
    };
    const srcInfo = sourceLabels[booking.source || 'booking'];
    const isBooking = !booking.source || booking.source === 'booking';

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-3" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${srcInfo.color}`}>{srcInfo.label}</span>
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900">{booking.client_name}</h3>
                        <p className="text-sm text-zinc-500">{booking.service}{booking.package ? ` · ${booking.package}` : ''}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="space-y-2 text-sm">
                    <p>
                        <span className="text-zinc-500">Data:</span>{' '}
                        <strong>{new Date(booking.date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                    </p>
                    {booking.start_time && (
                        <p><span className="text-zinc-500">Godzina:</span> <strong>{booking.start_time}{booking.end_time ? ` \u2013 ${booking.end_time}` : ''}</strong></p>
                    )}
                    {(booking.venue_city || booking.venue_place) && (
                        <p><span className="text-zinc-500">Miejsce:</span> <strong>{[booking.venue_place, booking.venue_city].filter(Boolean).join(', ')}</strong></p>
                    )}
                    <p><span className="text-zinc-500">Status:</span> <strong>{booking.status}</strong></p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                        href={booking.detail_url || `/admin/bookings?id=${booking.id}`}
                        className="px-3 py-2 rounded-lg bg-zinc-900 text-white text-sm font-semibold"
                    >
                        Pełne szczegóły
                    </Link>
                    {isBooking && booking.status !== 'confirmed' && (
                        <button disabled={saving} onClick={() => updateStatus('confirmed')}
                            className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">
                            Potwierdź
                        </button>
                    )}
                    {isBooking && booking.status !== 'paid' && (
                        <button disabled={saving} onClick={() => updateStatus('paid')}
                            className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">
                            Oznacz opłaconą
                        </button>
                    )}
                    {isBooking && booking.status !== 'cancelled' && (
                        <button disabled={saving} onClick={() => updateStatus('cancelled')}
                            className="px-3 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold disabled:opacity-50">
                            Anuluj
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
