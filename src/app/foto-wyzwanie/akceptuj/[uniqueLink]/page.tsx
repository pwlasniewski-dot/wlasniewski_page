'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, X, Calendar, Gift, Lock, User, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import Image from 'next/image';

interface Challenge {
    id: number;
    unique_link: string;
    inviter_name: string;
    invitee_name: string;
    status: string;
    preferred_dates: string[]; // JSON array of dates strings
    package: {
        name: string;
        challenge_price: number;
        base_price: number;
        included_items: string[];
    };
    location?: {
        name: string;
        description: string;
    };
    custom_location?: string;
}

export default function AcceptChallengePage() {
    const params = useParams();
    const router = useRouter();
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);

    // State
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // Auth State
    const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Legal Consent
    const [consent, setConsent] = useState(false);

    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const fetchChallenge = async () => {
            try {
                const res = await fetch(`/api/photo-challenge/${params.uniqueLink}`);
                const data = await res.json();
                if (data.success) {
                    setChallenge(data.challenge);
                    // Pre-fill email if possible or expected? No, simpler to ask.

                    // Countdown Logic
                    // ... (simplified for now)
                } else {
                    toast.error('Nie znaleziono wyzwania');
                }
            } catch (error) {
                toast.error('Błąd pobierania');
            } finally {
                setLoading(false);
            }
        };
        fetchChallenge();
    }, [params.uniqueLink]);

    const handleAccept = async () => {
        if (!selectedDate) {
            toast.error('Wybierz pasujący Ci termin.');
            return;
        }
        if (!consent) {
            toast.error('Musisz zaakceptować regulamin.');
            return;
        }
        if (!email || !password || (authMode === 'register' && !name)) {
            toast.error('Uzupełnij dane konta.');
            return;
        }

        setAccepting(true);
        try {
            const res = await fetch(`/api/photo-challenge/${params.uniqueLink}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'accept',
                    selected_date: selectedDate,
                    // Auth Data to create/link user
                    auth_mode: authMode,
                    name: authMode === 'register' ? name : undefined,
                    email,
                    password
                }),
            });

            const data = await res.json();
            if (data.success) {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#FFD700', '#FFA500', '#ffffff']
                });
                toast.success('Wyzwanie zaakceptowane!');
                // Save token if returned
                if (data.token) {
                    localStorage.setItem('token', data.token);
                }
                setTimeout(() => router.push('/konto'), 2000);
            } else {
                toast.error(data.error || 'Wystąpił błąd');
            }
        } catch (error) {
            toast.error('Błąd połączenia');
        } finally {
            setAccepting(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Ładowanie...</div>;
    if (!challenge) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Błąd wyzwania</div>;

    const discount = challenge.package.base_price - challenge.package.challenge_price;

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-gold-400 selection:text-black">

            {/* HERO HERO HERO */}
            <div className="relative min-h-[60vh] flex flex-col items-center justify-center text-center p-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black z-0 pointer-events-none" />

                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    className="z-10"
                >
                    <div className="inline-block bg-gold-400/20 text-gold-400 px-4 py-2 rounded-full font-bold text-sm tracking-widest mb-6 border border-gold-400/30 uppercase">
                        Specjalne Zaproszenie
                    </div>

                    <h1 className="text-4xl md:text-7xl font-bold mb-6 leading-tight">
                        <span className="block text-zinc-400 text-2xl md:text-4xl mb-2 font-normal">Hej {challenge.invitee_name}!</span>
                        <span className="bg-gradient-to-r from-gold-300 via-yellow-100 to-gold-300 bg-clip-text text-transparent">
                            {challenge.inviter_name}
                        </span>
                        <br />
                        rzucił Ci wyzwanie!
                    </h1>

                    <div className="max-w-2xl mx-auto bg-zinc-900/80 backdrop-blur-md border border-zinc-800 p-8 rounded-3xl shadow-2xl mt-8">
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <Gift className="w-12 h-12 text-gold-400" />
                            <div className="text-left">
                                <h3 className="text-xl font-bold text-white">Wspólna sesja zdjęciowa</h3>
                                <p className="text-zinc-400">Opłacony prezent od {challenge.inviter_name}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-left">
                            <div className="bg-black/50 p-4 rounded-xl border border-zinc-800">
                                <span className="block text-xs text-zinc-500 uppercase tracking-wider mb-1">Pakiet</span>
                                <span className="font-bold text-white text-lg">{challenge.package.name}</span>
                            </div>
                            <div className="bg-black/50 p-4 rounded-xl border border-zinc-800">
                                <span className="block text-xs text-zinc-500 uppercase tracking-wider mb-1">Lokalizacja</span>
                                <span className="font-bold text-white text-lg">
                                    {challenge.custom_location || challenge.location?.name || 'Do ustalenia'}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="max-w-4xl mx-auto px-4 pb-20 -mt-10 relative z-20">

                {/* 1. DATA */}
                <div className="mb-8">
                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                        <span className="bg-zinc-800 w-8 h-8 rounded-full flex items-center justify-center text-gold-400 text-sm">1</span>
                        Wybierz termin
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        {challenge.preferred_dates && challenge.preferred_dates.map((date, idx) => {
                            const d = new Date(date);
                            const active = selectedDate === date;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedDate(date)}
                                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${active ? 'border-gold-400 bg-gold-400/10 text-white' : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
                                        }`}
                                >
                                    <Calendar className={`w-6 h-6 ${active ? 'text-gold-400' : 'text-zinc-600'}`} />
                                    <span className="font-bold">{d.toLocaleDateString('pl-PL')}</span>
                                    <span className="text-sm">{d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. KONTO */}
                <div className="mb-8">
                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                        <span className="bg-zinc-800 w-8 h-8 rounded-full flex items-center justify-center text-gold-400 text-sm">2</span>
                        {authMode === 'register' ? 'Utwórz konto' : 'Zaloguj się'}
                        <span className="text-sm font-normal text-zinc-500 ml-auto cursor-pointer underline" onClick={() => setAuthMode(m => m === 'register' ? 'login' : 'register')}>
                            {authMode === 'register' ? 'Mam już konto' : 'Nie mam konta'}
                        </span>
                    </h3>
                    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                        <p className="text-zinc-400 mb-4 text-sm">
                            Konto jest potrzebne, abyś mógł/mogła odebrać zdjęcia po sesji.
                        </p>
                        <div className="space-y-4">
                            {authMode === 'register' && (
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold mb-1 block">Twoje Imię</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-gold-400 outline-none"
                                        placeholder="Anna Nowak"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-bold mb-1 block">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-gold-400 outline-none"
                                    placeholder="anna@example.com"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-bold mb-1 block">Hasło</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-gold-400 outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {authMode === 'register' && (
                            <div className="mt-4 flex items-start gap-3">
                                <div className="pt-1">
                                    <div
                                        onClick={() => setConsent(!consent)}
                                        className={`w-6 h-6 rounded border-2 cursor-pointer flex items-center justify-center transition-colors ${consent ? 'bg-gold-400 border-gold-400' : 'border-zinc-600 bg-transparent'}`}
                                    >
                                        {consent && <Check className="w-4 h-4 text-black" />}
                                    </div>
                                </div>
                                <p className="text-sm text-zinc-400 leading-tight cursor-pointer" onClick={() => setConsent(!consent)}>
                                    Akceptuję <a href="/regulamin" className="text-gold-400 underline" target="_blank">Regulamin</a> oraz <a href="/polityka-prywatnosci" className="text-gold-400 underline" target="_blank">Politykę Prywatności</a> serwisu.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ACTION */}
                <div className="flex gap-4">
                    <button
                        onClick={handleAccept}
                        disabled={accepting || !selectedDate || (authMode === 'register' && !consent)}
                        className="flex-1 bg-gradient-to-r from-gold-400 to-yellow-500 hover:scale-[1.02] text-black font-bold text-xl py-5 rounded-2xl shadow-xl shadow-gold-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {accepting ? 'Przetwarzanie...' : (
                            <>
                                <Check className="w-6 h-6" /> Akceptuję Wyzwanie
                            </>
                        )}
                    </button>
                    {/* Reject button could be small/secondary */}
                </div>
            </div>
        </div>
    );
}
