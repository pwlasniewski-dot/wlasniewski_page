'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, Check, ChevronLeft, ChevronRight } from 'lucide-react';

interface ChallengeData {
    id: number;
    inviter_name: string;
    invitee_name: string;
    package_id: number;
    location_id?: number;
    package?: {
        package_name: string;
        challenge_price: number;
    };
    location?: {
        location_name: string;
    };
}

interface AvailabilitySlot {
    hour: number;
    available: boolean;
    reason?: string;
}

export default function AcceptChallengePage() {
    const params = useParams();
    const router = useRouter();
    const uniqueLink = params.unique_link as string;

    const [step, setStep] = useState(1);
    const [challenge, setChallenge] = useState<ChallengeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedHour, setSelectedHour] = useState<number | null>(null);
    const [availableHours, setAvailableHours] = useState<AvailabilitySlot[]>([]);
    const [loadingHours, setLoadingHours] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchChallenge();
    }, [uniqueLink]);

    const fetchChallenge = async () => {
        try {
            const res = await fetch(`/api/photo-challenge/${uniqueLink}`);
            const data = await res.json();

            if (data.success) {
                setChallenge(data.challenge);
                setName(data.challenge.invitee_name);
            } else {
                setError('Zaproszenie nie znalezione');
            }
        } catch (err) {
            setError('Błąd przy ładowaniu zaproszenia');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDateSelect = async (date: string) => {
        setSelectedDate(date);
        setSelectedHour(null);
        setLoadingHours(true);

        try {
            const res = await fetch(
                `/api/availability?packageId=${challenge?.package_id}&date=${date}`
            );
            const data = await res.json();

            if (data.success) {
                setAvailableHours(data.slots || []);
            }
        } catch (err) {
            console.error('Error fetching availability:', err);
        } finally {
            setLoadingHours(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedDate || selectedHour === null) return;

        setSubmitting(true);

        try {
            const res = await fetch(`/api/photo-challenge/${uniqueLink}/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    date: selectedDate,
                    hour: selectedHour
                })
            });

            const data = await res.json();

            if (data.success) {
                // Redirect to success page
                router.push(`/foto-wyzwanie/accept/${uniqueLink}/success`);
            } else {
                alert('Błąd przy rezerwacji');
            }
        } catch (err) {
            console.error('Error submitting:', err);
            alert('Błąd przy rezerwacji');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 flex items-center justify-center px-4">
                <div className="text-gold-400 text-xl">Ładowanie...</div>
            </div>
        );
    }

    if (error || !challenge) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 flex items-center justify-center px-4">
                <div className="max-w-md text-center">
                    <h1 className="text-3xl font-bold text-white mb-4">❌ Błąd</h1>
                    <p className="text-zinc-400 mb-8">{error}</p>
                    <Link
                        href="/foto-wyzwanie"
                        className="inline-block px-6 py-3 bg-gold-500 hover:bg-gold-600 text-black font-bold rounded-lg transition-colors"
                    >
                        Wróć do wyzwań
                    </Link>
                </div>
            </div>
        );
    }

    // Generate next 30 days
    const dates = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 text-white py-20 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-display font-bold mb-3">
                        Wybierz datę sesji
                    </h1>
                    <p className="text-xl text-zinc-400">
                        Pakiet: <span className="text-gold-400">{challenge.package?.package_name}</span>
                    </p>
                </div>

                {/* Progress */}
                <div className="flex justify-between mb-12">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`flex-1 h-1 mx-2 rounded ${
                                s <= step ? 'bg-gold-500' : 'bg-zinc-700'
                            }`}
                        />
                    ))}
                </div>

                {/* Step 1: Imię */}
                {step === 1 && (
                    <div className="bg-zinc-800/50 rounded-xl p-8 border border-zinc-700 mb-8">
                        <h2 className="text-2xl font-bold mb-6">Potwierdzenie danych</h2>

                        <div className="mb-8">
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Imię (możesz zmienić)
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Twoje imię"
                                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-gold-500"
                            />
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            disabled={!name.trim()}
                            className={`w-full py-3 rounded-lg font-bold transition-colors ${
                                name.trim()
                                    ? 'bg-gold-500 hover:bg-gold-600 text-black'
                                    : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                            }`}
                        >
                            Dalej
                        </button>
                    </div>
                )}

                {/* Step 2: Data */}
                {step === 2 && (
                    <div className="bg-zinc-800/50 rounded-xl p-8 border border-zinc-700 mb-8">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Calendar size={28} />
                            Wybierz datę
                        </h2>

                        <div className="grid grid-cols-4 gap-2 mb-8 max-h-96 overflow-y-auto">
                            {dates.map((date) => {
                                const dateStr = date.toISOString().split('T')[0];
                                const isSelected = selectedDate === dateStr;
                                const dayName = new Intl.DateTimeFormat('pl-PL', {
                                    weekday: 'short'
                                }).format(date);
                                const dayNum = date.getDate();

                                return (
                                    <button
                                        key={dateStr}
                                        onClick={() => handleDateSelect(dateStr)}
                                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                                            isSelected
                                                ? 'border-gold-500 bg-gold-500/10'
                                                : 'border-zinc-600 bg-zinc-900 hover:border-zinc-500'
                                        }`}
                                    >
                                        <div className="text-xs text-zinc-400 uppercase">{dayName}</div>
                                        <div className="text-lg font-bold">{dayNum}</div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-3 rounded-lg font-bold border border-zinc-600 hover:border-zinc-500 transition-colors"
                            >
                                Wstecz
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={!selectedDate}
                                className={`flex-1 py-3 rounded-lg font-bold transition-colors ${
                                    selectedDate
                                        ? 'bg-gold-500 hover:bg-gold-600 text-black'
                                        : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                                }`}
                            >
                                Dalej
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Godzina */}
                {step === 3 && (
                    <div className="bg-zinc-800/50 rounded-xl p-8 border border-zinc-700 mb-8">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Clock size={28} />
                            Wybierz godzinę - {selectedDate}
                        </h2>

                        {loadingHours ? (
                            <div className="text-center py-12">
                                <div className="text-zinc-400">Ładowanie dostępnych godzin...</div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-8">
                                    {availableHours.map((slot) => (
                                        <button
                                            key={slot.hour}
                                            onClick={() => setSelectedHour(slot.hour)}
                                            disabled={!slot.available}
                                            title={!slot.available ? `Zajęte: ${slot.reason}` : ''}
                                            className={`p-3 rounded-lg font-bold transition-all text-sm ${
                                                selectedHour === slot.hour && slot.available
                                                    ? 'border-2 border-gold-500 bg-gold-500/10 text-white'
                                                    : slot.available
                                                    ? 'border-2 border-zinc-600 bg-zinc-900 hover:border-zinc-500 text-white'
                                                    : 'border-2 border-red-500/50 bg-red-500/10 text-red-400 cursor-not-allowed'
                                            }`}
                                        >
                                            {String(slot.hour).padStart(2, '0')}:00
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setStep(2)}
                                        className="flex-1 py-3 rounded-lg font-bold border border-zinc-600 hover:border-zinc-500 transition-colors"
                                    >
                                        Wstecz
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={selectedHour === null || submitting}
                                        className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors ${
                                            selectedHour !== null && !submitting
                                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                                : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                                        }`}
                                    >
                                        <Check size={20} />
                                        {submitting ? 'Rezerwowanie...' : 'Potwierdź rezerwację'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="text-center mt-12 text-zinc-500">
                    <Link href="/foto-wyzwanie" className="hover:text-gold-400 transition-colors">
                        ← Wróć do wyzwań
                    </Link>
                </div>
            </div>
        </div>
    );
}
