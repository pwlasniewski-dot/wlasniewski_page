'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Toaster, toast } from 'sonner';
import { motion } from 'framer-motion';
import { getApiUrl } from '@/lib/api-config';
import { buildICS } from '@/utils/ics';
import TestimonialsSection from '@/components/TestimonialsSection';
import BookingCalendar from '@/components/BookingCalendar';
import PromocodeBar from '@/components/PromocodeBar';

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
    service_id: number;
    name: string;
    icon?: string;
    description?: string;
    hours: number;
    price: number;
    subtitle?: string;
    features?: string;
    order: number;
    is_active: boolean;
}

interface DiscountCode {
    code: string;
    value: number;
    type: "percentage" | "fixed";
}

interface GiftCard {
    code: string;
    amount: number;
}

export default function RezerwacjaPage() {
    // Data from API
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
    const [servicesLoading, setServicesLoading] = useState(true);

    // Selected values
    const [service, setService] = useState<ServiceType | null>(null);
    const [chosenPackage, setChosenPackage] = useState<Package | null>(null);
    const [slot, setSlot] = useState<{ date: string; start?: string; end?: string } | null>(null);

    // Availability
    const [availableHours, setAvailableHours] = useState<Array<{ hour: number; available: boolean; reason?: string }>>([]);
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [selectedHour, setSelectedHour] = useState<number | null>(null);

    // Form fields
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [venueCity, setVenueCity] = useState("");
    const [venuePlace, setVenuePlace] = useState("");
    const [notes, setNotes] = useState("");
    const [rodo, setRodo] = useState(false);

    // Promo code
    const [promoCode, setPromoCode] = useState("");
    const [discount, setDiscount] = useState<DiscountCode | null>(null);
    const [checkingCode, setCheckingCode] = useState(false);
    const [codeMessage, setCodeMessage] = useState("");

    // Gift card
    const [giftCardCode, setGiftCardCode] = useState("");
    const [giftCard, setGiftCard] = useState<GiftCard | null>(null);
    const [checkingGiftCard, setCheckingGiftCard] = useState(false);
    const [giftCardMessage, setGiftCardMessage] = useState("");

    // Promo bar settings
    const [promoSettings, setPromoSettings] = useState<{
        enabled: boolean;
        code: string;
        discount: number;
        discountType: 'percentage' | 'fixed';
        expiryDate?: string;
    } | null>(null);

    // Payment
    const [submitting, setSubmitting] = useState(false);

    // Load service types on mount
    useEffect(() => {
        const loadServices = async () => {
            try {
                const res = await fetch(getApiUrl('service-types'));
                if (res.ok) {
                    const data = await res.json();
                    const active = (data.serviceTypes || []).filter((s: ServiceType) => s.is_active);
                    setServiceTypes(active);
                    if (active.length > 0 && !service) {
                        setService(active[0]);
                    }
                }
            } catch (error) {
                console.error('Failed to load services:', error);
            } finally {
                setServicesLoading(false);
            }
        };

        loadServices();

        // Load promo settings
        const loadPromoSettings = async () => {
            try {
                const res = await fetch(getApiUrl('settings'));
                if (res.ok) {
                    const data = await res.json();
                    if (data.settings) {
                        const settings = data.settings;
                        if (settings.promo_code_discount_enabled === 'true' || settings.promo_code_discount_enabled === true) {
                            setPromoSettings({
                                enabled: true,
                                code: settings.promo_code || 'WELCOME',
                                discount: parseInt(settings.promo_code_discount_amount || '10'),
                                discountType: settings.promo_code_discount_type || 'percentage',
                                expiryDate: settings.promo_code_expiry_date
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load promo settings:', error);
            }
        };

        loadPromoSettings();
    }, []);

    // Load available hours when package and date are selected
    useEffect(() => {
        if (!chosenPackage || !slot?.date) {
            setAvailableHours([]);
            setSelectedHour(null);
            return;
        }

        const loadAvailability = async () => {
            setLoadingAvailability(true);
            try {
                const res = await fetch(
                    `/api/availability?serviceId=${chosenPackage.service_id}&packageId=${chosenPackage.id}&date=${slot.date}`
                );
                if (res.ok) {
                    const data = await res.json();
                    setAvailableHours(data.slots || []);
                    setSelectedHour(null); // Reset selection when date changes
                } else {
                    console.error('Failed to load availability:', res.status);
                    setAvailableHours([]);
                }
            } catch (error) {
                console.error('Failed to load availability:', error);
                setAvailableHours([]);
            } finally {
                setLoadingAvailability(false);
            }
        };

        loadAvailability();
    }, [chosenPackage, slot?.date]);

    const needsVenue = service && ['Ślub', 'Przyjęcie', 'Urodziny'].includes(service.name);

    const activePackages = useMemo(
        () => (service ? service.packages.filter(p => p.is_active) : []),
        [service]
    );

    const finalPrice = useMemo(() => {
        if (!chosenPackage) return 0;
        let price = chosenPackage.price;

        // Apply discount
        if (discount) {
            if (discount.type === "percentage") {
                price -= Math.floor((price * discount.value) / 100);
            } else {
                price -= discount.value * 100; // Convert PLN to cents
            }
        }

        // Apply gift card
        if (giftCard) {
            price -= giftCard.amount * 100; // Convert PLN to cents
        }

        return Math.max(0, price);
    }, [chosenPackage, discount, giftCard]);

    const isReadyToSubmit = useMemo(
        () =>
            name &&
            email &&
            slot &&
            chosenPackage &&
            rodo &&
            (!needsVenue || (venueCity && venuePlace)),
        [name, email, slot, chosenPackage, rodo, needsVenue, venueCity, venuePlace]
    );

    // Check promo code
    const handleCheckPromoCode = async () => {
        if (!promoCode.trim()) return;

        setCheckingCode(true);
        setCodeMessage("");

        try {
            const res = await fetch(getApiUrl('promo-codes'), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: promoCode })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.promo_code) {
                    setDiscount({
                        code: promoCode,
                        value: data.promo_code.discount_value,
                        type: data.promo_code.discount_type
                    });
                    setCodeMessage(`✅ Kod "${promoCode}" zastosowany!`);
                } else {
                    setCodeMessage("❌ Kod nie znaleziony lub wygasł");
                }
            } else {
                setCodeMessage("❌ Kod nie znaleziony");
            }
        } catch (error) {
            setCodeMessage("❌ Błąd sprawdzania kodu");
        } finally {
            setCheckingCode(false);
        }
    };

    // Check gift card
    const handleCheckGiftCard = async () => {
        if (!giftCardCode.trim()) return;

        setCheckingGiftCard(true);
        setGiftCardMessage("");

        try {
            const res = await fetch(getApiUrl('gift-cards'), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: giftCardCode })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.gift_card && !data.gift_card.is_used) {
                    setGiftCard({
                        code: giftCardCode,
                        amount: data.gift_card.amount
                    });
                    setGiftCardMessage(`✅ Karta o wartości ${data.gift_card.amount} zł dodana!`);
                } else {
                    setGiftCardMessage("❌ Karta nie znaleziona lub już użyta");
                }
            } else {
                setGiftCardMessage("❌ Karta nie znaleziona");
            }
        } catch (error) {
            setGiftCardMessage("❌ Błąd sprawdzania karty");
        } finally {
            setCheckingGiftCard(false);
        }
    };

    // Create booking and redirect to payment
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isReadyToSubmit || !slot || !chosenPackage) {
            alert("Uzupełnij wszystkie wymagane pola i wybierz termin!");
            return;
        }

        setSubmitting(true);

        try {
            const title = `${service?.name} — ${chosenPackage.name}`;
            const location = needsVenue && venueCity && venuePlace ? `${venuePlace}, ${venueCity}` : "Do ustalenia";

            const descLines = [
                `Usługa: ${service?.name}`,
                `Pakiet: ${chosenPackage.name}`,
                `Cena: ${(finalPrice / 100).toFixed(2)} zł`,
                `Klient: ${name}`,
                `Email: ${email}`,
                `Telefon: ${phone || "-"}`,
                needsVenue ? `Miejsce: ${venuePlace}, ${venueCity}` : undefined,
                `Uwagi: ${notes || "-"}`,
            ].filter(Boolean) as string[];

            const ics = buildICS({
                uid: `booking-${Date.now()}@wlasniewski.pl`,
                title,
                description: descLines.join("\n"),
                date: slot.date,
                start: slot.start,
                end: slot.end,
                attendeeEmail: email,
                organizerEmail: "przemyslaw@wlasniewski.pl",
                location,
            });

            const bookingPayload = {
                service: service?.name,
                package: chosenPackage.name,
                hours: chosenPackage.hours,
                price: finalPrice,
                originalPrice: chosenPackage.price,
                date: slot.date,
                start_time: slot.start ?? null,
                end_time: slot.end ?? null,
                name,
                email,
                phone: phone || null,
                venue_city: needsVenue ? venueCity : null,
                venue_place: needsVenue ? venuePlace : null,
                notes: notes || null,
                promo_code: discount ? discount.code : null,
                gift_card_code: giftCard ? giftCard.code : null,
                ics,
            };

            // Create booking first
            const bookingRes = await fetch(getApiUrl('bookings'), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bookingPayload)
            });

            if (!bookingRes.ok) {
                throw new Error("Booking creation failed");
            }

            const bookingData = await bookingRes.json();
            const bookingId = bookingData.booking?.id;

            if (!bookingId) {
                throw new Error("No booking ID returned");
            }

            // Redirect to Stripe checkout
            const checkoutRes = await fetch(getApiUrl('checkout'), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bookingId,
                    amount: finalPrice,
                    email,
                    serviceName: service?.name,
                    packageName: chosenPackage.name
                })
            });

            if (checkoutRes.ok) {
                const { url } = await checkoutRes.json();
                if (url) {
                    window.location.href = url;
                    return;
                }
            }

            // Fallback: show alert if payment setup not ready
            alert("✅ Rezerwacja utworzona!\n\nPrzejdź do panelu aby dokonać płatności.");
            window.location.href = "/rezerwacja/potwierdzenie";

        } catch (error) {
            console.error("Submission error:", error);
            alert("❌ Błąd podczas tworzenia rezerwacji. Spróbuj ponownie.");
        } finally {
            setSubmitting(false);
        }
    };

    if (servicesLoading) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-black to-zinc-950 py-20 px-4">
                <div className="text-center text-white">
                    <p className="text-lg">Ładowanie usług...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-black to-zinc-950 py-20 px-4">
            {/* Promocode Bar */}
            {promoSettings?.enabled && (
                <PromocodeBar
                    code={promoSettings.code}
                    discount={promoSettings.discount}
                    discountType={promoSettings.discountType}
                    expiryDate={promoSettings.expiryDate}
                />
            )}
            <div className="max-w-4xl mx-auto pt-8">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
                    📸 Zarezerwuj Sesję
                </h1>
                <p className="text-zinc-400 text-center mb-12">
                    Wybierz usługę, pakiet i termin. Płatność przejdziesz bezpiecznie poprzez Stripe.
                </p>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Step 1: Service Selection */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-zinc-900/50 rounded-2xl p-8 border border-zinc-800"
                    >
                        <h2 className="text-2xl font-bold text-white mb-6">Krok 1: Wybierz Usługę</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {serviceTypes.map((svc) => (
                                <button
                                    key={svc.id}
                                    type="button"
                                    onClick={() => {
                                        setService(svc);
                                        setChosenPackage(null);
                                    }}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${service?.id === svc.id
                                        ? "border-amber-500 bg-amber-500/10"
                                        : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{svc.icon || '📸'}</span>
                                        <div>
                                            <p className="font-bold text-white">{svc.name}</p>
                                            <p className="text-sm text-zinc-400">{svc.description}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.section>

                    {/* Step 2: Package Selection */}
                    {service && activePackages.length > 0 && (
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="bg-zinc-900/50 rounded-2xl p-8 border border-zinc-800"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6">Krok 2: Wybierz Pakiet</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {activePackages.map((pkg) => (
                                    <button
                                        key={pkg.id}
                                        type="button"
                                        onClick={() => setChosenPackage(pkg)}
                                        className={`p-4 rounded-xl border-2 transition-all text-left ${chosenPackage?.id === pkg.id
                                            ? "border-amber-500 bg-amber-500/10"
                                            : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-2xl">{pkg.icon || '📦'}</span>
                                            <h3 className="font-bold text-white">{pkg.name}</h3>
                                        </div>
                                        {pkg.subtitle && <p className="text-sm text-zinc-300 mb-2">{pkg.subtitle}</p>}
                                        <div className="text-sm text-amber-400 font-bold">
                                            {pkg.hours}h • {(pkg.price / 100).toFixed(2)} zł
                                        </div>
                                        {pkg.description && (
                                            <p className="text-xs text-zinc-400 mt-2 line-clamp-2">{pkg.description}</p>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.section>
                    )}

                    {/* Step 3: Date & Time Selection */}
                    {chosenPackage && (
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="bg-zinc-900/50 rounded-2xl p-8 border border-zinc-800"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6">Krok 3: Wybierz Termin</h2>
                            
                            {/* Calendar */}
                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-white mb-4">Wybierz Dzień</h3>
                                <BookingCalendar 
                                    onSlotSelect={setSlot} 
                                    selectedSlot={slot}
                                    service={(service?.name as "Sesja" | "Ślub" | "Przyjęcie" | "Urodziny") || 'Sesja'}
                                />
                            </div>

                            {/* Hour Selection - shown after date is selected */}
                            {slot?.date && (
                                <div className="mt-8 pt-8 border-t border-zinc-700">
                                    <h3 className="text-xl font-bold text-white mb-4">
                                        {loadingAvailability ? '⏳ Ładowanie dostępnych godzin...' : '⏰ Wybierz Godzinę'}
                                    </h3>

                                    {loadingAvailability ? (
                                        <div className="text-center text-zinc-400">
                                            <p>Sprawdzam dostępność...</p>
                                        </div>
                                    ) : availableHours.length === 0 ? (
                                        <div className="text-center text-amber-500">
                                            <p>Brak dostępnych godzin na wybrany dzień</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                                            {availableHours.map((slot) => (
                                                <button
                                                    key={slot.hour}
                                                    type="button"
                                                    disabled={!slot.available}
                                                    onClick={() => {
                                                        const start = `${slot.hour.toString().padStart(2, '0')}:00`;
                                                        const end = `${(slot.hour + (chosenPackage?.hours || 1)).toString().padStart(2, '0')}:00`;
                                                        setSelectedHour(slot.hour);
                                                        setSlot(prev => prev ? { ...prev, start, end } : null);
                                                    }}
                                                    className={`py-2 rounded-lg transition-all text-sm font-medium ${slot.available
                                                        ? selectedHour === slot.hour
                                                            ? 'bg-amber-500 text-white border border-amber-400'
                                                            : 'bg-zinc-800 text-white border border-zinc-700 hover:border-amber-400 hover:bg-zinc-700'
                                                        : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                                                        }`}
                                                    title={
                                                        !slot.available
                                                            ? slot.reason === 'booked_session'
                                                                ? 'Zajęte - rezerwacja sesji'
                                                                : slot.reason === 'booked_event'
                                                                    ? 'Zajęte - rezerwacja całodniowa'
                                                                    : 'Poza godzinami dostępnymi'
                                                            : ''
                                                    }
                                                >
                                                    {slot.hour.toString().padStart(2, '0')}:00
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.section>
                    )}

                    {/* Step 4: Personal Information */}
                    {slot && (
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="bg-zinc-900/50 rounded-2xl p-8 border border-zinc-800"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6">Krok 4: Twoje Dane</h2>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                                            Imię i nazwisko *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:ring-2 focus:ring-amber-500 outline-none"
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
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:ring-2 focus:ring-amber-500 outline-none"
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
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                        placeholder="+48 123 456 789"
                                    />
                                </div>

                                {needsVenue && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                                Miasto *
                                            </label>
                                            <input
                                                type="text"
                                                required={!!needsVenue}
                                                value={venueCity}
                                                onChange={(e) => setVenueCity(e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:ring-2 focus:ring-amber-500 outline-none"
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
                                                value={venuePlace}
                                                onChange={(e) => setVenuePlace(e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                                placeholder="Pałac Dąbrowski"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Uwagi (opcjonalnie)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                        placeholder="Wpisz dodatkowe informacje..."
                                    />
                                </div>

                                {/* Promo Code */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Kod promocyjny
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={promoCode}
                                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                            disabled={!!discount}
                                            className="flex-1 px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white uppercase focus:ring-2 focus:ring-amber-500 outline-none disabled:opacity-50"
                                            placeholder="KOD123"
                                        />
                                        {discount ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDiscount(null);
                                                    setPromoCode("");
                                                    setCodeMessage("");
                                                }}
                                                className="px-4 py-2 bg-red-900/30 text-red-400 border border-red-900/50 rounded-lg font-medium hover:bg-red-900/50"
                                            >
                                                Usuń
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleCheckPromoCode}
                                                disabled={!promoCode || checkingCode}
                                                className="px-6 py-2 bg-zinc-800 text-white rounded-lg font-medium hover:bg-zinc-700 disabled:opacity-50"
                                            >
                                                {checkingCode ? "..." : "Zastosuj"}
                                            </button>
                                        )}
                                    </div>
                                    {codeMessage && (
                                        <p className={`text-sm mt-2 ${discount ? "text-green-400" : "text-red-400"}`}>
                                            {codeMessage}
                                        </p>
                                    )}
                                </div>

                                {/* Gift Card */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Karta podarunkowa
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={giftCardCode}
                                            onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                                            disabled={!!giftCard}
                                            className="flex-1 px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white uppercase focus:ring-2 focus:ring-amber-500 outline-none disabled:opacity-50"
                                            placeholder="KOD KARTY"
                                        />
                                        {giftCard ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setGiftCard(null);
                                                    setGiftCardCode("");
                                                    setGiftCardMessage("");
                                                }}
                                                className="px-4 py-2 bg-red-900/30 text-red-400 border border-red-900/50 rounded-lg font-medium hover:bg-red-900/50"
                                            >
                                                Usuń
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleCheckGiftCard}
                                                disabled={!giftCardCode || checkingGiftCard}
                                                className="px-6 py-2 bg-zinc-800 text-white rounded-lg font-medium hover:bg-zinc-700 disabled:opacity-50"
                                            >
                                                {checkingGiftCard ? "..." : "Zastosuj"}
                                            </button>
                                        )}
                                    </div>
                                    {giftCardMessage && (
                                        <p className={`text-sm mt-2 ${giftCard ? "text-green-400" : "text-red-400"}`}>
                                            {giftCardMessage}
                                        </p>
                                    )}
                                </div>

                                {/* Discounts Display */}
                                {discount && (
                                    <div className="flex justify-between text-green-400">
                                        <span>Rabat ({discount.code}):</span>
                                        <span className="font-medium">
                                            -{discount.type === "percentage" ? `${discount.value}%` : `${discount.value} zł`}
                                        </span>
                                    </div>
                                )}
                                {giftCard && (
                                    <div className="flex justify-between text-green-400">
                                        <span>Karta podarunkowa:</span>
                                        <span className="font-medium">-{giftCard.amount} zł</span>
                                    </div>
                                )}

                                {/* Final Price */}
                                <div className="flex justify-between text-2xl font-bold text-white pt-4 border-t border-zinc-800">
                                    <span>Do zapłaty:</span>
                                    <span>{(finalPrice / 100).toFixed(2)} zł</span>
                                </div>
                            </div>

                            {/* RODO */}
                            <label className="flex items-start gap-3 cursor-pointer group mt-6">
                                <input
                                    type="checkbox"
                                    checked={rodo}
                                    onChange={(e) => setRodo(e.target.checked)}
                                    required
                                    className="mt-1 w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-amber-600 focus:ring-amber-500"
                                />
                                <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                                    Zgadzam się na przetwarzanie danych osobowych (RODO) w celu realizacji usługi. *
                                </span>
                            </label>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={!isReadyToSubmit || submitting}
                                className="w-full mt-6 bg-amber-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-900/20"
                            >
                                {submitting ? "Przetwarzanie..." : "💳 Przejdź do Płatności"}
                            </button>
                        </motion.section>
                    )}
                </form>

                {/* Testimonials */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="mt-20"
                >
                    <TestimonialsSection />
                </motion.div>
            </div>
        </main>
    );
}
