'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, Check, MapPin, Heart } from 'lucide-react';
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

export default function AcceptChallengePage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const uniqueLink = params.unique_link as string;
    const acceptToken = searchParams?.get('t') || null;

    const [challenge, setChallenge] = useState<ChallengeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedSlot, setSelectedSlot] = useState<{ date: string; start?: string; end?: string } | null>(null);
    const [useProposed, setUseProposed] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/photo-challenge/${uniqueLink}`);
                const data = await res.json();
                if (data.success) {
                    // Jeśli zaproszenie już zaakceptowane / odrzucone — nie pokazuj formularza, tylko ekran statusu.
                    if (data.challenge?.status === 'accepted') {
                        router.replace(`/foto-wyzwanie/accept/${uniqueLink}/success`);
                        return;
                    }
                    if (data.challenge?.status === 'rejected' || data.challenge?.status === 'declined') {
                        router.replace(`/foto-wyzwanie/invite/${uniqueLink}`);
                        return;
                    }
                    setChallenge(data.challenge);
                    if (!data.challenge?.booking) setUseProposed(false);
                } else {
                    setError('Zaproszenie nie znalezione');
                }
            } catch (err) {
                setError('Błąd przy ładowaniu zaproszenia');
                console.error(err);
            } finally {
                setLoading(false);
            }
        })();
    }, [uniqueLink]);

    const handleSubmit = async () => {
        if (!challenge) return;
        const slot = useProposed && challenge.booking
            ? {
                date: new Date(challenge.booking.date).toISOString().split('T')[0],
                start: challenge.booking.start_time,
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
                    name: challenge.invitee_name,
                    date: slot.date,
                    hour: slot.start ? parseInt(slot.start.split(':')[0]) : 12,
                    t: acceptToken,
                }),
            });
            const data = await res.json();
            if (data.success) {
                router.push(`/foto-wyzwanie/accept/${uniqueLink}/success`);
            } else if (data.error === 'ALREADY_ACCEPTED') {
                // Klient kliknął ponownie w stary link — po prostu pokaż ekran sukcesu.
                router.push(`/foto-wyzwanie/accept/${uniqueLink}/success`);
            } else if (data.error === 'ALREADY_DECLINED') {
                alert(data.message || 'To zaproszenie zostało już wcześniej odrzucone.');
                router.push(`/foto-wyzwanie/invite/${uniqueLink}`);
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

    const canSubmit = (useProposed && challenge.booking) || (!useProposed && selectedSlot);

    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 text-white py-16 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                        Wybierz termin sesji
                    </h1>
                    <p className="text-zinc-400">
                        {challenge.invitee_name} · <span className="text-gold-400">{challenge.package?.name}</span>
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-800/50 rounded-xl p-6 sm:p-8 border border-zinc-700 mb-6"
                >
                    {challenge.booking ? (
                        <div className="space-y-4">
                            <div
                                onClick={() => setUseProposed(true)}
                                className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${useProposed ? 'border-gold-500 bg-gold-500/10' : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600'}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-bold flex items-center gap-2 text-sm">
                                        <Check className={useProposed ? 'text-gold-500' : 'text-zinc-500'} size={18} />
                                        Zaproponowany termin
                                    </h3>
                                    <div className="px-2 py-0.5 rounded bg-gold-500/20 text-gold-400 text-[10px] font-bold uppercase">Rekomendowany</div>
                                </div>
                                <p className="text-xl font-bold text-white">
                                    {new Date(challenge.booking.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                                <p className="text-zinc-400 text-sm flex items-center gap-1 mt-0.5">
                                    <Clock size={14} /> {challenge.booking.start_time}
                                </p>
                            </div>

                            <div
                                onClick={() => setUseProposed(false)}
                                className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${!useProposed ? 'border-gold-500 bg-gold-500/10' : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600'}`}
                            >
                                <h3 className="font-bold mb-2 flex items-center gap-2 text-sm">
                                    <Calendar className={!useProposed ? 'text-gold-500' : 'text-zinc-500'} size={18} />
                                    Inny termin
                                </h3>
                                {!useProposed && (
                                    <div className="mt-3 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                                        <BookingCalendar
                                            service="Sesja"
                                            onSlotSelect={setSelectedSlot}
                                            selectedSlot={selectedSlot}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-700">
                            <BookingCalendar
                                service="Sesja"
                                onSlotSelect={setSelectedSlot}
                                selectedSlot={selectedSlot}
                            />
                        </div>
                    )}

                    <div className="mt-6 flex items-center gap-2 text-xs text-zinc-400">
                        <MapPin size={14} className="text-gold-400" />
                        <span>{challenge.location?.name || challenge.custom_location || 'Lokalizacja do ustalenia'}</span>
                    </div>

                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 mt-4 text-xs text-zinc-300 flex items-center gap-2">
                        <Heart size={14} className="text-green-400 shrink-0" />
                        <span>Sesja jest <strong className="text-green-400">już opłacona</strong>. Klikając „Rezerwuję" potwierdzasz tylko swój udział.</span>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !canSubmit}
                        className={`w-full mt-6 py-4 rounded-lg font-bold text-base flex items-center justify-center gap-2 transition-all ${submitting
                            ? 'bg-zinc-700 text-zinc-500 cursor-wait'
                            : canSubmit
                                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20 active:scale-95'
                                : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                            }`}
                    >
                        {submitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Rezerwuję…
                            </>
                        ) : (
                            <>
                                <Check size={20} />
                                Rezerwuję i akceptuję wyzwanie
                            </>
                        )}
                    </button>
                </motion.div>

                <div className="text-center text-zinc-500">
                    <Link href={`/foto-wyzwanie/invite/${uniqueLink}?t=${encodeURIComponent(acceptToken || '')}`} className="text-xs hover:text-gold-400 transition-colors">
                        ← Wróć do zaproszenia
                    </Link>
                </div>
            </div>
        </div>
    );
}
