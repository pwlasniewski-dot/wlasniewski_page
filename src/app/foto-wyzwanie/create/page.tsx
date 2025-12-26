'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Heart, MapPin, Package, Mail, User, Calendar, Clock, Check } from 'lucide-react';
import BookingCalendar from '@/components/BookingCalendar';

interface ChallengePackage {
    id: number;
    name: string;
    challenge_price: number;
    description?: string;
}

interface ChallengeLocation {
    id: number;
    name: string;
    description?: string;
}

export default function CreateChallengePage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [packages, setPackages] = useState<ChallengePackage[]>([]);
    const [locations, setLocations] = useState<ChallengeLocation[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [inviterName, setInviterName] = useState('');
    const [inviterPhone, setInviterPhone] = useState('');
    const [inviterEmail, setInviterEmail] = useState('');
    const [inviteeName, setInviteeName] = useState('');
    const [inviteeEmail, setInviteeEmail] = useState('');
    const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
    const [hqCoords, setHqCoords] = useState({ lat: 53.2952, lon: 18.7845 });
    const [maxRadius, setMaxRadius] = useState(60);
    const [customLocation, setCustomLocation] = useState<string>('');
    const [customZipCode, setCustomZipCode] = useState<string>('');
    const [distanceKm, setDistanceKm] = useState<number | null>(null);
    const [isCheckingDistance, setIsCheckingDistance] = useState(false);
    const [distanceError, setDistanceError] = useState<string | null>(null);
    const [isCustomLocation, setIsCustomLocation] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ date: string; start?: string; end?: string } | null>(null);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);

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

            // Fetch radius settings
            const settingsRes = await fetch('/api/photo-challenge/settings');
            const settingsData = await settingsRes.json();
            if (settingsData.success) {
                const lat = parseFloat(settingsData.settings.hq_latitude) || 53.2952;
                const lon = parseFloat(settingsData.settings.hq_longitude) || 18.7845;
                const radius = parseInt(settingsData.settings.max_radius_km) || 60;
                setHqCoords({ lat, lon });
                setMaxRadius(radius);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectedPkg = packages.find(p => p.id === selectedPackage);
    const selectedLoc = locations.find(l => l.id === selectedLocation);

    const canProceedStep1 = inviterName.trim() && inviterPhone.trim() && inviterEmail.trim() && inviteeName.trim() && inviteeEmail.trim() && acceptTerms;
    const canProceedStep2 = selectedPackage !== null && (isCustomLocation
        ? (customLocation.length >= 3 && distanceKm !== null && distanceKm <= maxRadius)
        : selectedLocation !== null);
    const canProceedStep3 = selectedSlot !== null && selectedSlot.date !== '' && selectedSlot.start !== undefined;

    const handlePayment = async () => {
        if (!canProceedStep1 || !canProceedStep2 || !canProceedStep3) return;

        setProcessingPayment(true);

        try {
            const response = await fetch('/api/photo-challenge/create-with-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inviter_name: inviterName,
                    inviter_phone: inviterPhone,
                    inviter_email: inviterEmail,
                    invitee_name: inviteeName,
                    invitee_email: inviteeEmail,
                    package_id: selectedPackage,
                    location_id: isCustomLocation ? null : selectedLocation,
                    custom_location: isCustomLocation ? `${customLocation} (${customZipCode})` : null,
                    date: selectedSlot?.date,
                    start_time: selectedSlot?.start,
                    end_time: selectedSlot?.end,
                    channel: 'email'
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

    const checkDistance = async (address: string) => {
        if (!address || address.length < 5) return;
        setIsCheckingDistance(true);
        setDistanceError(null);
        setDistanceKm(null);

        try {
            // Include postal code if provided for maximum accuracy
            const query = customZipCode
                ? `${address}, ${customZipCode}, Polska`
                : `${address}, Polska`;
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=pl`);
            const data = await response.json();

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);

                // Dynamic coords from settings
                const HQ_LAT = hqCoords.lat;
                const HQ_LON = hqCoords.lon;

                // Haversine formula
                const R = 6371; // km
                const dLat = (lat - HQ_LAT) * Math.PI / 180;
                const dLon = (lon - HQ_LON) * Math.PI / 180;
                const a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(HQ_LAT * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const d = R * c;

                const roundedDist = Math.round(d * 10) / 10;
                setDistanceKm(roundedDist);

                if (roundedDist > maxRadius) {
                    setDistanceError(`Niestety, ta lokalizacja jest za daleko (${roundedDist} km). Maksymalny zasięg to ${maxRadius} km.`);
                }
            } else {
                setDistanceError('Nie znaleźliśmy podanego adresu. Spróbuj wpisać go dokładniej.');
            }
        } catch (error) {
            setDistanceError('Wystąpił błąd podczas sprawdzania adresu. Spróbuj ponownie.');
        } finally {
            setIsCheckingDistance(false);
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
                    {[1, 2, 3, 4].map((s) => (
                        <div
                            key={s}
                            className={`flex-1 h-1 mx-2 rounded ${s <= step ? 'bg-gold-500' : 'bg-zinc-700'
                                }`}
                        />
                    ))}
                </div>

                {/* Step 1: Dane osobowe */}
                {step === 1 && (
                    <div className="bg-zinc-800/50 rounded-xl p-8 border border-zinc-700 mb-8">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gold-400">
                            <User size={28} />
                            Dane uczestników
                        </h2>

                        <div className="space-y-6 mb-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Ty (Zapraszający)</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Twoje imię</label>
                                        <input
                                            type="text"
                                            value={inviterName}
                                            onChange={(e) => setInviterName(e.target.value)}
                                            placeholder="Np. Tomasz"
                                            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-gold-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Twój telefon</label>
                                        <input
                                            type="tel"
                                            value={inviterPhone}
                                            onChange={(e) => setInviterPhone(e.target.value)}
                                            placeholder="Np. 123 456 789"
                                            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-gold-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Twój e-mail</label>
                                        <input
                                            type="email"
                                            value={inviterEmail}
                                            onChange={(e) => setInviterEmail(e.target.value)}
                                            placeholder="tomasz@wlasniewski.pl"
                                            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-gold-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-pink-500">Osoba zapraszana</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Imię osoby zaproszonej</label>
                                        <input
                                            type="text"
                                            value={inviteeName}
                                            onChange={(e) => setInviteeName(e.target.value)}
                                            placeholder="Np. Magda"
                                            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-gold-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Email osoby zaproszonej</label>
                                        <input
                                            type="email"
                                            value={inviteeEmail}
                                            onChange={(e) => setInviteeEmail(e.target.value)}
                                            placeholder="magda@example.com"
                                            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-gold-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-zinc-700/50 mb-8">
                                <label className="flex gap-3 cursor-pointer group">
                                    <div className="relative flex items-center pt-0.5">
                                        <input
                                            type="checkbox"
                                            checked={acceptTerms}
                                            onChange={(e) => setAcceptTerms(e.target.checked)}
                                            className="peer sr-only"
                                        />
                                        <div className="w-5 h-5 border-2 border-zinc-600 rounded bg-zinc-900 peer-checked:bg-gold-500 peer-checked:border-gold-500 transition-all flex items-center justify-center">
                                            <Check size={14} className="text-black scale-0 peer-checked:scale-100 transition-transform" />
                                        </div>
                                    </div>
                                    <span className="text-[11px] text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
                                        Oświadczam, że zapoznałem się z <Link href="/regulamin" className="text-gold-400 hover:underline" target="_blank">Regulaminem</Link>, <Link href="/polityka-prywatnosci" className="text-gold-400 hover:underline" target="_blank">Polityką Prywatności</Link> oraz <Link href="/polityka-prywatnosci#rodo" className="text-gold-400 hover:underline" target="_blank">Klauzulą RODO</Link> i akceptuję ich postanowienia. Rozumiem, że podany e-mail posłuży do utworzenia konta klienta.
                                    </span>
                                </label>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                disabled={!canProceedStep1}
                                className={`w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${canProceedStep1
                                    ? 'bg-gold-500 hover:bg-gold-600 text-black shadow-lg shadow-gold-500/20'
                                    : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                                    }`}
                            >
                                Dalej <ArrowRight size={20} />
                            </button>
                        </div>
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
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedPackage === pkg.id
                                            ? 'border-gold-500 bg-gold-500/10'
                                            : 'border-zinc-600 bg-zinc-900 hover:border-zinc-500'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg">{pkg.name}</h3>
                                                {pkg.description && (
                                                    <p className="text-sm text-zinc-400 mt-1">
                                                        {pkg.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-gold-500">
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
                                        onClick={() => {
                                            setSelectedLocation(loc.id);
                                            setIsCustomLocation(false);
                                        }}
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedLocation === loc.id && !isCustomLocation
                                            ? 'border-gold-500 bg-gold-500/10'
                                            : 'border-zinc-600 bg-zinc-900 hover:border-zinc-500'
                                            }`}
                                    >
                                        <h3 className="font-bold text-lg">{loc.name}</h3>
                                        {loc.description && (
                                            <p className="text-sm text-zinc-400 mt-1">
                                                {loc.description}
                                            </p>
                                        )}
                                    </div>
                                ))}

                                {/* Custom Location Option */}
                                <div
                                    onClick={() => {
                                        setIsCustomLocation(true);
                                        setSelectedLocation(null);
                                    }}
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${isCustomLocation
                                        ? 'border-gold-500 bg-gold-500/10'
                                        : 'border-zinc-600 bg-zinc-900 hover:border-zinc-500'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg">Inna lokalizacja (własna)</h3>
                                        <span className="text-xs bg-gold-500/20 text-gold-500 px-2 py-0.5 rounded-full border border-gold-500/30">ZASIĘG 60 KM</span>
                                    </div>
                                    <p className="text-sm text-zinc-400 mt-1">
                                        WPISZ WŁASNY ADRES DO 60 KM OD PŁUŻNICY (87-214)
                                    </p>

                                    {isCustomLocation && (
                                        <div className="mt-4 space-y-3 pt-3 border-t border-zinc-700/50" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Np. Lisewo"
                                                    className="flex-[2] bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500 transition-colors"
                                                    value={customLocation}
                                                    onChange={(e) => setCustomLocation(e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Kod (np. 86-230)"
                                                    className="flex-1 bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500 transition-colors"
                                                    value={customZipCode}
                                                    onChange={(e) => setCustomZipCode(e.target.value)}
                                                />
                                                <button
                                                    onClick={() => checkDistance(customLocation)}
                                                    disabled={isCheckingDistance || customLocation.length < 3}
                                                    className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg font-bold hover:bg-gold-500 hover:text-black disabled:opacity-50 transition-all text-xs whitespace-nowrap"
                                                >
                                                    {isCheckingDistance ? 'SPRAWDZAM...' : 'SPRAWDŹ ZASIĘG'}
                                                </button>
                                            </div>

                                            {distanceKm !== null && !distanceError && (
                                                <p className="text-green-500 text-xs font-bold flex items-center gap-1">
                                                    ✓ Super! Odległość to ok. {distanceKm} km. Mieścisz się w zasięgu.
                                                </p>
                                            )}

                                            {distanceError && (
                                                <p className="text-red-500 text-xs font-bold">
                                                    ⚠ {distanceError}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
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
                                className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors ${canProceedStep2
                                    ? 'bg-gold-500 hover:bg-gold-600 text-black'
                                    : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                                    }`}
                            >
                                Dalej <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Wybór terminu */}
                {step === 3 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-zinc-800/50 rounded-xl p-8 border border-zinc-700"
                    >
                        <h2 className="text-2xl font-bold mb-2 text-gold-400">Preferowany termin</h2>
                        <p className="text-zinc-400 mb-6 font-light">Wybierz datę i godzinę która Ci odpowiada. Zaproszona osoba będzie mogła ją zaakceptować lub zaproponować zmianę.</p>

                        <div className="bg-zinc-900 border border-zinc-700 p-4 rounded-xl mb-8">
                            <BookingCalendar
                                service="Sesja"
                                onSlotSelect={setSelectedSlot}
                                selectedSlot={selectedSlot}
                            />
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep(2)}
                                className="flex-1 py-3 rounded-lg font-bold border border-zinc-600 hover:border-zinc-500 transition-colors"
                            >
                                Wstecz
                            </button>
                            <button
                                onClick={() => setStep(4)}
                                disabled={!canProceedStep3}
                                className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${canProceedStep3
                                    ? 'bg-gold-500 hover:bg-gold-600 text-black shadow-lg shadow-gold-500/20'
                                    : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                                    }`}
                            >
                                Podsumowanie <ArrowRight size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 4: Summary */}
                {step === 4 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-zinc-800/50 rounded-xl p-8 border border-zinc-700"
                    >
                        <h2 className="text-2xl font-bold mb-6 text-gold-400">Podsumowanie wyzwania</h2>
                        <div className="space-y-6 mb-8">
                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-700/50 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-500">Pakiet:</span>
                                    <span className="font-semibold text-gold-400 flex items-center gap-2">
                                        <Package size={14} /> {selectedPkg?.name}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-500">Miejsce:</span>
                                    <span className="font-semibold flex items-center gap-2">
                                        <MapPin size={14} className="text-gold-400" /> {isCustomLocation ? customLocation : selectedLoc?.name}
                                        {isCustomLocation && distanceKm && <span className="text-[10px] text-zinc-500">({distanceKm} km)</span>}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-500">Termin:</span>
                                    <span className="font-semibold flex items-center gap-2">
                                        <Calendar size={14} className="text-gold-400" /> {selectedSlot?.date} <Clock size={14} className="ml-1 text-gold-400" /> {selectedSlot?.start}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-700/50">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 text-pink-500">Dla kogo?</h4>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold">{inviteeName}</span>
                                    <span className="text-zinc-500">{inviteeEmail}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-end pt-4 border-t border-zinc-700">
                                <div>
                                    <p className="text-zinc-500 text-xs mb-1 uppercase tracking-widest">Do zapłaty</p>
                                    <p className="text-4xl font-bold text-gold-500">{selectedPkg?.challenge_price} zł</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-green-500 text-xs font-bold animate-pulse">WARTOŚĆ PREZENTU PONAD 30% WIĘKSZA!</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep(3)}
                                className="flex-1 py-3 rounded-lg font-bold border border-zinc-600 hover:border-zinc-500 transition-colors"
                            >
                                Wstecz
                            </button>
                            <button
                                onClick={handlePayment}
                                disabled={processingPayment}
                                className={`flex-[2] py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all ${processingPayment
                                    ? 'bg-zinc-700 text-zinc-500 cursor-wait'
                                    : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20'
                                    }`}
                            >
                                {processingPayment ? 'Inicjowanie...' : `Zapłać i wyślij wyzwanie`} <Check size={20} />
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
