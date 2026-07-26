'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Toaster, toast } from 'sonner';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';
import { buildICS } from '@/utils/ics';
import TestimonialsSection from '@/components/TestimonialsSection';
import BookingCalendar from '@/components/BookingCalendar';
import PromocodeBar from '@/components/PromocodeBar';
import PageRenderer from '@/components/PageRenderer';
import { PageSection } from '@/components/admin/PageBuilder';
import { useCart } from '@/context/CartContext';

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
    blocks_entire_day?: boolean;
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

const trackBookingEvent = (event: string, params: Record<string, unknown> = {}) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', event, params);
    }
};

const FALLBACK_RETURNING_PROMO: DiscountCode = {
    code: 'WRACAM15',
    value: 15,
    type: 'percentage',
};

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

    // Page Builder Sections
    const [pageSections, setPageSections] = useState<PageSection[] | null>(null);

    // Payment
    const [submitting, setSubmitting] = useState(false);

    // Pre-selected photographer (z URL ?photographer=ID)
    const [preselectedPhotographer, setPreselectedPhotographer] = useState<{ id: number; name: string } | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const sp = new URLSearchParams(window.location.search);
        const pid = sp.get('photographer');
        if (!pid || !/^\d+$/.test(pid)) return;
        fetch(`/api/photographers/public?purpose=bookings`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                const found = data?.items?.find((p: { id: number }) => p.id === parseInt(pid, 10));
                if (found) setPreselectedPhotographer({ id: found.id, name: found.display_name });
            })
            .catch(() => {});
    }, []);

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
                        const requested = new URLSearchParams(window.location.search).get('service');
                        const selected = active.find((item: ServiceType) => item.name.toLowerCase() === requested?.toLowerCase()) || active[0];
                        setService(selected);
                        trackBookingEvent('booking_view', { service: selected.name, source: new URLSearchParams(window.location.search).get('source') || 'direct' });
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
                                code: settings.promo_code, // Removed fallback
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

        // Load Page Sections
        const loadPage = async () => {
            try {
                const res = await fetch('/api/pages?slug=rezerwacja');
                const data = await res.json();
                if (data.success && data.page?.sections) {
                    try {
                        const parsed = JSON.parse(data.page.sections);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            setPageSections(parsed);
                        }
                    } catch (e) {
                        console.error('Failed to parse page sections');
                    }
                }
            } catch (error) {
                console.error('Failed to load page sections:', error);
            }
        };
        loadPage();
    }, []);

    // Load available hours when package and date are selected
    useEffect(() => {
        if (!chosenPackage || !slot?.date) {
            setAvailableHours([]);
            setSelectedHour(null);
            return;
        }

        const loadAvailability = async () => {
            if (chosenPackage.blocks_entire_day) {
                setAvailableHours([]);
                setSelectedHour(null);
                setSlot(prev => prev ? { ...prev, start: '08:00', end: '22:00' } : null);
                setLoadingAvailability(false);
                return;
            }

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
        const normalizedCode = promoCode.trim().toUpperCase();
        if (!normalizedCode) return;

        setCheckingCode(true);
        setCodeMessage("");

        try {
            const res = await fetch('/api/promo-codes/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: normalizedCode })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success && data.discount) {
                    setDiscount({
                        code: data.discount.code,
                        value: data.discount.value,
                        type: data.discount.type
                    });
                    setCodeMessage(`✅ Kod "${normalizedCode}" zastosowany!`);
                } else if (data.success && data.giftCard) {
                    setGiftCard({
                        code: normalizedCode,
                        amount: data.giftCard.amount
                    });
                    setCodeMessage(`✅ Karta o wartości ${data.giftCard.amount} zł zastosowana!`);
                } else {
                    // Fallback to Settings Promo Code
                    checkSettingsCode();
                }
            } else {
                // Fallback to Settings Promo Code
                checkSettingsCode();
            }
        } catch (error) {
            checkSettingsCode();
        } finally {
            setCheckingCode(false);
        }
    };

    const checkSettingsCode = () => {
        const normalizedCode = promoCode.trim().toUpperCase();

        if (normalizedCode === FALLBACK_RETURNING_PROMO.code) {
            setDiscount(FALLBACK_RETURNING_PROMO);
            setCodeMessage(`✅ Kod "${normalizedCode}" zastosowany!`);
            return;
        }

        const hasPromoSettings = promoSettings && promoSettings.enabled;
        const isSettingsCodeMatch = hasPromoSettings && promoSettings.code?.trim().toUpperCase() === normalizedCode;

        if (isSettingsCodeMatch) {
            setDiscount({
                code: promoSettings!.code,
                value: promoSettings!.discount,
                type: promoSettings!.discountType
            });
            setCodeMessage(`✅ Kod "${normalizedCode}" zastosowany!`);
        } else {
            setCodeMessage("❌ Kod nie znaleziony lub wygasł");
        }
    };

    // Check gift card
    const handleCheckGiftCard = async () => {
        if (!giftCardCode.trim()) return;

        setCheckingGiftCard(true);
        setGiftCardMessage("");

        try {
            const res = await fetch('/api/promo-codes/check', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: giftCardCode })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.giftCard) {
                    setGiftCard({
                        code: giftCardCode,
                        amount: data.giftCard.amount
                    });
                    setGiftCardMessage(`✅ Karta o wartości ${data.giftCard.amount} zł dodana!`);
                } else if (data.discount) {
                    setGiftCardMessage("❌ To jest kod rabatowy, wpisz go powyżej");
                } else {
                    setGiftCardMessage("❌ Karta nie znaleziona lub już użyta");
                }
            } else {
                setGiftCardMessage("❌ Nieprawidłowy kod karty podarunkowej");
            }
        } catch (error) {
            setGiftCardMessage("❌ Błąd połączenia");
        } finally {
            setCheckingGiftCard(false);
        }
    };

    const { addItem } = useCart();

    // Create booking and redirect to payment
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isReadyToSubmit || !slot || !chosenPackage) {
            alert("Uzupełnij wszystkie wymagane pola i wybierz termin!");
            return;
        }

        const title = `${service?.name} — ${chosenPackage.name}`;
        const bookingData = {
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
            photographer_id: preselectedPhotographer?.id ?? null,
            photographer_name: preselectedPhotographer?.name ?? null,
        };

        // Event snippet for Prośba o wycenę conversion page
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'conversion', { 'send_to': 'AW-17548893646/-bm8CJ-3h-YbEM67-69B' });
        }

        trackBookingEvent('add_to_cart', {
            currency: 'PLN',
            value: finalPrice / 100,
            service: service?.name,
            package: chosenPackage.name,
        });

        addItem({
            type: 'booking',
            productId: chosenPackage.id.toString(),
            title,
            subtitle: `${slot.date}${slot.start ? ` o ${slot.start}` : ''}`,
            price: finalPrice,
            quantity: 1,
            metadata: bookingData
        });

        // Scroll to top or show toast is handled by addItem
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
        <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-black to-zinc-950">
            {/* Dynamic Content from Page Builder */}
            {pageSections && pageSections.length > 0 && (
                <PageRenderer sections={pageSections} />
            )}

            <div className="py-20 px-4">
                <div className="max-w-4xl mx-auto pt-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
                        Wybierz fotografię dopasowaną do Waszego dnia
                    </h1>
                    <p className="text-zinc-300 text-center max-w-2xl mx-auto mb-8 leading-relaxed">
                        Najpierw wybierz rodzaj spotkania i zakres fotografowania. Potem zobaczysz wolne terminy, podasz najważniejsze informacje i przejdziesz do bezpiecznej płatności przez PayU.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12 text-sm">
                        {[
                            ['1', 'Wybierz usługę i pakiet'],
                            ['2', 'Zaznacz termin'],
                            ['3', 'Potwierdź i zapłać przez PayU'],
                        ].map(([number, label]) => (
                            <div key={number} className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-zinc-300">
                                <span className="mr-2 font-semibold text-amber-500">{number}.</span>{label}
                            </div>
                        ))}
                    </div>

                    {/* NEW: Early Gift Card Input */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-zinc-900/50 rounded-2xl p-8 border border-amber-500/20 mb-8 overflow-hidden relative"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] rounded-full -mr-16 -mt-16" />
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            🎁 Masz kartę podarunkową?
                        </h2>
                        <p className="text-zinc-400 mb-6 text-sm">
                            Wpisz kod karty, aby od razu naliczyć środki na rezerwację. Jeśli karta pokrywa koszt sesji, rezerwacja będzie natychmiastowa.
                        </p>

                        <div className="flex flex-col md:flex-row gap-4">
                            <input
                                type="text"
                                value={giftCardCode}
                                onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                                disabled={!!giftCard}
                                className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white uppercase focus:ring-2 focus:ring-amber-500 outline-none disabled:opacity-50 text-lg tracking-widest font-mono"
                                placeholder="WPISZ KOD KARTY"
                            />
                            {giftCard ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setGiftCard(null);
                                        setGiftCardCode("");
                                        setGiftCardMessage("");
                                    }}
                                    className="px-6 py-3 bg-red-900/40 text-red-200 border border-red-500/30 rounded-xl font-bold hover:bg-red-900/60 transition-colors flex items-center gap-2 justify-center"
                                >
                                    <span>Usuń Kartę</span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleCheckGiftCard}
                                    disabled={!giftCardCode || checkingGiftCard}
                                    className="px-8 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-500 disabled:opacity-50 transition-all flex items-center gap-2 justify-center shadow-lg shadow-amber-900/30"
                                >
                                    {checkingGiftCard ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        "Zastosuj"
                                    )}
                                </button>
                            )}
                        </div>
                        {giftCardMessage && (
                            <motion.p
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`text-sm mt-3 font-medium flex items-center gap-2 ${giftCard ? "text-green-400" : "text-red-400"}`}
                            >
                                {giftCard ? "✨" : "❌"} {giftCardMessage}
                            </motion.p>
                        )}
                        {giftCard && (
                            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                <p className="text-green-400 text-sm font-bold">
                                    Dostępne środki: -{giftCard.amount} zł
                                </p>
                            </div>
                        )}
                    </motion.section>

                    <form id="booking-flow" onSubmit={handleSubmit} className="space-y-8 scroll-mt-24">
                        {preselectedPhotographer && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-r from-rose-500/20 to-amber-500/20 border border-rose-400/40 rounded-2xl p-4 flex items-center gap-3"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white font-bold">
                                    {preselectedPhotographer.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-bold">Wybrany fotograf: {preselectedPhotographer.name}</p>
                                    <p className="text-zinc-300 text-xs">Zostanie przypisany do tej rezerwacji.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPreselectedPhotographer(null)}
                                    className="text-zinc-300 hover:text-white text-xs underline"
                                >
                                    Zmień
                                </button>
                            </motion.div>
                        )}

                        {/* Step 1: Service Selection */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="bg-zinc-900/50 rounded-2xl p-8 border border-zinc-800"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6">Krok 1: Co fotografujemy?</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {serviceTypes.map((svc) => (
                                    <button
                                        key={svc.id}
                                        type="button"
                                        onClick={() => {
                                            setService(svc);
                                            setChosenPackage(null);
                                            setSlot(null);
                                            trackBookingEvent('booking_service_select', { service: svc.name });
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
                                <h2 className="text-2xl font-bold text-white mb-6">Krok 2: Wybierz zakres</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {activePackages.map((pkg) => (
                                        <button
                                            key={pkg.id}
                                            type="button"
                                            onClick={() => {
                                                setChosenPackage(pkg);
                                                trackBookingEvent('booking_package_select', { service: service.name, package: pkg.name, value: pkg.price / 100, currency: 'PLN' });
                                            }}
                                            className={`p-5 rounded-2xl border-2 transition-all text-left flex flex-col h-full ${chosenPackage?.id === pkg.id
                                                ? "border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                                                : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800/50"
                                                }`}
                                        >
                                            <div className="min-h-[5.5rem] flex flex-col">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-3xl">{pkg.icon || '📦'}</span>
                                                    <h3 className="text-xl font-bold text-white leading-tight">{pkg.name}</h3>
                                                </div>
                                                {pkg.subtitle && (
                                                    <p className="text-sm text-zinc-400 mb-2 leading-snug line-clamp-2">
                                                        {pkg.subtitle}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="text-xl text-amber-500 font-extrabold mb-4 flex items-center gap-2">
                                                <span className="text-sm bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{pkg.hours}h</span>
                                                <span>{(pkg.price / 100).toFixed(2)} zł</span>
                                            </div>

                                            {pkg.description && (
                                                <div
                                                    className="text-[13px] text-zinc-400 mt-2 prose prose-invert prose-sm prose-p:my-0 prose-ul:my-2 prose-li:my-1 opacity-90"
                                                    dangerouslySetInnerHTML={{ __html: pkg.description }}
                                                />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {/* Step 3: Date & Time Selection - Visible immediately after Service is present */}
                        {service && (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="bg-zinc-900/50 rounded-2xl p-8 border border-zinc-800"
                            >
                                <h2 className="text-2xl font-bold text-white mb-6">Krok 3: Wybierz termin</h2>

                                {/* Calendar */}
                                <div className="mb-8">
                                    <h3 className="text-lg font-bold text-white mb-4">Wybierz Dzień</h3>
                                    <BookingCalendar
                                        onSlotSelect={(selected) => {
                                            setSlot(selected);
                                            if (selected?.date) trackBookingEvent('booking_date_select', { service: service?.name, package: chosenPackage?.name, date: selected.date });
                                        }}
                                        selectedSlot={slot}
                                        service={(service?.name as "Sesja" | "Ślub" | "Przyjęcie" | "Urodziny") || 'Sesja'}
                                    />
                                </div>

                                {/* Hour Selection - shown after date is selected */}
                                {slot?.date && (
                                    <div className="mt-8 pt-8 border-t border-zinc-700">
                                        <h3 className="text-xl font-bold text-white mb-4">
                                            {!chosenPackage
                                                ? '📦 Wybierz pakiet, aby zobaczyć godziny'
                                                : loadingAvailability
                                                    ? '⏳ Ładowanie dostępnych godzin...'
                                                    : '⏰ Wybierz Godzinę'}
                                        </h3>

                                        {!chosenPackage ? (
                                            <div className="text-center text-amber-500 py-8 border border-dashed border-zinc-700 rounded-xl bg-zinc-900/50">
                                                <p className="mb-2">Najpierw wybierz pakiet powyżej,</p>
                                                <p className="text-sm text-zinc-400">abyśmy mogli sprawdzić dostępność dla wybranej długości sesji.</p>
                                            </div>
                                        ) : loadingAvailability ? (
                                            <div className="text-center text-zinc-400">
                                                <p>Sprawdzam dostępność...</p>
                                            </div>
                                        ) : chosenPackage.blocks_entire_day ? (
                                            <div className="p-6 bg-zinc-900/80 border border-amber-500/30 rounded-xl text-center">
                                                <p className="text-amber-500 font-bold mb-1">✨ Pakiet całodniowy (Ślub/Przyjęcie)</p>
                                                <p className="text-zinc-400 text-sm">Ten pakiet rezerwuje cały dzień. Nie musisz wybierać konkretnych godzin.</p>
                                            </div>
                                        ) : availableHours.length === 0 ? (
                                            <div className="text-center text-amber-500">
                                                <p>Brak dostępnych godzin na wybrany dzień</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                                                {availableHours.map((hSlot) => (
                                                    <button
                                                        key={hSlot.hour}
                                                        type="button"
                                                        disabled={!hSlot.available}
                                                        onClick={() => {
                                                            const start = `${hSlot.hour.toString().padStart(2, '0')}:00`;
                                                            const end = `${(hSlot.hour + (chosenPackage?.hours || 1)).toString().padStart(2, '0')}:00`;
                                                            setSelectedHour(hSlot.hour);
                                                            setSlot(prev => prev ? { ...prev, start, end } : null);
                                                        }}
                                                        className={`py-2 rounded-lg transition-all text-sm font-medium ${hSlot.available
                                                            ? selectedHour === hSlot.hour
                                                                ? 'bg-amber-500 text-white border border-amber-400'
                                                                : 'bg-zinc-800 text-white border border-zinc-700 hover:border-amber-400 hover:bg-zinc-700'
                                                            : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                                                            }`}
                                                        title={
                                                            !hSlot.available
                                                                ? hSlot.reason === 'booked_session'
                                                                    ? 'Zajęte - rezerwacja sesji'
                                                                    : hSlot.reason === 'booked_event'
                                                                        ? 'Zajęte - rezerwacja całodniowa'
                                                                        : 'Poza godzinami dostępnymi'
                                                                : ''
                                                        }
                                                    >
                                                        {hSlot.hour.toString().padStart(2, '0')}:00
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
                                            onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                                            className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                            maxLength={500}
                                            placeholder="Napisz krótko, kto będzie na zdjęciach i na czym najbardziej Wam zależy."
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
                                            <span>Karta podarunkowa (Kredyt):</span>
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
                                    className={`w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${isReadyToSubmit
                                        ? "bg-amber-600 text-white hover:bg-amber-500 shadow-amber-900/20"
                                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                        } group flex items-center justify-center gap-2`}
                                >
                                    <ShoppingBag className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                    <span>Przejdź do podsumowania</span>
                                </button>
                            </motion.section>
                        )}
                    </form>

                    <div className="mt-20 border-t border-zinc-800 pt-16">
                        <h2 className="text-2xl font-bold text-white text-center mb-8">Co mówią osoby, które były już przed obiektywem</h2>
                        <TestimonialsSection />
                    </div>

                </div>
            </div>
            <a
                href="#booking-flow"
                className="fixed bottom-4 left-4 right-4 z-40 rounded-xl bg-amber-500 px-5 py-4 text-center font-bold text-black shadow-2xl shadow-black/50 md:hidden"
                onClick={() => trackBookingEvent('booking_sticky_cta_click', { service: service?.name })}
            >
                {chosenPackage ? 'Wybierz termin' : 'Zobacz pakiety i wolne terminy'}
            </a>
        </main>
    );
}
