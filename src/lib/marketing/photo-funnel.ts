export const PHOTO_FUNNEL_SETTING_KEY = 'photo_funnel_config';

export const PHOTO_SERVICE_VALUES = ['Sesja', 'Ślub', 'Urodziny', 'Wizerunek', 'Dron', 'Inne'] as const;
export type PhotoServiceValue = typeof PHOTO_SERVICE_VALUES[number];

export interface PhotoFunnelServiceOption {
    value: PhotoServiceValue;
    label: string;
    enabled: boolean;
    position: number;
}

export const GALLERY_OFFER_VALUES = ['birthday', 'portrait', 'family', 'event'] as const;
export type GalleryOfferValue = typeof GALLERY_OFFER_VALUES[number];

export interface GalleryOfferOption {
    value: GalleryOfferValue;
    title: string;
    description: string;
    enabled: boolean;
    position: number;
}

export interface PhotoFunnelConfig {
    version: 1;
    display: {
        cityModuleEnabled: boolean;
        serviceModuleEnabled: boolean;
        showHeroInquiryCta: boolean;
        showOfferInquiryCta: boolean;
        showPackageInquiryCta: boolean;
        showClosingInquiryCta: boolean;
        galleryTopNudgeEnabled: boolean;
        galleryLoyaltyEnabled: boolean;
        galleryReviewEnabled: boolean;
        galleryShareEnabled: boolean;
        servicePosition: 'before_packages' | 'after_packages';
        cityPosition: 'before_faq' | 'before_closing';
    };
    copy: {
        inquiryCtaLabel: string;
        packageBookingCtaLabel: string;
        packageInquiryCtaLabel: string;
        serviceEyebrow: string;
        serviceTitle: string;
        serviceDescription: string;
        cityTitleTemplate: string;
        cityDescription: string;
        nameLabel: string;
        namePlaceholder: string;
        serviceLabel: string;
        cityLabel: string;
        cityPlaceholder: string;
        dateLabel: string;
        optionalLabel: string;
        phoneLabel: string;
        phoneHint: string;
        phonePlaceholder: string;
        emailLabel: string;
        emailHint: string;
        emailPlaceholder: string;
        messageLabel: string;
        messagePlaceholder: string;
        privacyHelper: string;
        sendingLabel: string;
        successButtonLabel: string;
        retryLabel: string;
        successMessage: string;
        directContactPrompt: string;
        phoneDisplay: string;
        whatsappLabel: string;
        reviewsHeading: string;
        reviewsCtaLabel: string;
        emptyPortfolioTextTemplate: string;
        portfolioCtaLabel: string;
    };
    contact: {
        phoneHref: string;
        whatsappHref: string;
    };
    serviceOptions: PhotoFunnelServiceOption[];
    bookingCopy: {
        heroTitle: string;
        heroDescription: string;
        stepService: string;
        stepDate: string;
        stepPayment: string;
        paymentLead: string;
        paymentSplitTemplate: string;
        paymentFull: string;
        giftTitle: string;
        giftDescription: string;
        giftPlaceholder: string;
        giftRemoveLabel: string;
        giftApplyLabel: string;
        serviceHeading: string;
        packageHeading: string;
        dateHeading: string;
        dayHeading: string;
        choosePackageHoursHeading: string;
        loadingHoursHeading: string;
        chooseHourHeading: string;
        choosePackageLead: string;
        choosePackageHelp: string;
        availabilityLoading: string;
        startTimeLabel: string;
        startTimePlaceholder: string;
        slotOptionTemplate: string;
        slotDurationTemplate: string;
        nextDayLabel: string;
        fullDayAvailableTitle: string;
        fullDayAvailableText: string;
        fullDayUnavailableTitle: string;
        fullDayUnavailableText: string;
        noHours: string;
        detailsHeading: string;
        bookingValueLabel: string;
        splitSummaryTemplate: string;
        submitReadyLabel: string;
        submitIncompleteLabel: string;
        testimonialsHeading: string;
    };
    galleryCopy: {
        topBadge: string;
        topOfferAvailable: string;
        topNoOffer: string;
        copyLabel: string;
        copiedLabel: string;
        copySuccessTemplate: string;
        copyFailure: string;
        loyaltyEyebrow: string;
        loyaltyTitleTemplate: string;
        loyaltyFallbackTitle: string;
        loyaltyDescription: string;
        promoLabelTemplate: string;
        expiryTemplate: string;
        offerCtaLabel: string;
        noOfferTitleTemplate: string;
        noOfferFallbackTitle: string;
        noOfferDescription: string;
        reviewTitle: string;
        reviewDescription: string;
        googleTitle: string;
        googleDescription: string;
        googleCtaLabel: string;
        reviewThankYou: string;
        shareTitle: string;
        shareDescription: string;
        shareCtaLabel: string;
        shareText: string;
        shareDialogTitle: string;
        shareSuccess: string;
        shareCopied: string;
        reviewFooter: string;
    };
    galleryOffers: GalleryOfferOption[];
}

export const DEFAULT_PHOTO_FUNNEL_CONFIG: PhotoFunnelConfig = {
    version: 1,
    display: {
        cityModuleEnabled: true,
        serviceModuleEnabled: true,
        showHeroInquiryCta: true,
        showOfferInquiryCta: true,
        showPackageInquiryCta: true,
        showClosingInquiryCta: true,
        galleryTopNudgeEnabled: true,
        galleryLoyaltyEnabled: true,
        galleryReviewEnabled: true,
        galleryShareEnabled: true,
        servicePosition: 'after_packages',
        cityPosition: 'before_faq',
    },
    copy: {
        inquiryCtaLabel: 'Zapytaj o termin — bez płatności',
        packageBookingCtaLabel: 'Wybierz pakiet i termin',
        packageInquiryCtaLabel: 'Zapytaj bez płatności',
        serviceEyebrow: 'Bez zobowiązań',
        serviceTitle: 'Najpierw sprawdź dostępność i dopytaj o zakres',
        serviceDescription: 'Nie musisz od razu wybierać pełnej rezerwacji. Zostaw imię i telefon lub email — odpowiem osobiście w sprawie terminu.',
        cityTitleTemplate: 'Sprawdź wolne terminy w {cityIn}',
        cityDescription: 'Zostaw kontakt — odezwę się z propozycją terminu i wyceną.',
        nameLabel: 'Imię',
        namePlaceholder: 'Jak się do Ciebie zwracać?',
        serviceLabel: 'Rodzaj fotografii',
        cityLabel: 'Miasto',
        cityPlaceholder: 'Np. Toruń',
        dateLabel: 'Miesiąc lub termin',
        optionalLabel: 'opcjonalnie',
        phoneLabel: 'Telefon',
        phoneHint: 'najszybszy kontakt',
        phonePlaceholder: '+48 ___ ___ ___',
        emailLabel: 'Email',
        emailHint: 'zamiast telefonu',
        emailPlaceholder: 'twoj@email.pl',
        messageLabel: 'Co jest najważniejsze?',
        messagePlaceholder: 'Np. liczba osób, rodzaj uroczystości albo pytanie o pakiet',
        privacyHelper: 'Wystarczy imię oraz telefon lub email. To zapytanie o dostępność — bez rezerwacji i bez płatności.',
        sendingLabel: 'Wysyłanie...',
        successButtonLabel: 'Wysłano — odezwę się osobiście',
        retryLabel: 'Spróbuj wysłać ponownie',
        successMessage: 'Zapytanie zostało zapisane. Odpowiem na podany telefon lub email.',
        directContactPrompt: 'Wolisz od razu porozmawiać?',
        phoneDisplay: '530 788 694',
        whatsappLabel: 'WhatsApp',
        reviewsHeading: 'Co mówią klienci',
        reviewsCtaLabel: 'Zobacz opinie w Google →',
        emptyPortfolioTextTemplate: 'Sprawdź {count}realizacji w portfolio',
        portfolioCtaLabel: 'Zobacz portfolio →',
    },
    contact: {
        phoneHref: 'tel:+48530788694',
        whatsappHref: 'https://wa.me/48530788694',
    },
    serviceOptions: [
        { value: 'Sesja', label: 'Sesja rodzinna / dla par', enabled: true, position: 0 },
        { value: 'Ślub', label: 'Ślub / reportaż ślubny', enabled: true, position: 1 },
        { value: 'Urodziny', label: 'Urodziny / przyjęcie', enabled: true, position: 2 },
        { value: 'Wizerunek', label: 'Sesja wizerunkowa / biznesowa', enabled: true, position: 3 },
        { value: 'Dron', label: 'Zdjęcia lub film z drona', enabled: true, position: 4 },
        { value: 'Inne', label: 'Inne / nie wiem jeszcze', enabled: true, position: 5 },
    ],
    bookingCopy: {
        heroTitle: 'Wybierz fotografię dopasowaną do Waszego dnia',
        heroDescription: 'Najpierw wybierz rodzaj spotkania i zakres fotografowania. Potem zobaczysz wolne terminy, podasz najważniejsze informacje i przejdziesz do bezpiecznej płatności przez PayU.',
        stepService: 'Wybierz usługę i pakiet',
        stepDate: 'Zaznacz termin',
        stepPayment: 'Potwierdź i zapłać przez PayU',
        paymentLead: 'Płatność jest dopiero po sprawdzeniu podsumowania.',
        paymentSplitTemplate: 'Możesz wybrać zaliczkę {percent}% albo zapłacić pełną kwotę. Sam wybór pakietu i terminu niczego nie pobiera.',
        paymentFull: 'Przed przejściem do PayU zobaczysz jeszcze pełną kwotę oraz wszystkie dane rezerwacji.',
        giftTitle: 'Masz kartę podarunkową?',
        giftDescription: 'Wpisz kod karty, aby od razu naliczyć środki na rezerwację. Jeśli karta pokrywa koszt sesji, rezerwacja będzie natychmiastowa.',
        giftPlaceholder: 'WPISZ KOD KARTY',
        giftRemoveLabel: 'Usuń kartę',
        giftApplyLabel: 'Zastosuj',
        serviceHeading: 'Wybierz rodzaj fotografii',
        packageHeading: 'Wybierz zakres',
        dateHeading: 'Wybierz termin',
        dayHeading: 'Wybierz dzień',
        choosePackageHoursHeading: 'Wybierz pakiet, aby zobaczyć godziny',
        loadingHoursHeading: 'Ładowanie dostępnych godzin...',
        chooseHourHeading: 'Wybierz godzinę',
        choosePackageLead: 'Najpierw wybierz pakiet powyżej,',
        choosePackageHelp: 'abyśmy mogli sprawdzić dostępność dla wybranej długości sesji.',
        availabilityLoading: 'Sprawdzam dostępność...',
        startTimeLabel: 'Godzina rozpoczęcia',
        startTimePlaceholder: 'Wybierz dostępną godzinę',
        slotOptionTemplate: '{start} — zakończenie {end}{nextDay}',
        slotDurationTemplate: 'Czas trwania: {duration}. Sprawdź godzinę zakończenia przed przejściem dalej.',
        nextDayLabel: 'następnego dnia',
        fullDayAvailableTitle: 'Pakiet całodniowy (ślub lub przyjęcie)',
        fullDayAvailableText: 'Dzień jest dostępny. Nie musisz wybierać konkretnych godzin.',
        fullDayUnavailableTitle: 'Ten dzień jest już zajęty',
        fullDayUnavailableText: 'Wybierz inny dzień dla pakietu całodniowego.',
        noHours: 'Brak dostępnych godzin na wybrany dzień',
        detailsHeading: 'Dane do rezerwacji',
        bookingValueLabel: 'Wartość rezerwacji:',
        splitSummaryTemplate: 'W podsumowaniu możesz wybrać zaliczkę {percent}%: {amount} zł teraz, a pozostałą część dopłacić później.',
        submitReadyLabel: 'Przejdź do podsumowania',
        submitIncompleteLabel: 'Sprawdź dane i przejdź dalej',
        testimonialsHeading: 'Co mówią osoby, które były już przed obiektywem',
    },
    galleryCopy: {
        topBadge: 'Dziękuję za zaufanie',
        topOfferAvailable: 'Korzyść dla stałych klientów:',
        topNoOffer: 'Cieszę się, że mogłem przygotować Twoje zdjęcia.',
        copyLabel: 'Skopiuj kod',
        copiedLabel: 'Skopiowano',
        copySuccessTemplate: 'Skopiowano kod: {code}',
        copyFailure: 'Nie udało się skopiować',
        loyaltyEyebrow: 'Podziękowanie za zaufanie',
        loyaltyTitleTemplate: '{name}, zobaczmy się znowu',
        loyaltyFallbackTitle: 'Zobaczmy się znowu',
        loyaltyDescription: 'Tę korzyść otrzymujesz jako klient galerii. Nie zależy od wystawienia opinii ani od jej oceny.',
        promoLabelTemplate: 'Kod promocyjny · {discount}',
        expiryTemplate: 'Ważny do {date}.',
        offerCtaLabel: 'Zarezerwuj',
        noOfferTitleTemplate: '{name}, dziękuję za zaufanie',
        noOfferFallbackTitle: 'Dziękuję za zaufanie',
        noOfferDescription: 'Cieszę się, że mogłem przygotować dla Ciebie te zdjęcia.',
        reviewTitle: 'Podziel się szczerą opinią',
        reviewDescription: 'Jeśli chcesz, opisz swoje prawdziwe doświadczenie ze współpracy — również wtedy, gdy masz uwagi.',
        googleTitle: 'Opinia na Google',
        googleDescription: 'Napisz własnymi słowami, co było dobre i co mogę poprawić.',
        googleCtaLabel: 'Dodaj szczerą opinię',
        reviewThankYou: 'Dziękuję!',
        shareTitle: 'Poleć znajomym',
        shareDescription: 'Znasz kogoś, kto szuka fotografa? Wyślij mu link do strony.',
        shareCtaLabel: 'Udostępnij',
        shareText: 'Polecam fotografa Przemka — super zdjęcia, sprawdź:',
        shareDialogTitle: 'Fotograf Przemek',
        shareSuccess: 'Dzięki za polecenie!',
        shareCopied: 'Link skopiowany — wklej znajomym!',
        reviewFooter: 'Dziękuję za każdą szczerą opinię — niezależnie od wystawionej oceny.',
    },
    galleryOffers: [
        { value: 'birthday', title: 'Sesja urodzinowa', description: 'Magiczne kadry na okrągłą rocznicę — w studio lub w plenerze.', enabled: true, position: 0 },
        { value: 'portrait', title: 'Sesja indywidualna', description: 'Portrety, które pokazują charakter. Idealne na pamiątkę.', enabled: true, position: 1 },
        { value: 'family', title: 'Sesja rodzinna', description: 'Cała rodzina razem. Sesja, którą będziesz oprawiać w ramki.', enabled: true, position: 2 },
        { value: 'event', title: 'Plener / event', description: 'Reportaż z urodzin, chrztu, jubileuszu — bez sztuczności.', enabled: true, position: 3 },
    ],
};

type ValidationResult =
    | { success: true; data: PhotoFunnelConfig }
    | { success: false; errors: string[] };

export const PHOTO_FUNNEL_COPY_LIMITS: Record<keyof PhotoFunnelConfig['copy'], number> = {
    inquiryCtaLabel: 80,
    packageBookingCtaLabel: 80,
    packageInquiryCtaLabel: 80,
    serviceEyebrow: 80,
    serviceTitle: 180,
    serviceDescription: 500,
    cityTitleTemplate: 180,
    cityDescription: 500,
    nameLabel: 60,
    namePlaceholder: 120,
    serviceLabel: 60,
    cityLabel: 60,
    cityPlaceholder: 120,
    dateLabel: 60,
    optionalLabel: 40,
    phoneLabel: 60,
    phoneHint: 80,
    phonePlaceholder: 60,
    emailLabel: 60,
    emailHint: 80,
    emailPlaceholder: 120,
    messageLabel: 100,
    messagePlaceholder: 240,
    privacyHelper: 500,
    sendingLabel: 80,
    successButtonLabel: 120,
    retryLabel: 120,
    successMessage: 300,
    directContactPrompt: 160,
    phoneDisplay: 60,
    whatsappLabel: 60,
    reviewsHeading: 100,
    reviewsCtaLabel: 100,
    emptyPortfolioTextTemplate: 180,
    portfolioCtaLabel: 100,
};

export const PHOTO_FUNNEL_BOOKING_COPY_LIMITS: Record<keyof PhotoFunnelConfig['bookingCopy'], number> = {
    heroTitle: 180,
    heroDescription: 500,
    stepService: 100,
    stepDate: 100,
    stepPayment: 120,
    paymentLead: 180,
    paymentSplitTemplate: 500,
    paymentFull: 400,
    giftTitle: 120,
    giftDescription: 400,
    giftPlaceholder: 80,
    giftRemoveLabel: 80,
    giftApplyLabel: 80,
    serviceHeading: 120,
    packageHeading: 120,
    dateHeading: 120,
    dayHeading: 120,
    choosePackageHoursHeading: 180,
    loadingHoursHeading: 180,
    chooseHourHeading: 120,
    choosePackageLead: 180,
    choosePackageHelp: 300,
    availabilityLoading: 120,
    startTimeLabel: 120,
    startTimePlaceholder: 160,
    slotOptionTemplate: 220,
    slotDurationTemplate: 300,
    nextDayLabel: 80,
    fullDayAvailableTitle: 180,
    fullDayAvailableText: 300,
    fullDayUnavailableTitle: 180,
    fullDayUnavailableText: 300,
    noHours: 180,
    detailsHeading: 120,
    bookingValueLabel: 120,
    splitSummaryTemplate: 500,
    submitReadyLabel: 120,
    submitIncompleteLabel: 160,
    testimonialsHeading: 180,
};

export const PHOTO_FUNNEL_GALLERY_COPY_LIMITS: Record<keyof PhotoFunnelConfig['galleryCopy'], number> = {
    topBadge: 100,
    topOfferAvailable: 160,
    topNoOffer: 240,
    copyLabel: 80,
    copiedLabel: 80,
    copySuccessTemplate: 160,
    copyFailure: 160,
    loyaltyEyebrow: 100,
    loyaltyTitleTemplate: 180,
    loyaltyFallbackTitle: 180,
    loyaltyDescription: 400,
    promoLabelTemplate: 160,
    expiryTemplate: 160,
    offerCtaLabel: 100,
    noOfferTitleTemplate: 180,
    noOfferFallbackTitle: 180,
    noOfferDescription: 300,
    reviewTitle: 180,
    reviewDescription: 400,
    googleTitle: 120,
    googleDescription: 300,
    googleCtaLabel: 120,
    reviewThankYou: 100,
    shareTitle: 120,
    shareDescription: 300,
    shareCtaLabel: 100,
    shareText: 300,
    shareDialogTitle: 120,
    shareSuccess: 160,
    shareCopied: 180,
    reviewFooter: 300,
};

function cloneDefaults(): PhotoFunnelConfig {
    return JSON.parse(JSON.stringify(DEFAULT_PHOTO_FUNNEL_CONFIG)) as PhotoFunnelConfig;
}

function asObject(value: unknown): Record<string, unknown> | null {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
        ? value as Record<string, unknown>
        : null;
}

function decodeConfig(value: unknown): { value: Record<string, unknown> | null; parseError: boolean } {
    if (typeof value !== 'string') return { value: asObject(value), parseError: false };
    try {
        return { value: asObject(JSON.parse(value)), parseError: false };
    } catch {
        return { value: null, parseError: true };
    }
}

function safeText(value: unknown, fallback: string, maxLength: number) {
    if (typeof value !== 'string') return fallback;
    const normalized = value.trim();
    return normalized && normalized.length <= maxLength ? normalized : fallback;
}

export function hasForbiddenReviewIncentiveCopy(value: string) {
    const normalized = value.toLocaleLowerCase('pl-PL').replace(/\s+/g, ' ');
    const explicitIncentive = [
        /5\s*(?:★|gwiazd)/u,
        /pozytywn\w*\s+opini/u,
        /opini\w*\s+pozytywn/u,
        /(?:rabat|kod|gratis|prezent|korzyść).{0,50}(?:\bza\b|w zamian za).{0,30}(?:opini|ocen)/u,
        /(?:\bza\b|w zamian za).{0,30}(?:opini|ocen).{0,50}(?:rabat|kod|gratis|prezent|korzyść)/u,
    ].some((pattern) => pattern.test(normalized));
    const sentenceIncentive = normalized.split(/[.!?]+/u).some(sentence => {
        const mentionsReview = /(?:opini\w*|ocen\w*)/u.test(sentence);
        const mentionsBenefit = /(?:rabat\w*|kod(?:\s+rabatow\w*)?|gratis\w*|prezent\w*|korzyś\w*)/u.test(sentence);
        if (!mentionsReview || !mentionsBenefit) return false;
        const deniesConnection = /(?:nie\s+(?:zależy|zalezy|wpływa|wplywa)|bez\s+względu\s+na|nie\s+jest\s+uzależn\w*)/u.test(sentence);
        const promisesBenefit = /(?:odbierz|otrzym\w*|dost\w*|zysk\w*|czeka\w*)/u.test(sentence);
        return promisesBenefit || !deniesConnection;
    });
    return explicitIncentive || sentenceIncentive;
}

function isPhoneHref(value: string) {
    return /^tel:\+?[0-9 ()-]{6,24}$/.test(value);
}

function isWhatsAppHref(value: string) {
    try {
        const url = new URL(value);
        return url.protocol === 'https:'
            && url.hostname === 'wa.me'
            && /^\/[0-9]{7,18}$/.test(url.pathname)
            && !url.username
            && !url.password
            && !url.port;
    } catch {
        return false;
    }
}

export function parsePhotoFunnelConfig(value: unknown): PhotoFunnelConfig {
    const defaults = cloneDefaults();
    const candidate = decodeConfig(value).value;
    if (!candidate) return defaults;

    const display = asObject(candidate.display);
    if (display) {
        for (const key of [
            'cityModuleEnabled',
            'serviceModuleEnabled',
            'showHeroInquiryCta',
            'showOfferInquiryCta',
            'showPackageInquiryCta',
            'showClosingInquiryCta',
            'galleryTopNudgeEnabled',
            'galleryLoyaltyEnabled',
            'galleryReviewEnabled',
            'galleryShareEnabled',
        ] as const) {
            if (typeof display[key] === 'boolean') defaults.display[key] = display[key];
        }
        if (display.servicePosition === 'before_packages' || display.servicePosition === 'after_packages') {
            defaults.display.servicePosition = display.servicePosition;
        }
        if (display.cityPosition === 'before_faq' || display.cityPosition === 'before_closing') {
            defaults.display.cityPosition = display.cityPosition;
        }
    }

    const copy = asObject(candidate.copy);
    if (copy) {
        for (const key of Object.keys(PHOTO_FUNNEL_COPY_LIMITS) as Array<keyof PhotoFunnelConfig['copy']>) {
            defaults.copy[key] = safeText(copy[key], defaults.copy[key], PHOTO_FUNNEL_COPY_LIMITS[key]);
        }
    }

    const bookingCopy = asObject(candidate.bookingCopy);
    if (bookingCopy) {
        for (const key of Object.keys(PHOTO_FUNNEL_BOOKING_COPY_LIMITS) as Array<keyof PhotoFunnelConfig['bookingCopy']>) {
            defaults.bookingCopy[key] = safeText(
                bookingCopy[key],
                defaults.bookingCopy[key],
                PHOTO_FUNNEL_BOOKING_COPY_LIMITS[key],
            );
        }
    }

    const galleryCopy = asObject(candidate.galleryCopy);
    if (galleryCopy) {
        for (const key of Object.keys(PHOTO_FUNNEL_GALLERY_COPY_LIMITS) as Array<keyof PhotoFunnelConfig['galleryCopy']>) {
            const parsed = safeText(
                galleryCopy[key],
                defaults.galleryCopy[key],
                PHOTO_FUNNEL_GALLERY_COPY_LIMITS[key],
            );
            defaults.galleryCopy[key] = hasForbiddenReviewIncentiveCopy(parsed)
                ? defaults.galleryCopy[key]
                : parsed;
        }
    }

    const contact = asObject(candidate.contact);
    if (contact) {
        if (typeof contact.phoneHref === 'string' && isPhoneHref(contact.phoneHref.trim())) {
            defaults.contact.phoneHref = contact.phoneHref.trim();
        }
        if (typeof contact.whatsappHref === 'string' && isWhatsAppHref(contact.whatsappHref.trim())) {
            defaults.contact.whatsappHref = contact.whatsappHref.trim();
        }
    }

    if (Array.isArray(candidate.serviceOptions)) {
        const supplied = new Map<PhotoServiceValue, Record<string, unknown>>();
        for (const rawOption of candidate.serviceOptions) {
            const option = asObject(rawOption);
            if (option && PHOTO_SERVICE_VALUES.includes(option.value as PhotoServiceValue) && !supplied.has(option.value as PhotoServiceValue)) {
                supplied.set(option.value as PhotoServiceValue, option);
            }
        }
        defaults.serviceOptions = defaults.serviceOptions.map((fallback) => {
            const option = supplied.get(fallback.value);
            if (!option) return fallback;
            return {
                value: fallback.value,
                label: safeText(option.label, fallback.label, 120),
                enabled: typeof option.enabled === 'boolean' ? option.enabled : fallback.enabled,
                position: Number.isInteger(option.position)
                    ? Math.max(0, Math.min(20, Number(option.position)))
                    : fallback.position,
            };
        }).sort((a, b) => a.position - b.position || a.value.localeCompare(b.value, 'pl'));

        if (!defaults.serviceOptions.some((option) => option.enabled)) {
            defaults.serviceOptions[0].enabled = true;
        }
    }

    if (Array.isArray(candidate.galleryOffers)) {
        const supplied = new Map<GalleryOfferValue, Record<string, unknown>>();
        for (const rawOption of candidate.galleryOffers) {
            const option = asObject(rawOption);
            if (option && GALLERY_OFFER_VALUES.includes(option.value as GalleryOfferValue) && !supplied.has(option.value as GalleryOfferValue)) {
                supplied.set(option.value as GalleryOfferValue, option);
            }
        }
        defaults.galleryOffers = defaults.galleryOffers.map((fallback) => {
            const option = supplied.get(fallback.value);
            if (!option) return fallback;
            return {
                value: fallback.value,
                title: safeText(option.title, fallback.title, 120),
                description: safeText(option.description, fallback.description, 300),
                enabled: typeof option.enabled === 'boolean' ? option.enabled : fallback.enabled,
                position: Number.isInteger(option.position)
                    ? Math.max(0, Math.min(20, Number(option.position)))
                    : fallback.position,
            };
        }).sort((a, b) => a.position - b.position || a.value.localeCompare(b.value, 'pl'));
    }

    return defaults;
}

export function validatePhotoFunnelConfig(value: unknown): ValidationResult {
    const decoded = decodeConfig(value);
    if (decoded.parseError || !decoded.value) {
        return { success: false, errors: ['Konfiguracja lejka nie jest poprawnym obiektem JSON.'] };
    }

    const errors: string[] = [];
    const copy = asObject(decoded.value.copy);
    if (decoded.value.copy !== undefined && !copy) errors.push('Sekcja tekstów ma nieprawidłowy format.');
    if (copy) {
        for (const key of Object.keys(PHOTO_FUNNEL_COPY_LIMITS) as Array<keyof PhotoFunnelConfig['copy']>) {
            if (copy[key] === undefined) continue;
            if (typeof copy[key] !== 'string' || !copy[key].trim() || copy[key].trim().length > PHOTO_FUNNEL_COPY_LIMITS[key]) {
                errors.push(`Pole ${key} jest puste albo przekracza limit ${PHOTO_FUNNEL_COPY_LIMITS[key]} znaków.`);
            }
        }
    }


    const bookingCopy = asObject(decoded.value.bookingCopy);
    if (decoded.value.bookingCopy !== undefined && !bookingCopy) errors.push('Sekcja tekstów rezerwacji ma nieprawidłowy format.');
    if (bookingCopy) {
        for (const key of Object.keys(PHOTO_FUNNEL_BOOKING_COPY_LIMITS) as Array<keyof PhotoFunnelConfig['bookingCopy']>) {
            if (bookingCopy[key] === undefined) continue;
            if (typeof bookingCopy[key] !== 'string' || !bookingCopy[key].trim() || bookingCopy[key].trim().length > PHOTO_FUNNEL_BOOKING_COPY_LIMITS[key]) {
                errors.push(`Pole rezerwacji ${key} jest puste albo przekracza limit ${PHOTO_FUNNEL_BOOKING_COPY_LIMITS[key]} znaków.`);
            }
        }
    }

    const galleryCopy = asObject(decoded.value.galleryCopy);
    if (decoded.value.galleryCopy !== undefined && !galleryCopy) errors.push('Sekcja tekstów galerii ma nieprawidłowy format.');
    if (galleryCopy) {
        for (const key of Object.keys(PHOTO_FUNNEL_GALLERY_COPY_LIMITS) as Array<keyof PhotoFunnelConfig['galleryCopy']>) {
            if (galleryCopy[key] === undefined) continue;
            if (typeof galleryCopy[key] !== 'string' || !galleryCopy[key].trim() || galleryCopy[key].trim().length > PHOTO_FUNNEL_GALLERY_COPY_LIMITS[key]) {
                errors.push(`Pole galerii ${key} jest puste albo przekracza limit ${PHOTO_FUNNEL_GALLERY_COPY_LIMITS[key]} znaków.`);
            } else if (hasForbiddenReviewIncentiveCopy(galleryCopy[key])) {
                errors.push(`Pole galerii ${key} sugeruje ocenę lub opinię w zamian za korzyść. Taka treść nie może zostać opublikowana.`);
            }
        }
    }

    const display = asObject(decoded.value.display);
    if (decoded.value.display !== undefined && !display) errors.push('Sekcja widoczności ma nieprawidłowy format.');
    if (display) {
        if (display.servicePosition !== undefined && !['before_packages', 'after_packages'].includes(String(display.servicePosition))) {
            errors.push('Nieprawidłowa pozycja formularza na stronie usługi.');
        }
        if (display.cityPosition !== undefined && !['before_faq', 'before_closing'].includes(String(display.cityPosition))) {
            errors.push('Nieprawidłowa pozycja formularza na stronie miasta.');
        }
    }

    const contact = asObject(decoded.value.contact);
    if (decoded.value.contact !== undefined && !contact) errors.push('Sekcja kontaktu ma nieprawidłowy format.');
    if (contact?.phoneHref !== undefined && (typeof contact.phoneHref !== 'string' || !isPhoneHref(contact.phoneHref.trim()))) {
        errors.push('Link telefonu musi zaczynać się od tel: i zawierać prawidłowy numer.');
    }
    if (contact?.whatsappHref !== undefined && (typeof contact.whatsappHref !== 'string' || !isWhatsAppHref(contact.whatsappHref.trim()))) {
        errors.push('Dozwolony jest wyłącznie bezpieczny link https://wa.me/numer.');
    }

    if (decoded.value.serviceOptions !== undefined) {
        if (!Array.isArray(decoded.value.serviceOptions)) {
            errors.push('Lista usług ma nieprawidłowy format.');
        } else {
            const seen = new Set<string>();
            let enabledCount = 0;
            for (const rawOption of decoded.value.serviceOptions) {
                const option = asObject(rawOption);
                if (!option || !PHOTO_SERVICE_VALUES.includes(option.value as PhotoServiceValue) || seen.has(String(option.value))) {
                    errors.push('Lista usług zawiera nieprawidłową lub powtórzoną pozycję.');
                    continue;
                }
                seen.add(String(option.value));
                if (option.enabled === true) enabledCount += 1;
                if (typeof option.label !== 'string' || !option.label.trim() || option.label.trim().length > 120) {
                    errors.push(`Etykieta usługi ${String(option.value)} jest nieprawidłowa.`);
                }
            }
            if (enabledCount === 0) errors.push('Co najmniej jedna usługa formularza musi pozostać widoczna.');
        }
    }


    if (decoded.value.galleryOffers !== undefined) {
        if (!Array.isArray(decoded.value.galleryOffers)) {
            errors.push('Lista ofert galerii ma nieprawidłowy format.');
        } else {
            const seen = new Set<string>();
            for (const rawOption of decoded.value.galleryOffers) {
                const option = asObject(rawOption);
                if (!option || !GALLERY_OFFER_VALUES.includes(option.value as GalleryOfferValue) || seen.has(String(option.value))) {
                    errors.push('Lista ofert galerii zawiera nieprawidłową lub powtórzoną pozycję.');
                    continue;
                }
                seen.add(String(option.value));
                if (typeof option.title !== 'string' || !option.title.trim() || option.title.trim().length > 120) {
                    errors.push(`Tytuł oferty ${String(option.value)} jest nieprawidłowy.`);
                }
                if (typeof option.description !== 'string' || !option.description.trim() || option.description.trim().length > 300) {
                    errors.push(`Opis oferty ${String(option.value)} jest nieprawidłowy.`);
                }
            }
        }
    }

    return errors.length > 0
        ? { success: false, errors }
        : { success: true, data: parsePhotoFunnelConfig(decoded.value) };
}

export function serializePhotoFunnelConfig(config: PhotoFunnelConfig) {
    return JSON.stringify(parsePhotoFunnelConfig(config));
}

export function formatPhotoFunnelTemplate(template: string, values: Record<string, string | number>) {
    return Object.entries(values).reduce(
        (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
        template,
    );
}
