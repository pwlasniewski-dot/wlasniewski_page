'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, Check, ChevronLeft, ChevronRight, MapPin, Package, Heart, User, ArrowRight } from 'lucide-react';
import BookingCalendar from '@/components/BookingCalendar';
import { motion } from 'framer-motion';

interface ChallengeData {
    id: number;
    inviter_name: string;
    inviter_contact: string;
    inviter_contact_type: string;
    invitee_name: string;
    package_id: number;
    location_id?: number;
    booking?: {
        date: string;
        start_time: string;
        end_time: string;
        status: string;
    };
    package?: {
        name: string;
        challenge_price: number;
    };
    location?: {
        name: string;
    };
    custom_location?: string;
}

interface AvailabilitySlot {
    hour: number;
    available: boolean;
    reason?: string;
}

export default function AcceptChallengePage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const uniqueLink = params.unique_link as string;
    const acceptToken = searchParams?.get('t') || null;

    const [step, setStep] = useState(1);
    const [challenge, setChallenge] = useState<ChallengeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [selectedSlot, setSelectedSlot] = useState<{ date: string; start?: string; end?: string } | null>(null);
    const [useProposed, setUseProposed] = useState(true);
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


    const handleSubmit = async () => {
        const slot = useProposed && challenge?.booking
            ? {
                date: new Date(challenge.booking.date).toISOString().split('T')[0],
                start: challenge.booking.start_time
            }
            : selectedSlot;

        if (!slot || !slot.date) {
            alert('Wybierz termin sesji');
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch(`/api/photo-challenge/${uniqueLink}/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    date: slot.date,
                    hour: slot.start ? parseInt(slot.start.split(':')[0]) : 12, // Default to 12:00 if no hour specified
                    t: acceptToken,
                })
            });

            const data = await res.json();

            if (data.success) {
                // Redirect to success page
                router.push(`/foto-wyzwanie/accept/${uniqueLink}/success`);
            } else if (data.error === 'NEED_INVITEE_TOKEN' || data.error === 'INVALID_INVITEE_TOKEN') {
                alert(data.message || 'Tylko zaproszony może zaakceptować. Wróć do zaproszenia i poproś o osobisty link na maila.');
                router.push(`/foto-wyzwanie/invite/${uniqueLink}`);
            } else {
                alert(data.error || 'Błąd przy rezerwacji');
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


    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 text-white py-20 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-display font-bold mb-3">
                        Wybierz datę sesji
                    </h1>
                    <p className="text-xl text-zinc-400">
                        Pakiet: <span className="text-gold-400">{challenge.package?.name}</span>
                    </p>
                </div>

                {/* Progress */}
                <div className="flex justify-between mb-12">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`flex-1 h-1 mx-2 rounded ${s <= step ? 'bg-gold-500' : 'bg-zinc-700'
                                }`}
                        />
                    ))}
                </div>

                {/* Step 1: Imię */}
                {step === 1 && (
                    <div className="bg-zinc-800/50 rounded-xl p-8 border border-zinc-700 mb-8">
                        <h2 className="text-2xl font-bold mb-6">Potwierdzenie danych</h2>

                        {/* Trust / Verification Section */}
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6 mb-8 text-center">
                            <h3 className="text-lg font-bold text-amber-500 mb-2">
                                🛡️ Weryfikacja bezpieczeństwa
                            </h3>
                            <p className="text-zinc-300 mb-4">
                                Zaproszenie otrzymałeś/aś od:
                            </p>
                            <div className="text-2xl font-bold text-white mb-1">
                                {challenge?.inviter_name}
                            </div>
                            <div className="text-xl text-gold-400 mb-6 font-mono">
                                {challenge?.inviter_contact}
                            </div>
                            <p className="text-sm text-zinc-400">
                                ⚠️ Dla bezpieczeństwa, zanim zaakceptujesz wyzwanie, skontaktuj się z osobą zapraszającą telefonicznie, aby potwierdzić to zaproszenie.
                            </p>
                        </div>

                        <div className="mb-8">
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Twoje imię (możesz edytować)
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
                            className={`w-full py-3 rounded-lg font-bold transition-colors ${name.trim()
                                ? 'bg-gold-500 hover:bg-gold-600 text-black'
                                : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                                }`}
                        >
                            Potwierdzam tożsamość i przechodzę dalej
                        </button>
                    </div>
                )}

                {/* Step 2: Termin */}
                {step === 2 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-zinc-800/50 rounded-xl p-8 border border-zinc-700 mb-8"
                    >
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gold-400">
                            <Calendar size={28} />
                            Termin sesji
                        </h2>

                        {challenge.booking ? (
                            <div className="space-y-6">
                                <div
                                    onClick={() => setUseProposed(true)}
                                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${useProposed
                                        ? 'border-gold-500 bg-gold-500/10'
                                        : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-bold flex items-center gap-2">
                                            <Check className={useProposed ? 'text-gold-500' : 'text-zinc-500'} />
                                            Zaproponowany termin
                                        </h3>
                                        <div className="px-2 py-1 rounded bg-gold-500/20 text-gold-400 text-[10px] font-bold uppercase tracking-widest">
                                            Rekomendowany
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-white">
                                        {new Date(challenge.booking.date).toLocaleDateString('pl-PL', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </p>
                                    <p className="text-zinc-400 flex items-center gap-1 mt-1">
                                        <Clock size={16} /> Godzina: {challenge.booking.start_time}
                                    </p>
                                </div>

                                <div
                                    onClick={() => setUseProposed(false)}
                                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${!useProposed
                                        ? 'border-gold-500 bg-gold-500/10'
                                        : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600'
                                        }`}
                                >
                                    <h3 className="font-bold mb-4 flex items-center gap-2">
                                        <Calendar className={!useProposed ? 'text-gold-500' : 'text-zinc-500'} />
                                        Inny termin?
                                    </h3>

                                    {!useProposed && (
                                        <div className="mt-4 bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                                            <BookingCalendar
                                                service="Sesja"
                                                onSlotSelect={setSelectedSlot}
                                                selectedSlot={selectedSlot}
                                            />
                                        </div>
                                    )}
                                    {useProposed && (
                                        <p className="text-sm text-zinc-500">Kliknij tutaj, aby wybrać inną datę i godzinę z kalendarza.</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-700">
                                <p className="text-zinc-400 mb-6">Wybierz dogodny dla Ciebie termin sesji:</p>
                                <BookingCalendar
                                    service="Sesja"
                                    onSlotSelect={setSelectedSlot}
                                    selectedSlot={selectedSlot}
                                />
                            </div>
                        )}

                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-4 rounded-lg font-bold border border-zinc-600 hover:border-zinc-500 transition-colors"
                            >
                                Wstecz
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={(useProposed && !challenge.booking) || (!useProposed && !selectedSlot)}
                                className={`flex-[2] py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${((useProposed && challenge.booking) || (!useProposed && selectedSlot))
                                    ? 'bg-gold-500 hover:bg-gold-600 text-black shadow-lg shadow-gold-500/20'
                                    : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                                    }`}
                            >
                                Podsumowanie <ArrowRight size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Summary */}
                {step === 3 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-zinc-800/50 rounded-xl p-8 border border-zinc-700 mb-8"
                    >
                        <h2 className="text-2xl font-bold mb-6 text-gold-400 flex items-center gap-2">
                            <Check size={28} />
                            Potwierdzenie rezerwacji
                        </h2>

                        <div className="space-y-6 mb-8 bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
                                <span className="text-zinc-500 font-medium">Pakiet</span>
                                <span className="font-bold flex items-center gap-2 uppercase tracking-wider text-xs bg-gold-500/10 text-gold-400 px-3 py-1 rounded-full border border-gold-500/20">
                                    <Package size={14} /> {challenge.package?.name}
                                </span>
                            </div>

                            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
                                <span className="text-zinc-500 font-medium">Lokalizacja</span>
                                <span className="font-bold text-sm flex items-center gap-2">
                                    <MapPin size={14} className="text-gold-400" /> {challenge.location?.name || challenge.custom_location || 'Miejsce wybrane przez fotografa'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-zinc-500 font-medium">Termin sesji</span>
                                <div className="text-right">
                                    <p className="font-bold text-white flex items-center gap-2 justify-end">
                                        <Calendar size={14} className="text-gold-400" />
                                        {useProposed && challenge.booking
                                            ? new Date(challenge.booking.date).toLocaleDateString('pl-PL')
                                            : selectedSlot?.date
                                        }
                                    </p>
                                    <p className="text-xs text-gold-400 font-bold flex items-center gap-1 justify-end mt-1">
                                        <Clock size={12} />
                                        {(useProposed && challenge.booking)
                                            ? (challenge.booking.start_time || 'Do ustalenia')
                                            : (selectedSlot?.start || 'Wybierz godzinę')
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-8">
                            <h4 className="font-bold text-green-500 mb-2 flex items-center gap-2 text-sm uppercase tracking-widest">
                                <Heart size={16} /> To wyzwanie jest już opłacone!
                            </h4>
                            <p className="text-zinc-300 text-sm leading-relaxed">
                                Klikając "Akceptuję wyzwanie", potwierdzasz swoją obecność. Otrzymasz wiadomość e-mail z potwierdzeniem rezerwacji oraz szczegółami sesji.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep(2)}
                                className="flex-1 py-4 rounded-lg font-bold border border-zinc-600 hover:border-zinc-500 transition-colors"
                            >
                                Wstecz
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className={`flex-[2] py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all ${submitting
                                    ? 'bg-zinc-700 text-zinc-500 cursor-wait'
                                    : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20 active:scale-95'
                                    }`}
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Przetwarzanie...
                                    </>
                                ) : (
                                    <>
                                        Akceptuję wyzwanie <Heart size={20} />
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
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
