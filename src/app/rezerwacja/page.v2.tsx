'use client';

import { useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { getApiUrl } from '@/lib/api-config';
import BookingCalendar from '@/components/BookingCalendar';
import TestimonialsSection from '@/components/TestimonialsSection';

interface ServiceType {
    id: number;
    name: string;
    icon?: string;
    description?: string;
    is_active: boolean;
    packages: Package[];
}

interface Package {
    id: number;
    name: string;
    icon?: string;
    subtitle?: string;
    description?: string;
    hours: number;
    price: number;
    features?: string;
    is_active: boolean;
}

interface BookingSettings {
    require_payment: boolean;
    payment_method: string;
    currency: string;
    min_days_ahead: number;
}

export default function RezerwacjaPage() {
    // Data
    const [services, setServices] = useState<ServiceType[]>([]);
    const [settings, setSettings] = useState<BookingSettings>({
        require_payment: false,
        payment_method: 'stripe',
        currency: 'PLN',
        min_days_ahead: 7
    });
    const [loading, setLoading] = useState(true);

    // Selection
    const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<{ date: string; start?: string; end?: string } | null>(null);

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        venueCity: '',
        venuePlace: '',
        notes: '',
        rodo: false
    });

    const [submitting, setSubmitting] = useState(false);

    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load services and packages
                const servicesRes = await fetch(getApiUrl('service-types'));
                if (servicesRes.ok) {
                    const data = await servicesRes.json();
                    const active = (data.serviceTypes || []).filter((s: ServiceType) => s.is_active);
                    setServices(active);
                    if (active.length > 0) setSelectedService(active[0]);
                }

                // Load booking settings
                const settingsRes = await fetch(getApiUrl('settings/booking'));
                if (settingsRes.ok) {
                    const data = await settingsRes.json();
                    if (data.settings) {
                        setSettings({
                            require_payment: data.settings.booking_require_payment || false,
                            payment_method: data.settings.booking_payment_method || 'stripe',
                            currency: data.settings.booking_currency || 'PLN',
                            min_days_ahead: data.settings.booking_min_days_ahead || 7
                        });
                    }
                }
            } catch (error) {
                console.error('Error loading data:', error);
                toast.error('Błąd ładowania danych');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const needsVenue = selectedService && ['Ślub', 'Przyjęcie', 'Urodziny'].includes(selectedService.name);

    const isFormValid = formData.name && formData.email && selectedSlot && selectedPackage && formData.rodo &&
        (!needsVenue || (formData.venueCity && formData.venuePlace));

    const calculateFinalPrice = () => {
        if (!selectedPackage) return 0;
        return Math.ceil(selectedPackage.price / 100 * 100) / 100;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid || !selectedService || !selectedPackage || !selectedSlot) return;

        setSubmitting(true);
        try {
            const bookingData = {
                service: selectedService.name,
                package: selectedPackage.name,
                hours: selectedPackage.hours,
                price: selectedPackage.price,
                date: selectedSlot.date,
                start_time: selectedSlot.start || null,
                end_time: selectedSlot.end || null,
                name: formData.name,
                email: formData.email,
                phone: formData.phone || null,
                venue_city: needsVenue ? formData.venueCity : null,
                venue_place: needsVenue ? formData.venuePlace : null,
                notes: formData.notes || null
            };

            const res = await fetch(getApiUrl('bookings'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            });

            if (!res.ok) throw new Error('Booking failed');

            const result = await res.json();

            if (settings.require_payment) {
                // TODO: Redirect to Stripe/PayU
                toast.success('✅ Rezerwacja utworzona! Przejdź do płatności...');
                // window.location.href = `/rezerwacja/platnosc?booking_id=${result.booking.id}`;
            } else {
                toast.success('✅ Rezerwacja potwierdzona! Email wysłany.');
                window.location.href = '/rezerwacja/potwierdzenie';
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('❌ Błąd rezerwacji. Spróbuj ponownie.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-black">
                <div className="flex items-center justify-center h-screen text-white">
                    <p>Ładowanie...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black">
            <Toaster position="top-right" theme="dark" />

            <div className="max-w-6xl mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
                        📸 Zarezerwuj Sesję
                    </h1>
                    <p className="text-xl text-zinc-400">
                        Wybierz pakiet, termin i uzupełnij dane kontaktowe
                    </p>
                    {settings.require_payment && (
                        <p className="text-sm text-amber-500 mt-2">💳 Płatność wymagana</p>
                    )}
                </div>

                {/* Testimonials Section */}
                <div className="mb-20">
                    <TestimonialsSection />
                </div>

                <form onSubmit={handleSubmit} className="space-y-12">
                    {/* Step 1: Service Selection */}
                    {services.length > 0 && (
                        <section className="bg-zinc-900/50 rounded-3xl p-8 border border-zinc-800 backdrop-blur">
                            <h2 className="text-3xl font-bold text-white mb-8">
                                Krok 1: Wybierz Usługę
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {services.map((service) => (
                                    <button
                                        key={service.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedService(service);
                                            setSelectedPackage(null);
                                        }}
                                        className={`p-6 rounded-2xl border-2 transition-all ${selectedService?.id === service.id
                                            ? 'border-amber-500 bg-amber-500/10 scale-105'
                                            : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                                            }`}
                                    >
                                        <div className="text-4xl mb-2">{service.icon || '📸'}</div>
                                        <p className="font-bold text-white">{service.name}</p>
                                        <p className="text-sm text-zinc-400">{service.description}</p>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Step 2: Package Selection */}
                    {selectedService && selectedService.packages.filter(p => p.is_active).length > 0 && (
                        <section className="bg-zinc-900/50 rounded-3xl p-8 border border-zinc-800 backdrop-blur">
                            <h2 className="text-3xl font-bold text-white mb-8">
                                Krok 2: Wybierz Pakiet
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {selectedService.packages.filter(p => p.is_active).map((pkg) => {
                                    const features = pkg.features ? JSON.parse(pkg.features) : [];
                                    return (
                                        <button
                                            key={pkg.id}
                                            type="button"
                                            onClick={() => setSelectedPackage(pkg)}
                                            className={`p-6 rounded-2xl border-2 transition-all ${selectedPackage?.id === pkg.id
                                                ? 'border-amber-500 bg-amber-500/10 scale-105'
                                                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="text-3xl">{pkg.icon || '📦'}</span>
                                                <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                                            </div>
                                            {pkg.subtitle && <p className="text-sm text-zinc-300 mb-2">{pkg.subtitle}</p>}
                                            <div className="text-amber-400 font-bold text-lg mb-4">
                                                {(pkg.price / 100).toFixed(0)} {settings.currency}
                                            </div>
                                            <p className="text-sm text-zinc-400 mb-4">{pkg.hours}h sesji</p>
                                            {features.length > 0 && (
                                                <ul className="space-y-2 text-left">
                                                    {features.slice(0, 3).map((feature: string, idx: number) => (
                                                        <li key={idx} className="text-xs text-zinc-300 flex items-start gap-2">
                                                            <span className="text-amber-500">✓</span>
                                                            <span>{feature}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Step 3: Calendar */}
                    {selectedPackage && (
                        <section className="bg-zinc-900/50 rounded-3xl p-8 border border-zinc-800 backdrop-blur">
                            <h2 className="text-3xl font-bold text-white mb-8">
                                Krok 3: Wybierz Termin
                            </h2>
                            <BookingCalendar
                                service={selectedService?.name as any}
                                onSlotSelect={setSelectedSlot}
                                selectedSlot={selectedSlot}
                            />
                        </section>
                    )}

                    {/* Step 4: Form */}
                    {selectedSlot && (
                        <section className="bg-zinc-900/50 rounded-3xl p-8 border border-zinc-800 backdrop-blur">
                            <h2 className="text-3xl font-bold text-white mb-8">
                                Krok 4: Twoje Dane
                            </h2>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                                            Imię i nazwisko *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                            placeholder="Jan Kowalski"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                            placeholder="jan@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Telefon
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                        placeholder="+48 123 456 789"
                                    />
                                </div>

                                {needsVenue && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                                Miasto *
                                            </label>
                                            <input
                                                type="text"
                                                required={!!needsVenue}
                                                value={formData.venueCity}
                                                onChange={(e) => setFormData({ ...formData, venueCity: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                                placeholder="Toruń"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                                Miejsce *
                                            </label>
                                            <input
                                                type="text"
                                                required={!!needsVenue}
                                                value={formData.venuePlace}
                                                onChange={(e) => setFormData({ ...formData, venuePlace: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                                placeholder="Pałac / Restauracja"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Dodatkowe informacje
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                        placeholder="Napierz opis Twoich potrzeb..."
                                    />
                                </div>

                                {/* Price Summary */}
                                <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-zinc-400">Usługa:</span>
                                        <span className="font-semibold text-white">{selectedService?.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-zinc-400">Pakiet:</span>
                                        <span className="font-semibold text-white">{selectedPackage?.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-zinc-700 pt-4">
                                        <span className="text-lg font-bold text-white">Do płatności:</span>
                                        <span className="text-2xl font-bold text-amber-400">
                                            {calculateFinalPrice()} {settings.currency}
                                        </span>
                                    </div>
                                </div>

                                {/* RODO */}
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        required
                                        checked={formData.rodo}
                                        onChange={(e) => setFormData({ ...formData, rodo: e.target.checked })}
                                        className="mt-1 w-5 h-5 rounded accent-amber-500"
                                    />
                                    <span className="text-sm text-zinc-300">
                                        Zgadzam się na przetwarzanie danych osobowych i regulamin rezerwacji *
                                    </span>
                                </label>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={!isFormValid || submitting}
                                    className="w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                                        bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-lg shadow-amber-900/30"
                                >
                                    {submitting ? '⏳ Przetwarzanie...' : settings.require_payment ? '💳 Przejdź do Płatności' : '✅ Potwierdź Rezerwację'}
                                </button>
                            </div>
                        </section>
                    )}
                </form>
            </div>
        </main>
    );
}
