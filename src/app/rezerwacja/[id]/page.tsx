'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface BookingItem {
    id: number;
    service?: string;
    service_type?: string;
    package?: string;
    date: string;
    start_time?: string | null;
    end_time?: string | null;
    venue_city?: string | null;
    venue_place?: string | null;
    notes?: string | null;
    status?: string;
    price?: number;
}

export default function BookingDetailsPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const { token, isLoading: authLoading } = useAuth();

    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState<BookingItem | null>(null);
    const [error, setError] = useState<string | null>(null);

    const bookingId = useMemo(() => {
        const raw = params?.id;
        if (!raw) return NaN;
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : NaN;
    }, [params]);

    useEffect(() => {
        if (!authLoading && !token) {
            router.push('/logowanie');
            return;
        }

        if (!token) return;
        if (Number.isNaN(bookingId)) {
            setError('Nieprawidłowy identyfikator rezerwacji.');
            setLoading(false);
            return;
        }

        const loadBooking = async () => {
            try {
                const res = await fetch('/api/user/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) {
                    setError('Nie udało się pobrać danych rezerwacji.');
                    return;
                }

                const data = await res.json();
                const bookings: BookingItem[] = data?.user?.bookings || [];
                const found = bookings.find((b) => Number(b.id) === bookingId) || null;

                if (!found) {
                    setError('Nie znaleziono tej rezerwacji na Twoim koncie.');
                    return;
                }

                setBooking(found);
            } catch {
                setError('Wystąpił błąd połączenia. Spróbuj ponownie.');
            } finally {
                setLoading(false);
            }
        };

        loadBooking();
    }, [authLoading, token, router, bookingId]);

    if (authLoading || loading) {
        return (
            <main className="min-h-screen bg-zinc-950 text-white pt-36 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </main>
        );
    }

    if (error || !booking) {
        return (
            <main className="min-h-screen bg-zinc-950 text-white pt-36 px-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    <Link href="/konto" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Wróć do konta
                    </Link>

                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8">
                        <div className="flex items-start gap-3 text-red-300">
                            <AlertCircle className="w-5 h-5 mt-0.5" />
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-2">Brak szczegółów rezerwacji</h1>
                                <p className="text-zinc-400">{error || 'Nie udało się pobrać szczegółów.'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    const when = new Date(booking.date);
    const location = [booking.venue_place, booking.venue_city].filter(Boolean).join(', ');

    return (
        <main className="min-h-screen bg-zinc-950 text-white pt-36 pb-20 px-6">
            <div className="max-w-3xl mx-auto space-y-6">
                <Link href="/konto" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Wróć do konta
                </Link>

                <section className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 space-y-6">
                    <header>
                        <p className="text-xs uppercase tracking-[0.2em] text-amber-500 font-bold mb-2">Rezerwacja #{booking.id}</p>
                        <h1 className="text-3xl font-bold mb-1">{booking.service || booking.service_type || 'Sesja zdjęciowa'}</h1>
                        {booking.package && <p className="text-zinc-400">Pakiet: {booking.package}</p>}
                    </header>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4">
                            <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Termin</p>
                            <p className="flex items-center gap-2 text-white font-semibold">
                                <Calendar className="w-4 h-4 text-amber-500" />
                                {when.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>

                        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4">
                            <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Godzina</p>
                            <p className="flex items-center gap-2 text-white font-semibold">
                                <Clock className="w-4 h-4 text-amber-500" />
                                {booking.start_time ? `${booking.start_time}${booking.end_time ? ` - ${booking.end_time}` : ''}` : 'Do ustalenia'}
                            </p>
                        </div>

                        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 sm:col-span-2">
                            <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Lokalizacja</p>
                            <p className="flex items-center gap-2 text-white font-semibold">
                                <MapPin className="w-4 h-4 text-amber-500" />
                                {location || 'Lokalizacja do ustalenia'}
                            </p>
                        </div>
                    </div>

                    {booking.notes && (
                        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4">
                            <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Notatka</p>
                            <p className="text-zinc-300 whitespace-pre-wrap">{booking.notes}</p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link href="/konto" className="px-5 py-3 rounded-xl border border-zinc-700 hover:border-zinc-500 transition-colors text-center">
                            Wróć do rezerwacji
                        </Link>
                        <Link href="/rezerwacja" className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 transition-colors font-bold text-center">
                            Zarezerwuj kolejny termin
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}
