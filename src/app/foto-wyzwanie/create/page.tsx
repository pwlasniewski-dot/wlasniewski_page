'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Heart, MapPin, Package, Mail, User } from 'lucide-react';

interface ChallengePackage {
    id: number;
    package_name: string;
    challenge_price: number;
    package_description?: string;
}

interface ChallengeLocation {
    id: number;
    location_name: string;
    location_description?: string;
}

export default function CreateChallengePage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [packages, setPackages] = useState<ChallengePackage[]>([]);
    const [locations, setLocations] = useState<ChallengeLocation[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [inviterName, setInviterName] = useState('');
    const [inviteeName, setInviteeName] = useState('');
    const [inviteeEmail, setInviteeEmail] = useState('');
    const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
    const [processingPayment, setProcessingPayment] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [pkgRes, locRes] = await Promise.all([
                fetch('/api/photo-challenge/packages'),
                fetch('/api/photo-challenge/locations')
            ]);

            const pkgData = await pkgRes.json();
            const locData = await locRes.json();

            if (pkgData.success) setPackages(pkgData.packages || []);
            if (locData.success) setLocations(locData.locations || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectedPkg = packages.find(p => p.id === selectedPackage);
    const selectedLoc = locations.find(l => l.id === selectedLocation);

    const canProceedStep1 = inviterName.trim() && inviteeName.trim() && inviteeEmail.trim();
    const canProceedStep2 = selectedPackage !== null && selectedLocation !== null;

    const handlePayment = async () => {
        if (!canProceedStep1 || !canProceedStep2) return;

        setProcessingPayment(true);

        try {
            const response = await fetch('/api/photo-challenge/create-with-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inviter_name: inviterName,
                    invitee_name: inviteeName,
                    invitee_email: inviteeEmail,
                    package_id: selectedPackage,
                    location_id: selectedLocation,
                    channel: 'email' // default to email
                })
            });

            const data = await response.json();

            if (data.success && data.paymentUrl) {
                // Redirect to Przelewy24 payment
                window.location.href = data.paymentUrl;
            } else {
                alert('Błąd przy tworzeniu zaproszenia');
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('Błąd przy przetwarzaniu płatności');
        } finally {
            setProcessingPayment(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 flex items-center justify-center px-4">
                <div className="text-gold-400 text-xl">Ładowanie...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 text-white py-20 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-display font-bold mb-4">
                        <Heart className="inline mr-3 text-pink-500" size={48} />
                        Zaproś na wyzwanie!
                    </h1>
                    <p className="text-xl text-zinc-400">
                        Spraw niezapomniane wspomnienia dla swojej pary
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

                {/* Step 1: Dane osobowe */}
                {step === 1 && (
                    <div className="bg-zinc-800/50 rounded-xl p-8 border border-zinc-700 mb-8">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <User size={28} />
                            Twoje dane
                        </h2>

                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Twoje imię
                                </label>
                                <input
                                    type="text"
                                    value={inviterName}
                                    onChange={(e) => setInviterName(e.target.value)}
                                    placeholder="Np. Tomasz"
                                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-gold-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Imię osoby zaproszonej
                                </label>
                                <input
                                    type="text"
                                    value={inviteeName}
                                    onChange={(e) => setInviteeName(e.target.value)}
                                    placeholder="Np. Magda"
                                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-gold-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Email osoby zaproszonej
                                </label>
                                <input
                                    type="email"
                                    value={inviteeEmail}
                                    onChange={(e) => setInviteeEmail(e.target.value)}
                                    placeholder="magda@example.com"
                                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-gold-500"
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            disabled={!canProceedStep1}
                            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors ${
                                canProceedStep1
                                    ? 'bg-gold-500 hover:bg-gold-600 text-black'
                                    : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                            }`}
                        >
                            Dalej <ArrowRight size={20} />
                        </button>
                    </div>
                )}

                {/* Step 2: Pakiet i Lokalizacja */}
                {step === 2 && (
                    <div className="space-y-8 mb-8">
                        {/* Pakiety */}
                        <div className="bg-zinc-800/50 rounded-xl p-8 border border-zinc-700">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Package size={28} />
                                Wybierz pakiet
                            </h2>

                            <div className="grid gap-4 mb-8">
                                {packages.map((pkg) => (
                                    <div
                                        key={pkg.id}
                                        onClick={() => setSelectedPackage(pkg.id)}
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                            selectedPackage === pkg.id
                                                ? 'border-gold-500 bg-gold-500/10'
                                                : 'border-zinc-600 bg-zinc-900 hover:border-zinc-500'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg">{pkg.package_name}</h3>
                                                {pkg.package_description && (
                                                    <p className="text-sm text-zinc-400 mt-1">
                                                        {pkg.package_description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-gold-400">
                                                    {pkg.challenge_price}zł
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Lokalizacje */}
                        <div className="bg-zinc-800/50 rounded-xl p-8 border border-zinc-700">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <MapPin size={28} />
                                Wybierz lokalizację
                            </h2>

                            <div className="grid gap-4">
                                {locations.map((loc) => (
                                    <div
                                        key={loc.id}
                                        onClick={() => setSelectedLocation(loc.id)}
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                            selectedLocation === loc.id
                                                ? 'border-gold-500 bg-gold-500/10'
                                                : 'border-zinc-600 bg-zinc-900 hover:border-zinc-500'
                                        }`}
                                    >
                                        <h3 className="font-bold text-lg">{loc.location_name}</h3>
                                        {loc.location_description && (
                                            <p className="text-sm text-zinc-400 mt-1">
                                                {loc.location_description}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
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
                                disabled={!canProceedStep2}
                                className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors ${
                                    canProceedStep2
                                        ? 'bg-gold-500 hover:bg-gold-600 text-black'
                                        : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                                }`}
                            >
                                Dalej <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Potwierdzenie i Płatność */}
                {step === 3 && (
                    <div className="bg-zinc-800/50 rounded-xl p-8 border border-zinc-700 mb-8">
                        <h2 className="text-2xl font-bold mb-6">Podsumowanie zaproszenia</h2>

                        <div className="space-y-4 mb-8 bg-zinc-900 p-6 rounded-lg">
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Od:</span>
                                <span className="font-bold">{inviterName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Dla:</span>
                                <span className="font-bold">{inviteeName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Email:</span>
                                <span className="font-bold">{inviteeEmail}</span>
                            </div>
                            <div className="border-t border-zinc-700 pt-4 mt-4 flex justify-between">
                                <span className="text-zinc-400">Pakiet:</span>
                                <span className="font-bold">{selectedPkg?.package_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Lokalizacja:</span>
                                <span className="font-bold">{selectedLoc?.location_name}</span>
                            </div>
                            <div className="border-t border-zinc-700 pt-4 mt-4 flex justify-between text-xl">
                                <span>Do zapłaty:</span>
                                <span className="font-bold text-gold-400">{selectedPkg?.challenge_price}zł</span>
                            </div>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-8">
                            <p className="text-sm text-blue-200">
                                ℹ️ Po płatności {inviteeName} otrzyma zaproszenie na podanego maila.
                                Będzie mogła wybrać datę i godzinę sesji.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep(2)}
                                className="flex-1 py-3 rounded-lg font-bold border border-zinc-600 hover:border-zinc-500 transition-colors"
                            >
                                Wstecz
                            </button>
                            <button
                                onClick={handlePayment}
                                disabled={processingPayment}
                                className={`flex-1 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-colors ${
                                    processingPayment
                                        ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                            >
                                {processingPayment ? 'Przetwarzanie...' : `Zapłać ${selectedPkg?.challenge_price}zł`}
                            </button>
                        </div>
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
