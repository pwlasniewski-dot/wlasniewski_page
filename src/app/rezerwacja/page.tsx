'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';
import { buildICS } from '@/utils/ics';
import TestimonialsSection from '@/components/TestimonialsSection';
import BookingCalendar from '@/components/BookingCalendar';
import BookingFunnelIntro from '@/components/booking/BookingFunnelIntro';
import PageRenderer from '@/components/PageRenderer';
import { PageSection } from '@/components/admin/PageBuilder';
import { useCart } from '@/context/CartContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { readConsentedClientAttribution } from '@/lib/analytics/clientAttribution';
import PromotionPriceBlock from '@/components/promotions/PromotionPriceBlock';
import type { PublicPackagePromotion } from '@/lib/packagePromotionPricing';
import {
    DEFAULT_PHOTO_FUNNEL_CONFIG,
    formatPhotoFunnelTemplate,
    parsePhotoFunnelConfig,
    type PhotoFunnelConfig,
} from '@/lib/marketing/photo-funnel';

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
    regular_price?: number;
    effective_price?: number;
    promotion?: PublicPackagePromotion | null;
    subtitle?: string;
    features?: string;
    order: number;
    blocks_entire_day?: boolean;
    is_active: boolean;
    source?: 'database' | 'drone_cms';
    slug?: string;
    pricePrefix?: string;
}

interface DronePackage {
    slug: string;
    name: string;
    shortName: string;
    price: number;
    pricePrefix?: string;
    summary: string;
    delivery: string;
    features: string[];
    bookingMode?: 'standalone' | 'addon' | 'both';
    eligibleServices?: string[];
    durationHours?: number;
    blocksEntireDay?: boolean;
    active?: boolean;
}

interface DroneCatalog {
    packages: DronePackage[];
    areas: string[];
    booking: { goalLabel: string; goalOptions: string[] };
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

interface AvailabilitySlot {
    start: string;
    end: string;
    endDayOffset: number;
    available: boolean;
    reason?: string;
}

const trackBookingEvent = (event: string, params: Record<string, unknown> = {}) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', event, params);
    }
};

function formatDurationLabel(hours: number) {
    if (hours === 1) return '1 godzina';
    if (hours >= 2 && hours <= 4) return `${hours} godziny`;
    return `${hours} godzin`;
}

export default function RezerwacjaPage() {
    const { trackEvent } = useAnalytics();
    const bookingFormStarted = useRef(false);
    const submissionLock = useRef(false);
    const viewedPromotionIds = useRef<Set<number>>(new Set());
    // Data from API
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
    const [droneCatalog, setDroneCatalog] = useState<DroneCatalog | null>(null);
    const [servicesLoading, setServicesLoading] = useState(true);

    // Selected values
    const [service, setService] = useState<ServiceType | null>(null);
    const [chosenPackage, setChosenPackage] = useState<Package | null>(null);
    const [selectedDroneAddonSlug, setSelectedDroneAddonSlug] = useState<string | null>(null);
    const [slot, setSlot] = useState<{ date: string; start?: string; end?: string; endDayOffset?: number } | null>(null);

    // Availability
    const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [selectedStart, setSelectedStart] = useState<string>('');
    const [availabilityError, setAvailabilityError] = useState('');

    // Form fields
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [venueCity, setVenueCity] = useState("");
    const [venuePlace, setVenuePlace] = useState("");
    const [notes, setNotes] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [droneGoal, setDroneGoal] = useState("");
    const [droneTermsAccepted, setDroneTermsAccepted] = useState(false);
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

    const [splitPaymentInfo, setSplitPaymentInfo] = useState<{ enabled: boolean; percent: number } | null>(null);
    const [photoFunnelConfig, setPhotoFunnelConfig] = useState<PhotoFunnelConfig>(() => parsePhotoFunnelConfig(DEFAULT_PHOTO_FUNNEL_CONFIG));

    // Page Builder Sections
    const [pageSections, setPageSections] = useState<PageSection[] | null>(null);

    // Payment
    const [submitting, setSubmitting] = useState(false);

    // Pre-selected photographer (z URL ?photographer=ID)
    const [preselectedPhotographer, setPreselectedPhotographer] = useState<{ id: number; name: string } | null>(null);

    const markBookingFormStarted = (step: string, selectedService?: string) => {
        if (bookingFormStarted.current) return;
        if (typeof window === 'undefined' || window.localStorage.getItem('cookie_consent') !== 'accepted') return;
        bookingFormStarted.current = true;
        void trackEvent('booking_form_started', {
            area: 'booking_form',
            step,
            service: selectedService || service?.name,
        });
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const sp = new URLSearchParams(window.location.search);
        const requestedCity = sp.get('city')?.trim();
        if (requestedCity && requestedCity.length <= 80) {
            setVenueCity(requestedCity);
        }
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
                const [res, droneRes] = await Promise.all([
                    fetch(getApiUrl('service-types')),
                    fetch('/api/booking/drone-catalog'),
                ]);
                if (res.ok) {
                    const data = await res.json();
                    const catalog: DroneCatalog | null = droneRes.ok ? await droneRes.json() : null;
                    setDroneCatalog(catalog);
                    const databaseServices = (data.serviceTypes || []).filter((s: ServiceType) => s.is_active);
                    const standaloneDronePackages = (catalog?.packages || [])
                        .filter(item => item.active !== false && item.bookingMode !== 'addon')
                        .map((item, index): Package => ({
                            id: -1000 - index,
                            service_id: -100,
                            name: item.name,
                            description: `<p>${item.summary}</p><p>${item.delivery}</p>`,
                            hours: Math.max(1, item.durationHours || 1),
                            price: item.price * 100,
                            subtitle: item.shortName,
                            features: item.features.join('\n'),
                            order: index,
                            blocks_entire_day: item.blocksEntireDay === true,
                            is_active: true,
                            source: 'drone_cms',
                            slug: item.slug,
                            pricePrefix: item.pricePrefix,
                        }));
                    const droneService: ServiceType | null = standaloneDronePackages.length ? {
                        id: -100,
                        name: 'Dron',
                        description: 'Zdjęcia i film z powietrza jako osobne zlecenie',
                        is_active: true,
                        packages: standaloneDronePackages,
                    } : null;
                    const active = droneService ? [...databaseServices, droneService] : databaseServices;
                    setServiceTypes(active);
                    if (active.length > 0 && !service) {
                        const query = new URLSearchParams(window.location.search);
                        const requested = query.get('service');
                        const selected = active.find((item: ServiceType) => item.name.toLowerCase() === requested?.toLowerCase()) || active[0];
                        setService(selected);
                        const requestedPackage = query.get('pakiet');
                        const requestedPackageId = Number(query.get('package_id'));
                        const preselectedPackage = selected.packages.find((pkg: Package) =>
                            (requestedPackage && pkg.slug === requestedPackage)
                            || (Number.isInteger(requestedPackageId) && requestedPackageId > 0 && pkg.id === requestedPackageId)
                        );
                        if (preselectedPackage) setChosenPackage(preselectedPackage);
                        const requestedAddon = query.get('dron');
                        if (requestedAddon && catalog?.packages.some(pkg => pkg.slug === requestedAddon)) setSelectedDroneAddonSlug(requestedAddon);
                        trackBookingEvent('booking_view', { service: selected.name, source: query.get('source') || 'direct' });
                        await trackEvent('booking_view', { package_count: active.reduce((sum: number, item: ServiceType) => sum + item.packages.filter(pkg => pkg.is_active).length, 0) });
                    }
                    if (active.length === 0) {
                        void trackEvent('service_load_result', { status: 'error', area: 'services', http_status: res.status, package_count: 0, reason_code: 'no_active_services' });
                    } else {
                        void trackEvent('service_load_result', { status: 'ok', area: 'services', http_status: res.status, package_count: active.reduce((sum: number, item: ServiceType) => sum + item.packages.filter(pkg => pkg.is_active).length, 0) });
                    }
                } else {
                    void trackEvent('service_load_result', { status: 'error', area: 'services', http_status: res.status, reason_code: 'http_error' });
                }
            } catch (error) {
                console.error('Failed to load services:', error);
                void trackEvent('service_load_result', { status: 'error', area: 'services', reason_code: 'network_error' });
            } finally {
                setServicesLoading(false);
            }
        };

        loadServices();

        // Load the public payment plan before the customer selects a package.
        const loadPaymentSettings = async () => {
            try {
                const res = await fetch('/api/settings/public');
                if (res.ok) {
                    const data = await res.json();
                    const settings = data?.settings || data || {};
                    const enabled = settings.split_payment_enabled === true || settings.split_payment_enabled === 'true';
                    const rawPercent = Number(settings.split_payment_deposit_percent);
                    const percent = Number.isFinite(rawPercent) ? Math.max(1, Math.min(99, rawPercent)) : 50;
                    setSplitPaymentInfo({ enabled, percent });
                    setPhotoFunnelConfig(parsePhotoFunnelConfig(settings.photo_funnel_config));
                }
            } catch (error) {
                console.error('Failed to load payment settings:', error);
            }
        };

        loadPaymentSettings();

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
            setAvailableSlots([]);
            setSelectedStart('');
            setAvailabilityError('');
            return;
        }

        const loadAvailability = async () => {
            setAvailabilityError('');
            setLoadingAvailability(true);
            try {
                const res = await fetch(
                    chosenPackage.source === 'drone_cms'
                        ? `/api/availability?dronePackageSlug=${encodeURIComponent(chosenPackage.slug || '')}&date=${slot.date}`
                        : `/api/availability?serviceId=${chosenPackage.service_id}&packageId=${chosenPackage.id}&date=${slot.date}`
                );
                if (res.ok) {
                    const data = await res.json();
                    const parsedSlots = Array.isArray(data.slots)
                        ? data.slots.filter((item: AvailabilitySlot) => item && typeof item.start === 'string' && typeof item.end === 'string')
                        : [];
                    setAvailableSlots(parsedSlots);
                    setSelectedStart('');
                    setSlot(prev => prev ? { date: prev.date } : null);
                    const availableCount = parsedSlots.filter((item: AvailabilitySlot) => item.available).length;
                    void trackEvent('availability_result', { status: 'ok', area: 'availability', http_status: res.status, available_count: availableCount, has_available_slots: availableCount > 0 });
                } else {
                    console.error('Failed to load availability:', res.status);
                    const errorPayload = await res.json().catch(() => null);
                    setAvailabilityError(typeof errorPayload?.error === 'string' ? errorPayload.error : 'Nie udało się sprawdzić dostępności. Wybierz inny termin.');
                    setAvailableSlots([]);
                    void trackEvent('availability_result', { status: 'error', area: 'availability', http_status: res.status, reason_code: 'http_error' });
                }
            } catch (error) {
                console.error('Failed to load availability:', error);
                setAvailabilityError('Nie udało się sprawdzić dostępności. Spróbuj ponownie.');
                setAvailableSlots([]);
                void trackEvent('availability_result', { status: 'error', area: 'availability', reason_code: 'network_error' });
            } finally {
                setLoadingAvailability(false);
            }
        };

        loadAvailability();
    }, [chosenPackage, slot?.date]);

    const bookableSlots = useMemo(
        () => availableSlots.filter(item => item.available),
        [availableSlots],
    );
    const selectedAvailabilitySlot = useMemo(
        () => bookableSlots.find(item => item.start === selectedStart) || null,
        [bookableSlots, selectedStart],
    );

    const selectedDroneAddon = useMemo(
        () => droneCatalog?.packages.find(item => item.slug === selectedDroneAddonSlug) || null,
        [droneCatalog, selectedDroneAddonSlug]
    );

    const eligibleDroneAddons = useMemo(
        () => (droneCatalog?.packages || []).filter(item =>
            item.active !== false &&
            (item.bookingMode === 'addon' || item.bookingMode === 'both') &&
            (item.eligibleServices || []).includes(service?.name || '')
        ),
        [droneCatalog, service?.name]
    );

    const hasDrone = service?.name === 'Dron' || Boolean(selectedDroneAddon);
    const needsVenue = Boolean(service && (hasDrone || ['Ślub', 'Przyjęcie', 'Urodziny'].includes(service.name)));

    const activePackages = useMemo(
        () => (service ? service.packages.filter(p => p.is_active) : []),
        [service]
    );

    useEffect(() => {
        activePackages.forEach(pkg => {
            if (!pkg.promotion || viewedPromotionIds.current.has(pkg.promotion.id)) return;
            viewedPromotionIds.current.add(pkg.promotion.id);
            void trackEvent('promotion_view', {
                promotion_id: pkg.promotion.id,
                package_id: pkg.id,
                service: service?.name,
                placement: 'booking',
            });
        });
    }, [activePackages, service?.name, trackEvent]);

    const finalPrice = useMemo(() => {
        if (!chosenPackage) return 0;
        let price = chosenPackage.price + (selectedDroneAddon?.price || 0) * 100;

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
    }, [chosenPackage, selectedDroneAddon, discount, giftCard]);

    const isReadyToSubmit = useMemo(
        () =>
            name &&
            email &&
            slot &&
            chosenPackage &&
            rodo &&
            Boolean(slot?.start && slot?.end) &&
            (!needsVenue || (venueCity && venuePlace)) &&
            (!hasDrone || (droneGoal && droneTermsAccepted)),
        [name, email, slot, chosenPackage, rodo, needsVenue, venueCity, venuePlace, hasDrone, droneGoal, droneTermsAccepted]
    );

    // Check promo code
    const handleCheckPromoCode = async () => {
        const normalizedCode = promoCode.trim().toUpperCase();
        if (!normalizedCode) return;
        if (chosenPackage?.promotion && !chosenPackage.promotion.allowPromoCode) {
            setDiscount(null);
            setCodeMessage('Ta promocja pakietu nie łączy się z kodami rabatowymi.');
            return;
        }

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
                    setCodeMessage(`Kod "${normalizedCode}" zastosowany!`);
                } else if (data.success && data.giftCard) {
                    setGiftCard({
                        code: normalizedCode,
                        amount: data.giftCard.amount
                    });
                    setCodeMessage(`Karta o wartości ${data.giftCard.amount} zł zastosowana!`);
                } else setCodeMessage("Kod nie znaleziony lub wygasł");
            } else {
                const data = await res.json().catch(() => null);
                setCodeMessage(typeof data?.message === 'string' ? data.message : "Kod nie znaleziony lub wygasł");
            }
        } catch (error) {
            setCodeMessage("Nie udało się sprawdzić kodu. Spróbuj ponownie.");
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
                    setGiftCardMessage(`Karta o wartości ${data.giftCard.amount} zł dodana!`);
                } else if (data.discount) {
                    setGiftCardMessage("To jest kod rabatowy, wpisz go powyżej");
                } else {
                    setGiftCardMessage("Karta nie znaleziona lub już użyta");
                }
            } else {
                setGiftCardMessage("Nieprawidłowy kod karty podarunkowej");
            }
        } catch (error) {
            setGiftCardMessage("Błąd połączenia");
        } finally {
            setCheckingGiftCard(false);
        }
    };

    const { addItem } = useCart();

    // Create booking and redirect to payment
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!e.currentTarget.checkValidity() || !isReadyToSubmit || !slot || !chosenPackage) {
            const fieldGroup = !service ? 'service'
                : !chosenPackage ? 'package'
                    : !slot || !slot.start || !slot.end ? 'date_time'
                        : !name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'contact'
                            : !rodo ? 'consent'
                                : 'venue';
            void trackEvent('booking_validation_failed', { status: 'failed', area: 'booking_form', reason_code: 'required_missing', field_group: fieldGroup });
            e.currentTarget.reportValidity();
            alert("Uzupełnij poprawnie wszystkie wymagane pola i wybierz termin!");
            return;
        }

        if (submissionLock.current) return;
        submissionLock.current = true;
        setSubmitting(true);

        try {
            const title = `${service?.name} — ${chosenPackage.name}${selectedDroneAddon ? ` + ${selectedDroneAddon.name}` : ''}`;
            const source = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('source') || 'booking' : 'booking';
            const attribution = readConsentedClientAttribution();
            const bookingData = {
                service: service?.name,
                package: chosenPackage.name,
                hours: chosenPackage.hours,
                price: finalPrice,
                originalPrice: (chosenPackage.regular_price ?? chosenPackage.price) + (selectedDroneAddon?.price || 0) * 100,
                package_promotion: chosenPackage.promotion || null,
                date: slot.date,
                start_time: slot.start ?? null,
                end_time: slot.end ?? null,
                end_day_offset: slot.endDayOffset ?? 0,
                name,
                email,
                phone: phone || null,
                venue_city: needsVenue ? venueCity : null,
                venue_place: needsVenue ? venuePlace : null,
                company_name: companyName || null,
                booking_package_source: chosenPackage.source || 'database',
                booking_source: source,
                drone_addon_slug: selectedDroneAddon?.slug || null,
                drone_goal: hasDrone ? droneGoal : null,
                drone_terms_accepted: hasDrone ? droneTermsAccepted : false,
                notes: notes || null,
                promo_code: discount ? discount.code : null,
                gift_card_code: giftCard ? giftCard.code : null,
                photographer_id: preselectedPhotographer?.id ?? null,
                photographer_name: preselectedPhotographer?.name ?? null,
                ...attribution,
            };

            trackBookingEvent('add_to_cart', {
                currency: 'PLN',
                value: finalPrice / 100,
                service: service?.name,
                package: chosenPackage.name,
            });
            void trackEvent('booking_start', {
                service_id: service?.id,
                package_id: chosenPackage.id,
                amount_grosze: finalPrice,
            });
            void trackEvent('booking_added_to_cart', { item_count: 1, amount_bucket: finalPrice < 50000 ? 'under_500' : finalPrice < 100000 ? '500_999' : '1000_plus' });

            addItem({
                type: 'booking',
                productId: chosenPackage.source === 'drone_cms' ? `drone:${chosenPackage.slug}` : chosenPackage.id.toString(),
                title,
                subtitle: `${slot.date}${slot.start ? ` o ${slot.start}` : ''}`,
                price: finalPrice,
                quantity: 1,
                metadata: bookingData
            });
        } finally {
            window.setTimeout(() => {
                submissionLock.current = false;
                setSubmitting(false);
            }, 750);
        }
    };

    if (servicesLoading) {
        return (
            <main className="min-h-screen bg-[#f4f1eb] py-20 px-4">
                <div className="text-center text-[#25221f]">
                    <p className="text-lg">Ładowanie usług...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f4f1eb]">
            {/* Dynamic Content from Page Builder */}
            {pageSections && pageSections.length > 0 && (
                <PageRenderer sections={pageSections} />
            )}

            <div className="py-20 px-4">
                <div className="max-w-4xl mx-auto pt-8">
                    <BookingFunnelIntro config={photoFunnelConfig} splitPaymentInfo={splitPaymentInfo} />

                    {/* NEW: Early Gift Card Input */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/80 rounded-2xl p-6 md:p-8 border border-[#b7aa99]/50 mb-8 overflow-hidden relative"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#8d7f6d]/5 blur-[50px] rounded-full -mr-16 -mt-16" />
                        <h2 className="text-2xl font-bold text-[#25221f] mb-4 flex items-center gap-2">
                            {photoFunnelConfig.bookingCopy.giftTitle}
                        </h2>
                        <p className="text-[#6b645c] mb-6 text-sm">
                            {photoFunnelConfig.bookingCopy.giftDescription}
                        </p>

                        <div className="flex flex-col md:flex-row gap-4">
                            <input
                                type="text"
                                value={giftCardCode}
                                onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                                disabled={!!giftCard}
                                className="flex-1 px-4 py-3 rounded-xl bg-[#ece7e0] border border-[#d2cabf] text-[#25221f] uppercase focus:ring-2 focus:ring-[#8d7f6d] outline-none disabled:opacity-50 text-lg tracking-widest font-mono"
                                placeholder={photoFunnelConfig.bookingCopy.giftPlaceholder}
                            />
                            {giftCard ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setGiftCard(null);
                                        setGiftCardCode("");
                                        setGiftCardMessage("");
                                    }}
                                    className="px-6 py-3 bg-red-900/40 text-red-200 border border-red-500/30 rounded-full font-semibold hover:bg-red-900/60 transition-colors flex items-center gap-2 justify-center"
                                >
                                    <span>{photoFunnelConfig.bookingCopy.giftRemoveLabel}</span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleCheckGiftCard}
                                    disabled={!giftCardCode || checkingGiftCard}
                                    className="px-8 py-3 bg-[#5b554e] text-white rounded-full font-semibold hover:bg-[#403b36] disabled:opacity-50 transition-all flex items-center gap-2 justify-center shadow-lg shadow-black/10"
                                >
                                    {checkingGiftCard ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        photoFunnelConfig.bookingCopy.giftApplyLabel
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
                                {giftCardMessage}
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

                    <form
                        id="booking-flow"
                        onSubmit={handleSubmit}
                        noValidate
                        onFocusCapture={() => markBookingFormStarted('first_choice')}
                        className="space-y-8 scroll-mt-24"
                    >
                        {preselectedPhotographer && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-r from-[#c9bfb2]/30 to-[#e7e0d7] border border-rose-400/40 rounded-2xl p-4 flex items-center gap-3"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8d7f6d] to-[#5b554e] flex items-center justify-center text-[#25221f] font-bold">
                                    {preselectedPhotographer.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <p className="text-[#25221f] font-bold">Wybrany fotograf: {preselectedPhotographer.name}</p>
                                    <p className="text-[#514b44] text-xs">Zostanie przypisany do tej rezerwacji.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPreselectedPhotographer(null)}
                                    className="text-[#514b44] hover:text-[#25221f] text-xs underline"
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
                            className="bg-white/80 rounded-2xl p-6 md:p-8 border border-[#ddd6cc]"
                        >
                            <h2 className="font-display text-3xl font-medium text-[#25221f] mb-6">{photoFunnelConfig.bookingCopy.serviceHeading}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {serviceTypes.map((svc) => (
                                    <button
                                        key={svc.id}
                                        type="button"
                                        onClick={() => {
                                            markBookingFormStarted('service', svc.name);
                                            setService(svc);
                                            setChosenPackage(null);
                                            setDiscount(null);
                                            setPromoCode('');
                                            setCodeMessage('');
                                            setSlot(null);
                                            setSelectedStart('');
                                            setSelectedDroneAddonSlug(null);
                                            setDroneGoal('');
                                            setDroneTermsAccepted(false);
                                            setSlot(null);
                                            const url = new URL(window.location.href);
                                            url.searchParams.set('service', svc.name);
                                            url.searchParams.delete('pakiet');
                                            url.searchParams.delete('dron');
                                            window.history.replaceState({}, '', url);
                                            trackBookingEvent('booking_service_select', { service: svc.name });
                                            void trackEvent('service_selected');
                                        }}
                                        className={`p-4 rounded-xl border transition-all text-left ${service?.id === svc.id
                                            ? "border-[#8d7f6d] bg-[#8d7f6d]/10"
                                            : "border-[#d2cabf] bg-[#f1ede7] hover:border-[#c6bdb1]"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <p className="font-bold text-[#25221f]">{svc.name}</p>
                                                <p className="text-sm text-[#6b645c]">{svc.description}</p>
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
                                className="bg-white/80 rounded-2xl p-6 md:p-8 border border-[#ddd6cc]"
                            >
                                <h2 className="font-display text-3xl font-medium text-[#25221f] mb-6">{photoFunnelConfig.bookingCopy.packageHeading}</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {activePackages.map((pkg) => (
                                        <button
                                            key={pkg.id}
                                            type="button"
                                            onClick={() => {
                                                markBookingFormStarted('package', service.name);
                                                setChosenPackage(pkg);
                                                if (pkg.promotion && !pkg.promotion.allowPromoCode) {
                                                    setDiscount(null);
                                                    setPromoCode('');
                                                    setCodeMessage('Promocja pakietu została zastosowana automatycznie i nie łączy się z kodami rabatowymi.');
                                                }
                                                setSelectedStart('');
                                                setSlot(current => current ? { date: current.date } : null);
                                                trackBookingEvent('booking_package_select', { service: service.name, package: pkg.name, value: pkg.price / 100, currency: 'PLN' });
                                                void trackEvent(pkg.promotion ? 'promotion_package_selected' : 'package_selected', {
                                                    promotion_id: pkg.promotion?.id,
                                                    package_id: pkg.id,
                                                    service: service.name,
                                                    placement: 'booking',
                                                    amount_bucket: pkg.price < 50000 ? 'under_500' : pkg.price < 100000 ? '500_999' : '1000_plus',
                                                });
                                            }}
                                            className={`p-5 rounded-2xl border transition-all text-left flex flex-col h-full ${chosenPackage?.id === pkg.id
                                                ? "border-[#8d7f6d] bg-[#8d7f6d]/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                                                : "border-[#ddd6cc] bg-white/75 hover:border-[#d2cabf] hover:bg-[#f1ede7]"
                                                }`}
                                        >
                                            <div className="min-h-[5.5rem] flex flex-col">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-bold text-[#25221f] leading-tight">{pkg.name}</h3>
                                                </div>
                                                {pkg.subtitle && (
                                                    <p className="text-sm text-[#6b645c] mb-2 leading-snug line-clamp-2">
                                                        {pkg.subtitle}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="mb-4 space-y-3">
                                                <span className="inline-flex text-sm bg-[#8d7f6d]/10 px-2 py-0.5 rounded border border-[#b7aa99]/50 text-[#766958] font-extrabold">{pkg.hours}h</span>
                                                {pkg.promotion ? (
                                                    <PromotionPriceBlock promotion={pkg.promotion} variant="booking" />
                                                ) : (
                                                    <div className="text-xl text-[#766958] font-extrabold">
                                                        {pkg.pricePrefix && `${pkg.pricePrefix} `}{(pkg.price / 100).toFixed(2)} zł
                                                    </div>
                                                )}
                                            </div>

                                            {pkg.description && (
                                                <div
                                                    className="text-[13px] text-[#6b645c] mt-2 prose prose-sm prose-p:my-0 prose-ul:my-2 prose-li:my-1 opacity-90"
                                                    dangerouslySetInnerHTML={{ __html: pkg.description }}
                                                />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {service.name !== 'Dron' && eligibleDroneAddons.length > 0 && (
                                    <div className="mt-8 border-t border-[#ddd6cc] pt-7">
                                        <div className="mb-4">
                                            <h3 className="text-xl font-bold text-[#25221f]">Dodaj zdjęcia i film z drona</h3>
                                            <p className="mt-1 text-sm text-[#6b645c]">Dron jest częścią tej samej rezerwacji, terminu i płatności.</p>
                                        </div>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedDroneAddonSlug(null)}
                                                className={`rounded-xl border p-4 text-left ${!selectedDroneAddonSlug ? 'border-[#8d7f6d] bg-[#8d7f6d]/10' : 'border-[#ddd6cc] bg-white'}`}
                                            >
                                                <span className="font-bold text-[#25221f]">Bez drona</span>
                                                <span className="mt-1 block text-sm text-[#6b645c]">Pozostaw wybrany pakiet bez dodatku.</span>
                                            </button>
                                            {eligibleDroneAddons.map(item => (
                                                <button
                                                    key={item.slug}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedDroneAddonSlug(item.slug);
                                                        trackBookingEvent('drone_addon_selected', { service: service.name, package: item.name, value: item.price });
                                                    }}
                                                    className={`rounded-xl border p-4 text-left ${selectedDroneAddonSlug === item.slug ? 'border-[#8d7f6d] bg-[#8d7f6d]/10' : 'border-[#ddd6cc] bg-white'}`}
                                                >
                                                    <span className="flex justify-between gap-3 font-bold text-[#25221f]"><span>{item.name}</span><span>+{item.price} zł</span></span>
                                                    <span className="mt-1 block text-sm leading-6 text-[#6b645c]">{item.summary}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.section>
                        )}

                        {/* Step 3: Date & Time Selection - Visible immediately after Service is present */}
                        {service && (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="bg-white/80 rounded-2xl p-6 md:p-8 border border-[#ddd6cc]"
                            >
                                <h2 className="text-2xl font-bold text-[#25221f] mb-6">{photoFunnelConfig.bookingCopy.dateHeading}</h2>

                                {/* Calendar */}
                                <div className="mb-8">
                                    <h3 className="text-lg font-bold text-[#25221f] mb-4">{photoFunnelConfig.bookingCopy.dayHeading}</h3>
                                    <BookingCalendar
                                        onSlotSelect={(selected: { date: string; start?: string; end?: string } | null) => {
                                            markBookingFormStarted('date', service?.name);
                                            setSlot(selected);
                                            if (selected?.date) trackBookingEvent('booking_date_select', { service: service?.name, package: chosenPackage?.name, date: selected.date });
                                            if (selected?.date) void trackEvent('date_selected');
                                        }}
                                        selectedSlot={slot}
                                        service={(service?.name as "Sesja" | "Ślub" | "Przyjęcie" | "Urodziny" | "Dron") || 'Sesja'}
                                        durationHours={chosenPackage?.hours || 1}
                                        blocksEntireDay={chosenPackage?.blocks_entire_day === true}
                                        showTimeSlots={false}
                                    />
                                </div>

                                {/* Hour Selection - shown after date is selected */}
                                {slot?.date && (
                                    <div className="mt-8 pt-8 border-t border-[#d2cabf]">
                                        <h3 className="text-xl font-bold text-[#25221f] mb-4">
                                            {!chosenPackage
                                                ? photoFunnelConfig.bookingCopy.choosePackageHoursHeading
                                                : loadingAvailability
                                                    ? photoFunnelConfig.bookingCopy.loadingHoursHeading
                                                    : photoFunnelConfig.bookingCopy.chooseHourHeading}
                                        </h3>

                                        {!chosenPackage ? (
                                            <div className="text-center text-[#766958] py-8 border border-dashed border-[#d2cabf] rounded-xl bg-white/80">
                                                <p className="mb-2">{photoFunnelConfig.bookingCopy.choosePackageLead}</p>
                                                <p className="text-sm text-[#6b645c]">{photoFunnelConfig.bookingCopy.choosePackageHelp}</p>
                                            </div>
                                        ) : availabilityError ? (
                                            <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-center text-amber-900">
                                                {availabilityError}
                                            </div>
                                        ) : loadingAvailability ? (
                                            <div className="text-center text-[#6b645c]">
                                                <p>{photoFunnelConfig.bookingCopy.availabilityLoading}</p>
                                            </div>
                                        ) : bookableSlots.length === 0 ? (
                                            <div className="rounded-xl border border-[#d2cabf] bg-[#f8f5f0] p-6 text-center text-[#766958]">
                                                <p>{photoFunnelConfig.bookingCopy.noHours}</p>
                                            </div>
                                        ) : (
                                            <div className="rounded-2xl border border-[#d2cabf] bg-[#f8f5f0] p-5 md:p-6">
                                                <label htmlFor="booking-start-time" className="mb-2 block text-sm font-semibold text-[#4d463e]">
                                                    {photoFunnelConfig.bookingCopy.startTimeLabel}
                                                </label>
                                                <select
                                                    id="booking-start-time"
                                                    value={selectedStart}
                                                    onChange={event => {
                                                        const selected = bookableSlots.find(item => item.start === event.target.value);
                                                        setSelectedStart(event.target.value);
                                                        setSlot(prev => prev && selected
                                                            ? {
                                                                ...prev,
                                                                start: selected.start,
                                                                end: selected.end,
                                                                endDayOffset: selected.endDayOffset,
                                                            }
                                                            : prev ? { date: prev.date } : null);
                                                        if (selected) void trackEvent('time_selected');
                                                    }}
                                                    className="min-h-12 w-full rounded-xl border border-[#b9ae9f] bg-white px-4 py-3 text-base font-medium text-[#25221f] outline-none transition focus:border-[#8d7f6d] focus:ring-2 focus:ring-[#8d7f6d]/20"
                                                >
                                                    <option value="">{photoFunnelConfig.bookingCopy.startTimePlaceholder}</option>
                                                    {bookableSlots.map(item => (
                                                        <option key={`${item.start}-${item.endDayOffset}`} value={item.start}>
                                                            {formatPhotoFunnelTemplate(photoFunnelConfig.bookingCopy.slotOptionTemplate, {
                                                                start: item.start,
                                                                end: item.end,
                                                                nextDay: item.endDayOffset === 1 ? ` ${photoFunnelConfig.bookingCopy.nextDayLabel}` : '',
                                                            })}
                                                        </option>
                                                    ))}
                                                </select>

                                                {selectedAvailabilitySlot && (
                                                    <div className="mt-4 rounded-xl border border-[#a99b89]/60 bg-white p-4" aria-live="polite">
                                                        <p className="font-semibold text-[#25221f]">
                                                            {selectedAvailabilitySlot.start}–{selectedAvailabilitySlot.end}
                                                            {selectedAvailabilitySlot.endDayOffset === 1 ? ` ${photoFunnelConfig.bookingCopy.nextDayLabel}` : ''}
                                                        </p>
                                                        <p className="mt-1 text-sm leading-6 text-[#6b645c]">
                                                            {formatPhotoFunnelTemplate(photoFunnelConfig.bookingCopy.slotDurationTemplate, {
                                                                duration: formatDurationLabel(chosenPackage.hours),
                                                            })}
                                                        </p>
                                                    </div>
                                                )}
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
                                className="bg-white/80 rounded-2xl p-6 md:p-8 border border-[#ddd6cc]"
                            >
                                <h2 className="text-2xl font-bold text-[#25221f] mb-6">{photoFunnelConfig.bookingCopy.detailsHeading}</h2>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-[#514b44] mb-2">
                                                Imię i nazwisko *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg bg-[#ece7e0] border border-[#d2cabf] text-[#25221f] focus:ring-2 focus:ring-[#8d7f6d] outline-none"
                                                placeholder="Jan Kowalski"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[#514b44] mb-2">
                                                Email *
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg bg-[#ece7e0] border border-[#d2cabf] text-[#25221f] focus:ring-2 focus:ring-[#8d7f6d] outline-none"
                                                placeholder="jan@example.com"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-[#514b44] mb-2">
                                            Telefon
                                        </label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg bg-[#ece7e0] border border-[#d2cabf] text-[#25221f] focus:ring-2 focus:ring-[#8d7f6d] outline-none"
                                            placeholder="+48 123 456 789"
                                        />
                                    </div>

                                    {hasDrone && service?.name === 'Dron' && (
                                        <div>
                                            <label className="block text-sm font-medium text-[#514b44] mb-2">Firma (opcjonalnie)</label>
                                            <input
                                                type="text"
                                                value={companyName}
                                                onChange={(e) => setCompanyName(e.target.value.slice(0, 120))}
                                                maxLength={120}
                                                className="w-full px-4 py-2 rounded-lg bg-[#ece7e0] border border-[#d2cabf] text-[#25221f] focus:ring-2 focus:ring-[#8d7f6d] outline-none"
                                                placeholder="Nazwa firmy"
                                            />
                                        </div>
                                    )}

                                    {needsVenue && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[#514b44] mb-2">
                                                    Miasto *
                                                </label>
                                                <input
                                                    type="text"
                                                    required={!!needsVenue}
                                                    value={venueCity}
                                                    onChange={(e) => setVenueCity(e.target.value)}
                                                    className="w-full px-4 py-2 rounded-lg bg-[#ece7e0] border border-[#d2cabf] text-[#25221f] focus:ring-2 focus:ring-[#8d7f6d] outline-none"
                                                    placeholder="Toruń"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#514b44] mb-2">
                                                    Miejsce *
                                                </label>
                                                <input
                                                    type="text"
                                                    required={!!needsVenue}
                                                    value={venuePlace}
                                                    onChange={(e) => setVenuePlace(e.target.value)}
                                                    className="w-full px-4 py-2 rounded-lg bg-[#ece7e0] border border-[#d2cabf] text-[#25221f] focus:ring-2 focus:ring-[#8d7f6d] outline-none"
                                                    placeholder="Pałac Dąbrowski"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {hasDrone && (
                                        <div>
                                            <label className="block text-sm font-medium text-[#514b44] mb-2">
                                                {droneCatalog?.booking.goalLabel || 'Główne zadanie materiału'} *
                                            </label>
                                            <select
                                                required
                                                value={droneGoal}
                                                onChange={(e) => setDroneGoal(e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg bg-[#ece7e0] border border-[#d2cabf] text-[#25221f] focus:ring-2 focus:ring-[#8d7f6d] outline-none"
                                            >
                                                <option value="">Wybierz</option>
                                                {(droneCatalog?.booking.goalOptions || []).map(option => <option key={option} value={option}>{option}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-[#514b44] mb-2">
                                            Uwagi (opcjonalnie)
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                                            className="w-full px-4 py-2 rounded-lg bg-[#ece7e0] border border-[#d2cabf] text-[#25221f] focus:ring-2 focus:ring-[#8d7f6d] outline-none"
                                            maxLength={500}
                                            placeholder="Napisz krótko, kto będzie na zdjęciach i na czym najbardziej Wam zależy."
                                        />
                                    </div>

                                    {/* Promo Code */}
                                    <div>
                                        <label className="block text-sm font-medium text-[#514b44] mb-2">
                                            Kod promocyjny
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={promoCode}
                                                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                                disabled={!!discount}
                                                className="flex-1 px-4 py-2 rounded-lg bg-[#ece7e0] border border-[#d2cabf] text-[#25221f] uppercase focus:ring-2 focus:ring-[#8d7f6d] outline-none disabled:opacity-50"
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
                                                    className="px-6 py-2 bg-[#ece7e0] text-[#25221f] rounded-lg font-medium hover:bg-white disabled:opacity-50"
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

                                    {chosenPackage && (
                                        <div className="space-y-2 border-t border-[#ddd6cc] pt-4 text-sm text-[#514b44]">
                                            <div className="flex justify-between gap-4"><span>{chosenPackage.name}</span><span>{(chosenPackage.price / 100).toFixed(2)} zł</span></div>
                                            {selectedDroneAddon && <div className="flex justify-between gap-4"><span>{selectedDroneAddon.name}</span><span>+{selectedDroneAddon.price.toFixed(2)} zł</span></div>}
                                        </div>
                                    )}

                                    {/* Final Price */}
                                    <div className="flex justify-between text-2xl font-bold text-[#25221f] pt-4 border-t border-[#ddd6cc]">
                                        <span>{photoFunnelConfig.bookingCopy.bookingValueLabel}</span>
                                        <span>{(finalPrice / 100).toFixed(2)} zł</span>
                                    </div>
                                    {splitPaymentInfo?.enabled && finalPrice > 0 && (
                                        <div className="rounded-xl border border-[#c9b78f] bg-[#fffaf0] p-4 text-sm leading-relaxed text-[#514b44]">
                                            {formatPhotoFunnelTemplate(photoFunnelConfig.bookingCopy.splitSummaryTemplate, {
                                                percent: splitPaymentInfo.percent,
                                                amount: (Math.round(finalPrice * splitPaymentInfo.percent / 100) / 100).toFixed(2),
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* RODO */}
                                {hasDrone && (
                                    <label className="flex items-start gap-3 cursor-pointer group mt-6 rounded-xl border border-[#d2cabf] bg-[#f4f1eb] p-4">
                                        <input
                                            type="checkbox"
                                            checked={droneTermsAccepted}
                                            onChange={(e) => setDroneTermsAccepted(e.target.checked)}
                                            required
                                            className="mt-1 w-4 h-4 rounded border-[#c6bdb1] bg-[#ece7e0] text-[#6e6252] focus:ring-[#8d7f6d]"
                                        />
                                        <span className="text-sm leading-6 text-[#514b44]">
                                            Rozumiem, że lot zostanie wykonany po sprawdzeniu miejsca, aktualnych stref i pogody. Jeśli bezpieczny i zgodny z przepisami lot nie będzie możliwy, ustalimy nowy termin albo zwrot za dodatek dronowy. *
                                        </span>
                                    </label>
                                )}
                                <label className="flex items-start gap-3 cursor-pointer group mt-6">
                                    <input
                                        type="checkbox"
                                        checked={rodo}
                                        onChange={(e) => setRodo(e.target.checked)}
                                        required
                                        className="mt-1 w-4 h-4 rounded border-[#c6bdb1] bg-[#ece7e0] text-[#6e6252] focus:ring-[#8d7f6d]"
                                    />
                                    <span className="text-sm text-[#6b645c] group-hover:text-[#514b44] transition-colors">
                                        Zgadzam się na przetwarzanie danych osobowych (RODO) w celu realizacji usługi. *
                                    </span>
                                </label>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className={`w-full mt-6 py-4 rounded-full font-semibold text-lg transition-all shadow-lg ${isReadyToSubmit
                                        ? "bg-[#5b554e] text-white hover:bg-[#403b36] shadow-black/10"
                                        : "bg-[#ece7e0] text-[#5f5851] hover:bg-[#e2dcd3]"
                                        } group flex items-center justify-center gap-2`}
                                >
                                    <ShoppingBag className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                    <span>{isReadyToSubmit ? photoFunnelConfig.bookingCopy.submitReadyLabel : photoFunnelConfig.bookingCopy.submitIncompleteLabel}</span>
                                </button>
                            </motion.section>
                        )}
                    </form>

                    <div className="mt-20 border-t border-[#ddd6cc] pt-16">
                        <h2 className="text-2xl font-bold text-[#25221f] text-center mb-8">{photoFunnelConfig.bookingCopy.testimonialsHeading}</h2>
                        <TestimonialsSection />
                    </div>

                </div>
            </div>
        </main>
    );
}
