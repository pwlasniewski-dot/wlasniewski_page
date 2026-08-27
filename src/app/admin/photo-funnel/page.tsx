'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, RotateCcw, Save, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    DEFAULT_PHOTO_FUNNEL_CONFIG,
    PHOTO_FUNNEL_COPY_LIMITS,
    PHOTO_FUNNEL_BOOKING_COPY_LIMITS,
    PHOTO_FUNNEL_GALLERY_COPY_LIMITS,
    PHOTO_FUNNEL_SETTING_KEY,
    parsePhotoFunnelConfig,
    serializePhotoFunnelConfig,
    validatePhotoFunnelConfig,
    type PhotoFunnelConfig,
} from '@/lib/marketing/photo-funnel';

type CopyKey = keyof PhotoFunnelConfig['copy'];
type BookingCopyKey = keyof PhotoFunnelConfig['bookingCopy'];
type GalleryCopyKey = keyof PhotoFunnelConfig['galleryCopy'];
type BooleanDisplayKey = {
    [Key in keyof PhotoFunnelConfig['display']]: PhotoFunnelConfig['display'][Key] extends boolean ? Key : never
}[keyof PhotoFunnelConfig['display']];

const CTA_FIELDS: Array<[CopyKey, string]> = [
    ['inquiryCtaLabel', 'Główne CTA zapytania'],
    ['packageBookingCtaLabel', 'CTA rezerwacji na pakiecie'],
    ['packageInquiryCtaLabel', 'CTA zapytania na pakiecie'],
];

const SECTION_FIELDS: Array<[CopyKey, string]> = [
    ['serviceEyebrow', 'Nadtytuł na stronie usługi'],
    ['serviceTitle', 'Nagłówek na stronie usługi'],
    ['serviceDescription', 'Opis na stronie usługi'],
    ['cityTitleTemplate', 'Nagłówek na stronie miasta ({city}, {cityIn})'],
    ['cityDescription', 'Opis na stronie miasta'],
    ['reviewsHeading', 'Nagłówek opinii'],
    ['reviewsCtaLabel', 'CTA opinii Google'],
    ['emptyPortfolioTextTemplate', 'Tekst bez opinii ({count})'],
    ['portfolioCtaLabel', 'CTA portfolio'],
];

const FORM_FIELDS: Array<[CopyKey, string]> = [
    ['nameLabel', 'Etykieta imienia'],
    ['namePlaceholder', 'Placeholder imienia'],
    ['serviceLabel', 'Etykieta usługi'],
    ['cityLabel', 'Etykieta miasta'],
    ['cityPlaceholder', 'Placeholder miasta'],
    ['dateLabel', 'Etykieta terminu'],
    ['optionalLabel', 'Dopisek „opcjonalnie”'],
    ['phoneLabel', 'Etykieta telefonu'],
    ['phoneHint', 'Dopisek telefonu'],
    ['phonePlaceholder', 'Placeholder telefonu'],
    ['emailLabel', 'Etykieta email'],
    ['emailHint', 'Dopisek email'],
    ['emailPlaceholder', 'Placeholder email'],
    ['messageLabel', 'Etykieta wiadomości'],
    ['messagePlaceholder', 'Placeholder wiadomości'],
    ['privacyHelper', 'Wyjaśnienie pod formularzem'],
    ['sendingLabel', 'Stan wysyłania'],
    ['successButtonLabel', 'Stan sukcesu na przycisku'],
    ['retryLabel', 'Stan błędu na przycisku'],
    ['successMessage', 'Komunikat po zapisie'],
    ['directContactPrompt', 'Tekst kontaktu bezpośredniego'],
    ['phoneDisplay', 'Numer wyświetlany'],
    ['whatsappLabel', 'Etykieta WhatsApp'],
];

const BOOKING_FIELDS: Array<[BookingCopyKey, string]> = [
    ['heroTitle', 'Główny nagłówek rezerwacji'],
    ['heroDescription', 'Opis procesu rezerwacji'],
    ['stepService', 'Krok 1'],
    ['stepDate', 'Krok 2'],
    ['stepPayment', 'Krok 3'],
    ['paymentLead', 'Wyróżniona informacja o płatności'],
    ['paymentSplitTemplate', 'Opis zaliczki ({percent})'],
    ['paymentFull', 'Opis płatności pełnej'],
    ['giftTitle', 'Nagłówek karty podarunkowej'],
    ['giftDescription', 'Opis karty podarunkowej'],
    ['giftPlaceholder', 'Placeholder kodu karty'],
    ['giftRemoveLabel', 'Przycisk usunięcia karty'],
    ['giftApplyLabel', 'Przycisk zastosowania karty'],
    ['serviceHeading', 'Nagłówek wyboru usługi'],
    ['packageHeading', 'Nagłówek wyboru pakietu'],
    ['dateHeading', 'Nagłówek terminu'],
    ['dayHeading', 'Nagłówek kalendarza'],
    ['choosePackageHoursHeading', 'Godziny bez wybranego pakietu'],
    ['loadingHoursHeading', 'Nagłówek ładowania godzin'],
    ['chooseHourHeading', 'Nagłówek wyboru godziny'],
    ['choosePackageLead', 'Komunikat wyboru pakietu — linia 1'],
    ['choosePackageHelp', 'Komunikat wyboru pakietu — linia 2'],
    ['availabilityLoading', 'Komunikat sprawdzania dostępności'],
    ['fullDayAvailableTitle', 'Dostępny dzień — tytuł'],
    ['fullDayAvailableText', 'Dostępny dzień — opis'],
    ['fullDayUnavailableTitle', 'Zajęty dzień — tytuł'],
    ['fullDayUnavailableText', 'Zajęty dzień — opis'],
    ['noHours', 'Brak wolnych godzin'],
    ['detailsHeading', 'Nagłówek danych klienta'],
    ['bookingValueLabel', 'Etykieta wartości rezerwacji'],
    ['splitSummaryTemplate', 'Podsumowanie zaliczki ({percent}, {amount})'],
    ['submitReadyLabel', 'Aktywny przycisk podsumowania'],
    ['submitIncompleteLabel', 'Niekompletna rezerwacja — przycisk'],
    ['testimonialsHeading', 'Nagłówek opinii pod rezerwacją'],
];

const GALLERY_FIELDS: Array<[GalleryCopyKey, string]> = [
    ['topBadge', 'Pasek galerii — etykieta'],
    ['topOfferAvailable', 'Pasek — aktywna korzyść'],
    ['topNoOffer', 'Pasek — brak korzyści'],
    ['copyLabel', 'Przycisk kopiowania'],
    ['copiedLabel', 'Przycisk po skopiowaniu'],
    ['copySuccessTemplate', 'Toast skopiowanego kodu ({code})'],
    ['copyFailure', 'Błąd kopiowania'],
    ['loyaltyEyebrow', 'Korzyść — nadtytuł'],
    ['loyaltyTitleTemplate', 'Korzyść — tytuł z imieniem ({name})'],
    ['loyaltyFallbackTitle', 'Korzyść — tytuł bez imienia'],
    ['loyaltyDescription', 'Korzyść — opis'],
    ['promoLabelTemplate', 'Etykieta kodu ({discount})'],
    ['expiryTemplate', 'Termin ważności ({date})'],
    ['offerCtaLabel', 'CTA ofert'],
    ['noOfferTitleTemplate', 'Brak promocji — tytuł z imieniem ({name})'],
    ['noOfferFallbackTitle', 'Brak promocji — tytuł bez imienia'],
    ['noOfferDescription', 'Brak promocji — opis'],
    ['reviewTitle', 'Prośba o opinię — tytuł'],
    ['reviewDescription', 'Prośba o opinię — opis'],
    ['googleTitle', 'Karta Google — tytuł'],
    ['googleDescription', 'Karta Google — opis'],
    ['googleCtaLabel', 'Karta Google — CTA'],
    ['reviewThankYou', 'Podziękowanie po kliknięciu'],
    ['shareTitle', 'Polecenie — tytuł'],
    ['shareDescription', 'Polecenie — opis'],
    ['shareCtaLabel', 'Polecenie — CTA'],
    ['shareText', 'Tekst udostępnienia'],
    ['shareDialogTitle', 'Tytuł systemowego udostępnienia'],
    ['shareSuccess', 'Toast udostępnienia'],
    ['shareCopied', 'Toast skopiowanego linku'],
    ['reviewFooter', 'Stopka prośby o opinię'],
];

function copyFieldIsLong(key: CopyKey) {
    return ['serviceDescription', 'cityDescription', 'messagePlaceholder', 'privacyHelper', 'successMessage'].includes(key);
}

const LONG_BOOKING_FIELDS: BookingCopyKey[] = [
    'heroDescription', 'paymentSplitTemplate', 'paymentFull', 'giftDescription', 'choosePackageHelp',
    'fullDayAvailableText', 'fullDayUnavailableText', 'splitSummaryTemplate',
];

const LONG_GALLERY_FIELDS: GalleryCopyKey[] = [
    'topNoOffer', 'loyaltyDescription', 'noOfferDescription', 'reviewDescription', 'googleDescription',
    'shareDescription', 'shareText', 'reviewFooter',
];

export default function PhotoFunnelAdminPage() {
    const [config, setConfig] = useState<PhotoFunnelConfig>(() => parsePhotoFunnelConfig(DEFAULT_PHOTO_FUNNEL_CONFIG));
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadConfig = useCallback(async (showConfirmation = false) => {
        const token = localStorage.getItem('admin_token');
        const response = await fetch('/api/settings', {
            cache: 'no-store',
            headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success) throw new Error(result?.error || 'Nie udało się pobrać konfiguracji');
        setConfig(parsePhotoFunnelConfig(result.settings?.[PHOTO_FUNNEL_SETTING_KEY]));
        if (showConfirmation) toast.success('Zapis potwierdzony ponownym odczytem');
    }, []);

    useEffect(() => {
        void loadConfig()
            .catch((error) => toast.error(error instanceof Error ? error.message : 'Błąd odczytu'))
            .finally(() => setLoading(false));
    }, [loadConfig]);

    const updateCopy = (key: CopyKey, value: string) => {
        setConfig(current => ({ ...current, copy: { ...current.copy, [key]: value } }));
    };

    const updateBookingCopy = (key: BookingCopyKey, value: string) => {
        setConfig(current => ({ ...current, bookingCopy: { ...current.bookingCopy, [key]: value } }));
    };

    const updateGalleryCopy = (key: GalleryCopyKey, value: string) => {
        setConfig(current => ({ ...current, galleryCopy: { ...current.galleryCopy, [key]: value } }));
    };

    const save = async () => {
        const validation = validatePhotoFunnelConfig(config);
        if (!validation.success) {
            toast.error(validation.errors[0]);
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ [PHOTO_FUNNEL_SETTING_KEY]: serializePhotoFunnelConfig(validation.data) }),
            });
            const result = await response.json().catch(() => null);
            if (!response.ok || !result?.success) {
                throw new Error(result?.details?.[0] || result?.error || 'Nie udało się zapisać konfiguracji');
            }
            await loadConfig(true);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Błąd zapisu');
        } finally {
            setSaving(false);
        }
    };

    const reset = () => {
        if (!window.confirm('Przywrócić bezpieczne teksty startowe? Zmiana zostanie zapisana dopiero po kliknięciu „Zapisz”.')) return;
        setConfig(parsePhotoFunnelConfig(DEFAULT_PHOTO_FUNNEL_CONFIG));
    };

    const toggleDisplay = (key: BooleanDisplayKey) => {
        setConfig(current => ({
            ...current,
            display: {
                ...current.display,
                [key]: !current.display[key],
            },
        }));
    };

    const moveService = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= config.serviceOptions.length) return;
        setConfig(current => {
            const options = [...current.serviceOptions];
            [options[index], options[target]] = [options[target], options[index]];
            return {
                ...current,
                serviceOptions: options.map((option, position) => ({ ...option, position })),
            };
        });
    };

    const moveGalleryOffer = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= config.galleryOffers.length) return;
        setConfig(current => {
            const options = [...current.galleryOffers];
            [options[index], options[target]] = [options[target], options[index]];
            return {
                ...current,
                galleryOffers: options.map((option, position) => ({ ...option, position })),
            };
        });
    };

    const renderCopyFields = (fields: Array<[CopyKey, string]>) => (
        <div className="grid gap-4 md:grid-cols-2">
            {fields.map(([key, label]) => (
                <label key={key} className={copyFieldIsLong(key) ? 'md:col-span-2' : ''}>
                    <span className="mb-1.5 block text-sm font-medium text-zinc-300">{label}</span>
                    {copyFieldIsLong(key) ? (
                        <textarea
                            rows={3}
                            maxLength={PHOTO_FUNNEL_COPY_LIMITS[key]}
                            value={config.copy[key]}
                            onChange={event => updateCopy(key, event.target.value)}
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-white focus:border-gold-400 focus:outline-none"
                        />
                    ) : (
                        <input
                            maxLength={PHOTO_FUNNEL_COPY_LIMITS[key]}
                            value={config.copy[key]}
                            onChange={event => updateCopy(key, event.target.value)}
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-white focus:border-gold-400 focus:outline-none"
                        />
                    )}
                    <span className="mt-1 block text-right text-xs text-zinc-600">{config.copy[key].length}/{PHOTO_FUNNEL_COPY_LIMITS[key]}</span>
                </label>
            ))}
        </div>
    );

    const renderBookingFields = () => (
        <div className="grid gap-4 md:grid-cols-2">
            {BOOKING_FIELDS.map(([key, label]) => {
                const isLong = LONG_BOOKING_FIELDS.includes(key);
                return (
                    <label key={key} className={isLong ? 'md:col-span-2' : ''}>
                        <span className="mb-1.5 block text-sm font-medium text-zinc-300">{label}</span>
                        {isLong ? (
                            <textarea rows={3} maxLength={PHOTO_FUNNEL_BOOKING_COPY_LIMITS[key]} value={config.bookingCopy[key]} onChange={event => updateBookingCopy(key, event.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-white focus:border-gold-400 focus:outline-none" />
                        ) : (
                            <input maxLength={PHOTO_FUNNEL_BOOKING_COPY_LIMITS[key]} value={config.bookingCopy[key]} onChange={event => updateBookingCopy(key, event.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-white focus:border-gold-400 focus:outline-none" />
                        )}
                        <span className="mt-1 block text-right text-xs text-zinc-600">{config.bookingCopy[key].length}/{PHOTO_FUNNEL_BOOKING_COPY_LIMITS[key]}</span>
                    </label>
                );
            })}
        </div>
    );

    const renderGalleryFields = () => (
        <div className="grid gap-4 md:grid-cols-2">
            {GALLERY_FIELDS.map(([key, label]) => {
                const isLong = LONG_GALLERY_FIELDS.includes(key);
                return (
                    <label key={key} className={isLong ? 'md:col-span-2' : ''}>
                        <span className="mb-1.5 block text-sm font-medium text-zinc-300">{label}</span>
                        {isLong ? (
                            <textarea rows={3} maxLength={PHOTO_FUNNEL_GALLERY_COPY_LIMITS[key]} value={config.galleryCopy[key]} onChange={event => updateGalleryCopy(key, event.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-white focus:border-gold-400 focus:outline-none" />
                        ) : (
                            <input maxLength={PHOTO_FUNNEL_GALLERY_COPY_LIMITS[key]} value={config.galleryCopy[key]} onChange={event => updateGalleryCopy(key, event.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-white focus:border-gold-400 focus:outline-none" />
                        )}
                        <span className="mt-1 block text-right text-xs text-zinc-600">{config.galleryCopy[key].length}/{PHOTO_FUNNEL_GALLERY_COPY_LIMITS[key]}</span>
                    </label>
                );
            })}
        </div>
    );

    if (loading) return <div className="p-8 text-white">Ładowanie konfiguracji lejka…</div>;

    return (
        <div className="max-w-7xl pb-24 text-white">
            <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div>
                    <h1 className="text-3xl font-semibold">Lejek zapytań i rezerwacji</h1>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
                        Jedno źródło treści dla stron usługowych i miejskich. Rezerwacja pozostaje głównym CTA, a formularz zapytania jest ścieżką bez płatności.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={reset} className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm hover:border-zinc-500">
                        <RotateCcw className="h-4 w-4" /> Domyślne
                    </button>
                    <button disabled={saving} onClick={save} className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-gold-400 disabled:opacity-50">
                        <Save className="h-4 w-4" /> {saving ? 'Zapisywanie…' : 'Zapisz i sprawdź'}
                    </button>
                </div>
            </div>

            <div className="grid gap-7 xl:grid-cols-[1fr_360px]">
                <div className="space-y-7">
                    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                        <h2 className="mb-5 text-lg font-semibold">Widoczność i kolejność</h2>
                        <div className="grid gap-3 md:grid-cols-2">
                            {([
                                ['cityModuleEnabled', 'Formularz na stronach miast'],
                                ['serviceModuleEnabled', 'Formularz na stronach usług'],
                                ['showHeroInquiryCta', 'CTA zapytania w hero'],
                                ['showOfferInquiryCta', 'CTA zapytania przy ofercie'],
                                ['showPackageInquiryCta', 'CTA zapytania na pakietach'],
                                ['showClosingInquiryCta', 'CTA zapytania na końcu miasta'],
                                ['galleryTopNudgeEnabled', 'Pasek korzyści nad galerią'],
                                ['galleryLoyaltyEnabled', 'Oferty ponownej rezerwacji w galerii'],
                                ['galleryReviewEnabled', 'Neutralna prośba o opinię'],
                                ['galleryShareEnabled', 'Karta polecenia znajomym'],
                            ] as Array<[BooleanDisplayKey, string]>).map(([key, label]) => (
                                <label key={key} className="flex min-h-12 items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm">
                                    <input type="checkbox" checked={Boolean(config.display[key])} onChange={() => toggleDisplay(key)} className="h-4 w-4 accent-amber-400" />
                                    {label}
                                </label>
                            ))}
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <label>
                                <span className="mb-1.5 block text-sm text-zinc-300">Pozycja na stronie usługi</span>
                                <select value={config.display.servicePosition} onChange={event => setConfig(current => ({ ...current, display: { ...current.display, servicePosition: event.target.value as PhotoFunnelConfig['display']['servicePosition'] } }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5">
                                    <option value="before_packages">Przed pakietami</option>
                                    <option value="after_packages">Po pakietach</option>
                                </select>
                            </label>
                            <label>
                                <span className="mb-1.5 block text-sm text-zinc-300">Pozycja na stronie miasta</span>
                                <select value={config.display.cityPosition} onChange={event => setConfig(current => ({ ...current, display: { ...current.display, cityPosition: event.target.value as PhotoFunnelConfig['display']['cityPosition'] } }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5">
                                    <option value="before_faq">Przed FAQ</option>
                                    <option value="before_closing">Przed sekcją końcową</option>
                                </select>
                            </label>
                        </div>
                    </section>

                    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                        <h2 className="mb-5 text-lg font-semibold">CTA</h2>
                        {renderCopyFields(CTA_FIELDS)}
                    </section>

                    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                        <h2 className="mb-5 text-lg font-semibold">Nagłówki i social proof</h2>
                        {renderCopyFields(SECTION_FIELDS)}
                    </section>

                    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                        <h2 className="mb-5 text-lg font-semibold">Formularz</h2>
                        {renderCopyFields(FORM_FIELDS)}
                    </section>

                    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                        <h2 className="mb-2 text-lg font-semibold">Ścieżka pełnej rezerwacji</h2>
                        <p className="mb-5 text-sm text-zinc-500">Teksty strony /rezerwacja. Szablony zachowują wartości techniczne w nawiasach klamrowych.</p>
                        {renderBookingFields()}
                    </section>

                    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                        <h2 className="mb-2 text-lg font-semibold">Galeria: ponowna rezerwacja i opinia</h2>
                        <p className="mb-5 text-sm text-zinc-500">System blokuje komunikaty sugerujące ocenę lub opinię w zamian za rabat. Obowiązkowa informacja o dobrowolności opinii pozostaje zawsze widoczna.</p>
                        {renderGalleryFields()}
                    </section>

                    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                        <h2 className="mb-2 text-lg font-semibold">Oferty po obejrzeniu galerii</h2>
                        <p className="mb-5 text-sm text-zinc-500">Promocja pochodzi z modułu „Kody promocyjne”. Tutaj ustawiasz wyłącznie treść, widoczność i kolejność kafelków.</p>
                        <div className="space-y-3">
                            {config.galleryOffers.map((option, index) => (
                                <div key={option.value} className="grid gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3 lg:grid-cols-[110px_1fr_1.5fr_auto] lg:items-center">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" checked={option.enabled} onChange={event => setConfig(current => ({ ...current, galleryOffers: current.galleryOffers.map(item => item.value === option.value ? { ...item, enabled: event.target.checked } : item) }))} className="h-4 w-4 accent-amber-400" />
                                        {option.value}
                                    </label>
                                    <input maxLength={120} value={option.title} onChange={event => setConfig(current => ({ ...current, galleryOffers: current.galleryOffers.map(item => item.value === option.value ? { ...item, title: event.target.value } : item) }))} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" />
                                    <textarea rows={2} maxLength={300} value={option.description} onChange={event => setConfig(current => ({ ...current, galleryOffers: current.galleryOffers.map(item => item.value === option.value ? { ...item, description: event.target.value } : item) }))} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" />
                                    <div className="flex gap-1">
                                        <button aria-label={`Przenieś ${option.title} wyżej`} disabled={index === 0} onClick={() => moveGalleryOffer(index, -1)} className="rounded border border-zinc-700 p-2 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                                        <button aria-label={`Przenieś ${option.title} niżej`} disabled={index === config.galleryOffers.length - 1} onClick={() => moveGalleryOffer(index, 1)} className="rounded border border-zinc-700 p-2 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                        <h2 className="mb-2 text-lg font-semibold">Usługi w formularzu</h2>
                        <p className="mb-5 text-sm text-zinc-500">Wartości techniczne pozostają stałe dla CRM i analityki; możesz zmienić etykiety, widoczność i kolejność.</p>
                        <div className="space-y-3">
                            {config.serviceOptions.map((option, index) => (
                                <div key={option.value} className="grid gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3 sm:grid-cols-[110px_1fr_auto] sm:items-center">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={option.enabled}
                                            onChange={event => setConfig(current => ({ ...current, serviceOptions: current.serviceOptions.map(item => item.value === option.value ? { ...item, enabled: event.target.checked } : item) }))}
                                            className="h-4 w-4 accent-amber-400"
                                        />
                                        {option.value}
                                    </label>
                                    <input
                                        maxLength={120}
                                        value={option.label}
                                        onChange={event => setConfig(current => ({ ...current, serviceOptions: current.serviceOptions.map(item => item.value === option.value ? { ...item, label: event.target.value } : item) }))}
                                        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                                    />
                                    <div className="flex gap-1">
                                        <button aria-label={`Przenieś ${option.value} wyżej`} disabled={index === 0} onClick={() => moveService(index, -1)} className="rounded border border-zinc-700 p-2 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                                        <button aria-label={`Przenieś ${option.value} niżej`} disabled={index === config.serviceOptions.length - 1} onClick={() => moveService(index, 1)} className="rounded border border-zinc-700 p-2 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                        <h2 className="mb-5 text-lg font-semibold">Kontakt bezpośredni</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            <label><span className="mb-1.5 block text-sm text-zinc-300">Link telefonu</span><input value={config.contact.phoneHref} onChange={event => setConfig(current => ({ ...current, contact: { ...current.contact, phoneHref: event.target.value } }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5" /></label>
                            <label><span className="mb-1.5 block text-sm text-zinc-300">Link WhatsApp (wa.me)</span><input value={config.contact.whatsappHref} onChange={event => setConfig(current => ({ ...current, contact: { ...current.contact, whatsappHref: event.target.value } }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5" /></label>
                        </div>
                    </section>
                </div>

                <aside className="xl:sticky xl:top-6 xl:self-start">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-300"><Smartphone className="h-4 w-4" /> Podgląd mobilny</div>
                    <div className="mx-auto max-w-[360px] rounded-[2rem] border-8 border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
                        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">{config.copy.serviceEyebrow}</p>
                        <h2 className="mt-3 text-center text-2xl font-semibold">{config.copy.serviceTitle}</h2>
                        <p className="mt-3 text-center text-sm leading-relaxed text-zinc-400">{config.copy.serviceDescription}</p>
                        <div className="mt-5 space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                            <div className="rounded-lg border border-zinc-700 bg-black/40 px-3 py-3 text-sm text-zinc-500">{config.copy.namePlaceholder}</div>
                            <div className="rounded-lg border border-zinc-700 bg-black/40 px-3 py-3 text-sm text-zinc-300">{config.serviceOptions.find(option => option.enabled)?.label}</div>
                            <button className="w-full rounded-lg bg-amber-400 px-3 py-3 text-sm font-bold text-black">{config.copy.inquiryCtaLabel}</button>
                            <p className="text-xs leading-relaxed text-zinc-500">{config.copy.privacyHelper}</p>
                        </div>
                        <div className="my-5 border-t border-zinc-800" />
                        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Rezerwacja</p>
                        <h2 className="mt-2 text-center text-xl font-semibold">{config.bookingCopy.heroTitle}</h2>
                        <p className="mt-2 text-center text-xs leading-relaxed text-zinc-400">{config.bookingCopy.heroDescription}</p>
                        <button className="mt-4 w-full rounded-lg bg-zinc-100 px-3 py-3 text-sm font-bold text-zinc-950">{config.bookingCopy.submitReadyLabel}</button>
                        {config.display.galleryReviewEnabled && (
                            <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
                                <p className="text-xs font-semibold text-amber-400">Galeria</p>
                                <h3 className="mt-2 font-semibold">{config.galleryCopy.reviewTitle}</h3>
                                <p className="mt-2 text-xs leading-relaxed text-zinc-400">{config.galleryCopy.reviewDescription}</p>
                                <p className="mt-2 text-[10px] leading-relaxed text-zinc-500">Opinia jest dobrowolna i nie wpływa na rabat ani korzyść.</p>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
