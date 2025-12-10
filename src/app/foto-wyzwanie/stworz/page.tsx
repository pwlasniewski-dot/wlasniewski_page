'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, MessageCircle, Copy, Check, Calendar, CreditCard, User } from 'lucide-react';
import toast from 'react-hot-toast';

interface Package {
    id: number;
    name: string;
    description?: string;
    base_price: number;
    challenge_price: number;
    included_items?: string; // JSON string
}

interface Location {
    id: number;
    name: string;
    description: string | null;
    address: string;
}

export default function CreateChallengePage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Data
    const [packages, setPackages] = useState<Package[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);

    // Step 1: Package + Location
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [customLocation, setCustomLocation] = useState('');

    // Step 2: Auth (Inviter)
    const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
    const [inviterName, setInviterName] = useState('');
    const [inviterEmail, setInviterEmail] = useState('');
    const [inviterPassword, setInviterPassword] = useState('');
    const [inviterPhone, setInviterPhone] = useState('');

    // Step 3: Challenge Details (Invitee + Dates)
    const [inviteeName, setInviteeName] = useState('');
    const [inviteeEmail, setInviteeEmail] = useState('');
    const [date1, setDate1] = useState('');
    const [date2, setDate2] = useState('');
    const [date3, setDate3] = useState('');

    // Step 4: Payment
    const [paymentMethod, setPaymentMethod] = useState<'p24' | 'blik' | 'card'>('p24');

    // Load data
    useEffect(() => {
        Promise.all([
            fetch('/api/photo-challenge/packages').then(r => r.json()),
            fetch('/api/photo-challenge/locations').then(r => r.json()),
        ]).then(([pkgRes, locRes]) => {
            if (pkgRes.success) setPackages(pkgRes.packages);
            if (locRes.success) setLocations(locRes.locations);
        });

        // Check if user is already logged in (mock)
        const token = localStorage.getItem('token');
        if (token) {
            // In a real app we'd fetch user data here
            // For now just auto-skip auth step if we were sure
            // But let's let them verify/login explicitly for the flow
        }
    }, []);

    const handleCreate = async () => {
        if (!selectedPackage || !inviterName || !inviterEmail || !inviteeName || !inviteeEmail || !date1) {
            toast.error('Wypełnij wszystkie wymagane pola');
            return;
        }

        setLoading(true);
        try {
            // 1. Create Challenge in DB first (so we have an ID/Reference)
            // Or create order first? Usually we create DB record as "pending_payment" then redirect.
            // Let's stick effectively to the existing flow but intercept payment.

            const createResponse = await fetch('/api/photo-challenge/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // Inviter Data
                    inviter_name: inviterName,
                    inviter_email: inviterEmail,
                    inviter_password: inviterPassword,
                    inviter_phone: inviterPhone,
                    auth_mode: authMode,

                    // Challenge Data
                    invitee_name: inviteeName,
                    invitee_email: inviteeEmail,
                    package_id: selectedPackage.id,
                    location_id: selectedLocation?.id,
                    custom_location: customLocation || undefined,
                    preferred_dates: [date1, date2, date3].filter(Boolean),

                    // Payment (Mark as pending initially)
                    payment_method: paymentMethod,
                }),
            });

            const challengeData = await createResponse.json();
            if (!challengeData.success) {
                toast.error(challengeData.error || 'Błąd tworzenia wyzwania');
                setLoading(false);
                return;
            }

            // Save token if returned
            if (challengeData.token) {
                localStorage.setItem('token', challengeData.token);
            }

            // 2. Initiate PayU Payment
            const amountInGrosze = selectedPackage.challenge_price * 100; // Convert PLN to Grosze
            const payRes = await fetch('/api/payu/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: amountInGrosze,
                    description: `Foto Wyzwanie: ${selectedPackage.name}`,
                    email: inviterEmail,
                    challengeId: challengeData.challenge_id, // Assuming create API returns this
                    redirectUrl: `${window.location.origin}/foto-wyzwanie/status/${challengeData.unique_link}/sukces`
                })
            });

            const payData = await payRes.json();

            if (payData.success && payData.redirectUrl) {
                // Redirect user to PayU
                window.location.href = payData.redirectUrl;
            } else {
                toast.error('Błąd inicjalizacji płatności');
                // Should probably redirect to a "payment failed" or "try again" page 
                // but for now just show error. user can retry from dashboard if we implemented that.
                // Or just push to status page with "pending" status.
                router.push(`/foto-wyzwanie/status/${challengeData.unique_link}/pending`);
            }

        } catch (error) {
            console.error(error);
            toast.error('Wystąpił błąd');
        } finally {
            // setLoading(false); // Don't unset if redirecting
        }
    };

    return (
        <div className="min-h-screen bg-black text-white py-12 px-4 font-sans">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-12">
                    <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gold-400 to-yellow-200 bg-clip-text text-transparent mb-4">
                        Stwórz Foto Wyzwanie
                    </h1>
                    <p className="text-zinc-400 text-lg">
                        Krok {step} z 4
                    </p>
                </header>

                {/* Progress Bar */}
                <div className="flex justify-between mb-12 px-4 relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-zinc-800 -z-10 transform -translate-y-1/2" />
                    {[1, 2, 3, 4].map((s) => (
                        <div
                            key={s}
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all ${step >= s ? 'bg-gold-400 text-black' : 'bg-zinc-800 text-zinc-500'
                                }`}
                        >
                            {s}
                        </div>
                    ))}
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-10 shadow-2xl">

                    {/* STEP 1: PACKAGE */}
                    {step === 1 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <span className="text-gold-400">01.</span> Wybierz Pakiet i Lokalizację
                            </h2>

                            <div className="grid md:grid-cols-2 gap-4 mb-8">





                                {packages.map(pkg => {
                                    const discount = pkg.base_price - pkg.challenge_price;
                                    let items: string[] = [];
                                    try {
                                        if (pkg.included_items) {
                                            items = typeof pkg.included_items === 'string' ? JSON.parse(pkg.included_items) : pkg.included_items;
                                        }
                                    } catch (e) { items = [] }

                                    return (
                                        <button
                                            key={pkg.id}
                                            onClick={() => setSelectedPackage(pkg)}
                                            className={`p-6 rounded-xl border-2 text-left transition-all h-full flex flex-col ${selectedPackage?.id === pkg.id
                                                ? 'border-gold-400 bg-gold-400/10'
                                                : 'border-zinc-800 hover:border-gold-400/30'
                                                }`}
                                        >
                                            <h3 className="text-xl font-bold mb-2 text-white">{pkg.name}</h3>

                                            {pkg.description && (
                                                <p className="text-sm text-zinc-400 mb-4 flex-grow">{pkg.description}</p>
                                            )}

                                            <div className="flex items-baseline gap-2 mb-2">
                                                <span className="text-3xl font-bold text-gold-400">{pkg.challenge_price} zł</span>
                                                <span className="text-zinc-500 line-through decoration-red-500">{pkg.base_price} zł</span>
                                            </div>

                                            {items.length > 0 && (
                                                <ul className="mb-4 space-y-1">
                                                    {items.slice(0, 3).map((item, i) => (
                                                        <li key={i} className="text-xs text-zinc-300 flex items-center gap-1">
                                                            <Check className="w-3 h-3 text-gold-400" /> {item}
                                                        </li>
                                                    ))}
                                                    {items.length > 3 && <li className="text-xs text-zinc-500">+ {items.length - 3} więcej</li>}
                                                </ul>
                                            )}

                                            <span className="inline-block mt-auto text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded self-start">
                                                Oszczędzasz {discount} zł
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <h3 className="text-lg font-bold mb-4 text-zinc-300">Gdzie robimy zdjęcia?</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                {locations.map(loc => (
                                    <button
                                        key={loc.id}
                                        onClick={() => { setSelectedLocation(loc); setCustomLocation(''); }}
                                        className={`p-3 rounded-lg border text-sm font-medium transition-all ${selectedLocation?.id === loc.id
                                            ? 'border-gold-400 bg-gold-400 text-black'
                                            : 'border-zinc-700 hover:border-zinc-500'
                                            }`}
                                    >
                                        {loc.name}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="text"
                                placeholder="Lub wpisz własną lokalizację..."
                                value={customLocation}
                                onChange={(e) => { setCustomLocation(e.target.value); setSelectedLocation(null); }}
                                className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-gold-400 transition-colors"
                            />

                            <div className="flex justify-end mt-8">
                                <button
                                    disabled={!selectedPackage || (!selectedLocation && !customLocation)}
                                    onClick={() => setStep(2)}
                                    className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    Dalej <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: ACCOUNT (INVITER) */}
                    {step === 2 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <span className="text-gold-400">02.</span> Twoje Konto (Organizator)
                            </h2>

                            <div className="flex bg-zinc-800 p-1 rounded-lg mb-6 w-fit">
                                <button
                                    onClick={() => setAuthMode('register')}
                                    className={`px-6 py-2 rounded-md font-medium transition-all ${authMode === 'register' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400'}`}
                                >
                                    Zakładam konto
                                </button>
                                <button
                                    onClick={() => setAuthMode('login')}
                                    className={`px-6 py-2 rounded-md font-medium transition-all ${authMode === 'login' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400'}`}
                                >
                                    Mam już konto
                                </button>
                            </div>

                            <div className="space-y-4">
                                {authMode === 'register' && (
                                    <>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Twoje Imię i Nazwisko</label>
                                            <input
                                                type="text"
                                                value={inviterName}
                                                onChange={(e) => setInviterName(e.target.value)}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:border-gold-400 outline-none"
                                                placeholder="Jan Kowalski"
                                            />
                                        </div>
                                    </>
                                )}
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Adres Email</label>
                                    <input
                                        type="email"
                                        value={inviterEmail}
                                        onChange={(e) => setInviterEmail(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:border-gold-400 outline-none"
                                        placeholder="jan@example.com"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-zinc-400 mb-1">Hasło</label>
                                        <input
                                            type="password"
                                            value={inviterPassword}
                                            onChange={(e) => setInviterPassword(e.target.value)}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:border-gold-400 outline-none"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    {authMode === 'register' && (
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Telefon</label>
                                            <input
                                                type="tel"
                                                value={inviterPhone}
                                                onChange={(e) => setInviterPhone(e.target.value)}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:border-gold-400 outline-none"
                                                placeholder="+48..."
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between mt-8">
                                <button onClick={() => setStep(1)} className="text-zinc-400 hover:text-white px-4 py-2">Wstecz</button>
                                <button
                                    onClick={() => setStep(3)}
                                    disabled={!inviterEmail || !inviterPassword || (authMode === 'register' && !inviterName)}
                                    className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50"
                                >
                                    Dalej <ArrowRight className="w-4 h-4 inline ml-2" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: CHALLENGE DETAILS */}
                    {step === 3 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <span className="text-gold-400">03.</span> Szczegóły Wyzwania
                            </h2>

                            <div className="mb-8 p-6 bg-zinc-800/50 rounded-xl border border-zinc-700">
                                <h3 className="text-lg font-bold mb-4 text-white">Kogo zapraszasz?</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-zinc-400 mb-1">Imię Osoby Zapraszanej</label>
                                        <input
                                            type="text"
                                            value={inviteeName}
                                            onChange={(e) => setInviteeName(e.target.value)}
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 focus:border-gold-400 outline-none"
                                            placeholder="Anna"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-zinc-400 mb-1">Email Osoby Zapraszanej (Wymagany)</label>
                                        <input
                                            type="email"
                                            value={inviteeEmail}
                                            onChange={(e) => setInviteeEmail(e.target.value)}
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 focus:border-gold-400 outline-none"
                                            placeholder="anna@example.com"
                                        />
                                        <p className="text-xs text-zinc-500 mt-1">Wyślemy jej zaproszenie mailem.</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-gold-400" /> Zaproponuj 3 Terminy
                                </h3>
                                <p className="text-sm text-zinc-400 mb-4">Wybierz 3 daty, które Tobie pasują. Zaproszona osoba wybierze jedną z nich.</p>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <input
                                        type="datetime-local"
                                        value={date1}
                                        onChange={(e) => setDate1(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-3 text-sm focus:border-gold-400 outline-none"
                                    />
                                    <input
                                        type="datetime-local"
                                        value={date2}
                                        onChange={(e) => setDate2(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-3 text-sm focus:border-gold-400 outline-none"
                                    />
                                    <input
                                        type="datetime-local"
                                        value={date3}
                                        onChange={(e) => setDate3(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-3 text-sm focus:border-gold-400 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between mt-8">
                                <button onClick={() => setStep(2)} className="text-zinc-400 hover:text-white px-4 py-2">Wstecz</button>
                                <button
                                    onClick={() => setStep(4)}
                                    disabled={!inviteeName || !inviteeEmail || !date1}
                                    className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50"
                                >
                                    Podsumowanie <ArrowRight className="w-4 h-4 inline ml-2" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: PAYMENT */}
                    {step === 4 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <span className="text-gold-400">04.</span> Płatność
                            </h2>

                            <div className="bg-zinc-800/30 p-6 rounded-xl border border-zinc-700 mb-8">
                                <div className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-4">
                                    <span className="text-zinc-400">Wybrany pakiet</span>
                                    <span className="font-bold">{selectedPackage?.name}</span>
                                </div>
                                <div className="flex justify-between items-center text-xl font-bold text-gold-400">
                                    <span>Do zapłaty</span>
                                    <span>{selectedPackage?.challenge_price} zł</span>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold mb-4">Wybierz metodę płatności</h3>
                            <div className="grid grid-cols-3 gap-4 mb-8">
                                <button
                                    onClick={() => setPaymentMethod('p24')}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'p24' ? 'border-gold-400 bg-gold-400/10' : 'border-zinc-700 hover:bg-zinc-800'
                                        }`}
                                >
                                    <CreditCard className="w-6 h-6" />
                                    <span className="font-bold text-sm">Przelewy24</span>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('blik')}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'blik' ? 'border-gold-400 bg-gold-400/10' : 'border-zinc-700 hover:bg-zinc-800'
                                        }`}
                                >
                                    <span className="font-bold text-xl">BLIK</span>
                                    <span className="font-bold text-sm">Szybki przelew</span>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('card')}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'card' ? 'border-gold-400 bg-gold-400/10' : 'border-zinc-700 hover:bg-zinc-800'
                                        }`}
                                >
                                    <CreditCard className="w-6 h-6" />
                                    <span className="font-bold text-sm">Karta</span>
                                </button>
                            </div>

                            <button
                                onClick={handleCreate}
                                disabled={loading}
                                className="w-full bg-gold-400 hover:bg-gold-500 text-black py-4 rounded-xl font-bold text-xl shadow-lg transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                {loading ? 'Przetwarzanie...' : 'Zapłać i Utwórz Wyzwanie'}
                            </button>

                            <button onClick={() => setStep(3)} className="w-full text-zinc-500 mt-4 text-sm hover:text-zinc-300">
                                Wróć do edycji
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
