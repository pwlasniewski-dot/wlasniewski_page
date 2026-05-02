'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Calendar as CalendarIcon, Link as LinkIcon, Copy, Check, Loader2, Apple, Smartphone } from 'lucide-react';
import BookingsCalendar, { CalendarBooking } from '@/components/BookingsCalendar';

export default function PhotographerPanelClient() {
    const router = useRouter();
    const { user, token, isLoading: authLoading } = useAuth();
    const [bookings, setBookings] = useState<CalendarBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [feed, setFeed] = useState<{ feed_url: string; webcal_url: string; google_subscribe_url: string } | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/strefa-klienta/login?redirect=/panel-fotografa');
            return;
        }
        if (user && user.role !== 'PHOTOGRAPHER' && user.role !== 'ADMIN') {
            router.replace('/konto');
        }
    }, [authLoading, user, router]);

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [bRes, fRes] = await Promise.all([
                fetch('/api/photographer/bookings', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/photographer/calendar-feed', { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            if (bRes.ok) {
                const bData = await bRes.json();
                setBookings(bData.bookings || []);
            }
            if (fRes.ok) {
                setFeed(await fRes.json());
            }
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { load(); }, [load]);

    const copy = (val: string, key: string) => {
        navigator.clipboard?.writeText(val);
        setCopied(key);
        setTimeout(() => setCopied(null), 1500);
    };

    if (authLoading || !user) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-rose-50">
            <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6">
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 flex items-center gap-2">
                        <CalendarIcon className="w-7 h-7 text-rose-500" /> Mój kalendarz
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        Witaj, {user.name || user.email}. Zobacz swoje sesje i podłącz kalendarz Google / Apple.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    <Stat label="Wszystkie" value={bookings.length} />
                    <Stat label="Oczekujące" value={bookings.filter(b => b.status === 'pending').length} color="amber" />
                    <Stat label="Potwierdzone" value={bookings.filter(b => b.status === 'confirmed').length} color="blue" />
                    <Stat label="Opłacone" value={bookings.filter(b => b.status === 'paid').length} color="emerald" />
                </div>

                {/* Calendar */}
                {loading ? (
                    <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-400" />
                    </div>
                ) : (
                    <BookingsCalendar bookings={bookings} />
                )}

                {/* Subscribe links */}
                {feed && (
                    <div className="mt-6 bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
                        <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2 mb-1">
                            <LinkIcon className="w-5 h-5 text-amber-600" /> Podłącz kalendarz w telefonie
                        </h2>
                        <p className="text-sm text-zinc-600 mb-4">
                            Kliknij i zasubskrybuj — twoje sesje będą się aktualizować automatycznie.
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                            <a
                                href={feed.google_subscribe_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow hover:bg-blue-700"
                            >
                                <CalendarIcon className="w-4 h-4" /> Dodaj do Google Calendar
                            </a>
                            <a
                                href={feed.webcal_url}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-semibold shadow hover:bg-zinc-800"
                            >
                                <Apple className="w-4 h-4" /> Apple / iPhone (webcal)
                            </a>
                            <a
                                href={feed.feed_url}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-zinc-200 text-sm font-semibold text-zinc-700 hover:border-amber-400"
                            >
                                <Smartphone className="w-4 h-4" /> Pobierz .ics
                            </a>
                        </div>
                        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 flex items-center gap-2">
                            <code className="flex-1 text-xs text-zinc-600 truncate">{feed.feed_url}</code>
                            <button
                                onClick={() => copy(feed.feed_url, 'url')}
                                className="px-2 py-1 rounded bg-white border border-zinc-200 text-xs font-semibold inline-flex items-center gap-1"
                            >
                                {copied === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied === 'url' ? 'Skopiowano' : 'Kopiuj'}
                            </button>
                        </div>
                        <p className="text-xs text-zinc-500 mt-3">
                            <strong>Bezpieczeństwo:</strong> link zawiera prywatny token — nie udostępniaj go nikomu. Każdy z linkiem widzi twój harmonogram.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function Stat({ label, value, color = 'zinc' }: { label: string; value: number; color?: string }) {
    const colorMap: Record<string, string> = {
        zinc: 'border-zinc-200 text-zinc-900',
        amber: 'border-amber-200 text-amber-800 bg-amber-50',
        blue: 'border-blue-200 text-blue-800 bg-blue-50',
        emerald: 'border-emerald-200 text-emerald-800 bg-emerald-50',
    };
    return (
        <div className={`bg-white border rounded-xl p-3 text-center ${colorMap[color]}`}>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-[10px] uppercase tracking-wide font-semibold">{label}</div>
        </div>
    );
}
