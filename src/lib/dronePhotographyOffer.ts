export type DronePhotographyPackageSlug = string;

export type DronePhotographyPackage = {
    slug: DronePhotographyPackageSlug;
    name: string;
    shortName: string;
    audience: 'nieruchomosc' | 'firma' | 'slub';
    price: number;
    pricePrefix?: string;
    summary: string;
    delivery: string;
    features: string[];
    featured?: boolean;
    active?: boolean;
};

export type DroneTheme = {
    palette: 'sand' | 'pearl' | 'charcoal';
    accent: 'gold' | 'copper' | 'forest';
    headingFont: 'display' | 'serif' | 'sans';
    bodyFont: 'sans' | 'serif';
};

export type DroneFaqItem = { id: string; question: string; answer: string };
export type DroneImageItem = { id: string; url: string; alt: string };
export type DroneUseCase = {
    id: string;
    icon: 'building' | 'camera' | 'heart';
    eyebrow: string;
    title: string;
    description: string;
    href: string;
};

type DroneModuleBase = {
    id: string;
    enabled: boolean;
    tone: 'light' | 'sand' | 'dark';
};

export type DroneHeroModule = DroneModuleBase & {
    type: 'hero';
    eyebrow: string;
    title: string;
    titleAccent: string;
    description: string;
    priceLabel: string;
    ctaLabel: string;
    ctaHref: string;
    image: string;
    imageAlt: string;
    badges: string[];
};

export type DroneUseCasesModule = DroneModuleBase & {
    type: 'use_cases';
    items: DroneUseCase[];
};

export type DronePackagesModule = DroneModuleBase & {
    type: 'packages';
    eyebrow: string;
    title: string;
    description: string;
    bookingButtonLabel: string;
    featuredLabel: string;
    areaLabel: string;
};

export type DroneWeddingModule = DroneModuleBase & {
    type: 'wedding';
    eyebrow: string;
    title: string;
    description: string;
    packageSlug: string;
    bookingButtonLabel: string;
    secondaryButtonLabel: string;
    secondaryButtonHref: string;
};

export type DronePortfolioModule = DroneModuleBase & {
    type: 'portfolio';
    eyebrow: string;
    title: string;
    source: 'portfolio' | 'manual';
    categorySlug: string;
    limit: number;
    images: DroneImageItem[];
};

export type DroneEquipmentModule = DroneModuleBase & {
    type: 'equipment';
    cards: Array<{
        id: string;
        eyebrow: string;
        title: string;
        description: string;
        icon: 'camera' | 'thermal';
        linkLabel?: string;
        linkHref?: string;
    }>;
};

export type DroneFaqModule = DroneModuleBase & {
    type: 'faq';
    eyebrow: string;
    title: string;
    description: string;
    items: DroneFaqItem[];
};

export type DroneCtaModule = DroneModuleBase & {
    type: 'cta';
    eyebrow: string;
    title: string;
    description: string;
    buttonLabel: string;
    buttonHref: string;
};

export type DronePhotographyModule =
    | DroneHeroModule
    | DroneUseCasesModule
    | DronePackagesModule
    | DroneWeddingModule
    | DronePortfolioModule
    | DroneEquipmentModule
    | DroneFaqModule
    | DroneCtaModule;

export type DroneBookingCopy = {
    eyebrow: string;
    title: string;
    description: string;
    benefits: string[];
    packageLegend: string;
    locationLegend: string;
    contactLegend: string;
    goalLabel: string;
    goalOptions: string[];
    cityLabel: string;
    cityPlaceholder: string;
    dateLabel: string;
    addressLabel: string;
    addressPlaceholder: string;
    clientNameLabel: string;
    companyLabel: string;
    emailLabel: string;
    phoneLabel: string;
    notesLabel: string;
    notesPlaceholder: string;
    consentText: string;
    noPaymentText: string;
    submitLabel: string;
    successTitle: string;
    successText: string;
    successNumberLabel: string;
    backToOfferLabel: string;
    accountLabel: string;
    privacyLabel: string;
    sendingLabel: string;
};

export type DronePhotographyConfig = {
    version: 1;
    theme: DroneTheme;
    areas: string[];
    packages: DronePhotographyPackage[];
    booking: DroneBookingCopy;
    seo: {
        canonical: string;
        ogTitle: string;
        ogDescription: string;
        ogImage: string;
    };
    modules: DronePhotographyModule[];
};

export const DEFAULT_DRONE_PHOTOGRAPHY_CONFIG: DronePhotographyConfig = {
    version: 1,
    theme: { palette: 'sand', accent: 'gold', headingFont: 'display', bodyFont: 'sans' },
    areas: ['Toruń', 'Grudziądz', 'Wąbrzeźno', 'Chełmno', 'Świecie'],
    packages: [
        {
            slug: 'nieruchomosc-foto', name: 'Nieruchomość z powietrza', shortName: 'Zdjęcia nieruchomości', audience: 'nieruchomosc', price: 449,
            summary: 'Dom, działka, pensjonat lub obiekt przeznaczony do sprzedaży i wynajmu.', delivery: 'gotowe zdjęcia do 2 dni roboczych od lotu',
            features: ['10 wybranych i opracowanych zdjęć', 'ujęcia bryły, otoczenia i dojazdu', 'pliki do ogłoszeń, strony i mediów społecznościowych', 'jedna lokalizacja i do 60 minut pracy na miejscu'], active: true,
        },
        {
            slug: 'foto-film', name: 'Zdjęcia i krótki film', shortName: 'Zdjęcia + film', audience: 'nieruchomosc', price: 990,
            summary: 'Pełniejsza prezentacja nieruchomości, obiektu noclegowego lub miejsca na wydarzenia.', delivery: 'gotowy materiał do 3 dni roboczych od lotu',
            features: ['12 wybranych i opracowanych zdjęć', 'film 30–45 sekund z montażem i muzyką', 'wersja pozioma oraz krótki pionowy materiał do social mediów', 'pliki przygotowane do publikacji w internecie'], featured: true, active: true,
        },
        {
            slug: 'firma-obiekt', name: 'Firma i obiekt', shortName: 'Firma / obiekt', audience: 'firma', price: 1290, pricePrefix: 'od',
            summary: 'Materiał do strony firmy, kampanii, prezentacji inwestycji lub promocji miejsca.', delivery: 'termin oddania ustalany przed potwierdzeniem zlecenia',
            features: ['minimum 15 opracowanych zdjęć', 'film 45–60 sekund z montażem', 'formaty dopasowane do strony i mediów społecznościowych', 'prawo wykorzystania materiału we własnej promocji firmy'], active: true,
        },
        {
            slug: 'slub-dodatek', name: 'Ślub z drona', shortName: 'Dron do reportażu ślubnego', audience: 'slub', price: 690, pricePrefix: '+',
            summary: 'Dodatek do mojego reportażu ślubnego, realizowany przy odpowiedniej pogodzie i możliwości wykonania lotu.', delivery: 'razem z gotowym reportażem ślubnym',
            features: ['8–12 opracowanych zdjęć z powietrza', 'krótki filmowy fragment miejsca i otoczenia', 'ujęcie obiektu, pleneru i bezpiecznie ustawionej grupy', 'sprawdzenie przestrzeni powietrznej przed realizacją'], active: true,
        },
    ],
    booking: {
        eyebrow: 'Rezerwacja fotografii z drona', title: 'Najpierw sprawdzam, potem potwierdzam lot',
        description: 'Wybierz zakres, podaj miejsce i datę. Otrzymam konkretne dane potrzebne do sprawdzenia możliwości realizacji — bez płatności na tym etapie.',
        benefits: ['Sprawdzam dokładne miejsce i aktualne strefy.', 'Pogoda może wymagać bezpłatnej zmiany terminu.', 'Lot potwierdzam tylko wtedy, gdy można wykonać go bezpiecznie.'],
        packageLegend: '1. Wybierz zakres', locationLegend: '2. Podaj miejsce i termin', contactLegend: '3. Dane do kontaktu',
        goalLabel: 'Główne zadanie materiału', goalOptions: ['Sprzedaż lub wynajem nieruchomości', 'Promocja firmy lub obiektu', 'Reportaż ślubny', 'Dokumentacja inwestycji', 'Inne'],
        cityLabel: 'Miejscowość realizacji', cityPlaceholder: 'np. Toruń', dateLabel: 'Preferowana data', addressLabel: 'Adres lub nazwa miejsca', addressPlaceholder: 'Ulica, obiekt lub działka',
        clientNameLabel: 'Imię i nazwisko', companyLabel: 'Firma — opcjonalnie', emailLabel: 'E-mail', phoneLabel: 'Telefon',
        notesLabel: 'Co jeszcze powinienem wiedzieć?', notesPlaceholder: 'Zakres obiektu, oczekiwane ujęcia, termin publikacji lub inne ważne informacje',
        consentText: 'Zgadzam się na kontakt w sprawie tego zlecenia. Dane zostaną wykorzystane wyłącznie do obsługi zapytania.',
        noPaymentText: 'To rezerwacja wstępna — bez płatności na tym etapie.', submitLabel: 'Sprawdź możliwość realizacji',
        successTitle: 'Rezerwacja wstępna zapisana', successText: 'Sprawdzę miejsce, przestrzeń powietrzną i termin. Dopiero po tym potwierdzę możliwość realizacji oraz ostateczną cenę.',
        successNumberLabel: 'Numer zgłoszenia', backToOfferLabel: 'Wróć do oferty', accountLabel: 'Przejdź do konta', privacyLabel: 'Polityka prywatności', sendingLabel: 'Wysyłam...',
    },
    seo: {
        canonical: 'https://wlasniewski.pl/fotografia-z-drona', ogTitle: 'Zdjęcia i filmy z drona — Toruń i kujawsko-pomorskie',
        ogDescription: 'Nieruchomości, firmy i śluby. Jasny zakres, ceny od 449 zł i wstępna rezerwacja online.', ogImage: '',
    },
    modules: [
        {
            id: 'drone-hero', type: 'hero', enabled: true, tone: 'dark', eyebrow: 'Fotografia z powietrza · kujawsko-pomorskie',
            title: 'Zdjęcia i filmy', titleAccent: 'z drona',
            description: 'Dla sprzedaży nieruchomości, promocji firmy i jako dodatek do reportażu ślubnego. Wybierasz konkretny zakres, a przed potwierdzeniem terminu sprawdzam pogodę i możliwość wykonania lotu.',
            priceLabel: 'Pakiety od', ctaLabel: 'Wybierz zastosowanie', ctaHref: '#pakiety', image: '', imageAlt: '',
            badges: ['Toruń i region', 'Sprawdzenie strefy przed lotem', 'Bezpłatna zmiana terminu przez pogodę'],
        },
        {
            id: 'drone-use-cases', type: 'use_cases', enabled: true, tone: 'dark',
            items: [
                { id: 'nieruchomosc', icon: 'building', eyebrow: 'Sprzedaż i wynajem', title: 'Nieruchomość', description: 'Pokaż dom, działkę, obiekt noclegowy i ich otoczenie w jednym czytelnym materiale.', href: '#pakiety' },
                { id: 'firma', icon: 'camera', eyebrow: 'Strona i kampania', title: 'Firma', description: 'Zdjęcia oraz krótki film do strony, prezentacji inwestycji i mediów społecznościowych.', href: '#firma' },
                { id: 'slub', icon: 'heart', eyebrow: 'Dodatek do reportażu', title: 'Ślub', description: 'Miejsce ceremonii, sala, plener i bezpiecznie ustawiona grupa widziane z powietrza.', href: '#slub' },
            ],
        },
        {
            id: 'drone-packages', type: 'packages', enabled: true, tone: 'light', eyebrow: 'Zakres i cena',
            title: 'Wybierz materiał, którego naprawdę potrzebujesz',
            description: 'Cena obejmuje główny obszar działania. Dalszy dojazd i niestandardowe zgody wyceniam przed ostatecznym potwierdzeniem.', bookingButtonLabel: 'Sprawdź termin',
            featuredLabel: 'Najczęściej wybierany', areaLabel: 'Główny obszar',
        },
        {
            id: 'drone-wedding', type: 'wedding', enabled: true, tone: 'dark', eyebrow: 'Dodatek do fotografii ślubnej', title: 'Miejsce ślubu pokazane z góry',
            description: 'Ujęcia z drona dokładam do reportażu ślubnego wtedy, gdy miejsce, pogoda i przepisy pozwalają wykonać lot bezpiecznie. Nie obiecuję startu za wszelką cenę — najważniejsze są ludzie i przebieg uroczystości.',
            packageSlug: 'slub-dodatek', bookingButtonLabel: 'Dodaj dron do reportażu', secondaryButtonLabel: 'Zobacz pełną ofertę ślubną', secondaryButtonHref: '/slub',
        },
        {
            id: 'drone-portfolio', type: 'portfolio', enabled: true, tone: 'light', eyebrow: 'Wykonane realizacje', title: 'Zobacz efekt, nie obietnicę',
            source: 'portfolio', categorySlug: 'drone', limit: 6, images: [],
        },
        {
            id: 'drone-equipment', type: 'equipment', enabled: true, tone: 'sand',
            cards: [
                { id: 'air-2s', eyebrow: 'DJI Air 2S', title: 'Fotografia i film', description: 'To podstawowy sprzęt do materiałów dla nieruchomości, firm i reportaży ślubnych. Klient zamawia efekt i zakres — model drona dobieram do warunków realizacji.', icon: 'camera' },
                { id: 'mavic-thermal', eyebrow: 'DJI Mavic 3 Thermal', title: 'Termowizja i inspekcje', description: 'Badania termiczne, inspekcje techniczne i dokumentacja dla firm są prowadzone jako oddzielna usługa specjalistyczna na Aeroanaliza.', icon: 'thermal', linkLabel: 'Przejdź do Aeroanaliza', linkHref: 'https://aeroanaliza.pl/dron' },
            ],
        },
        {
            id: 'drone-faq', type: 'faq', enabled: true, tone: 'light', eyebrow: 'Przed rezerwacją', title: 'Co warto wiedzieć',
            description: 'Konkretnie, bez obietnic, których nie da się dotrzymać przy każdej pogodzie i w każdym miejscu.',
            items: [
                { id: 'faq-availability', question: 'Czy każdy termin i miejsce można zarezerwować od razu?', answer: 'Nie. Najpierw sprawdzam pogodę, aktualne strefy geograficzne i warunki bezpiecznego wykonania lotu. Rezerwacja z formularza jest wstępna do czasu mojego potwierdzenia.' },
                { id: 'faq-weather', question: 'Co się dzieje, gdy pogoda nie pozwala wystartować?', answer: 'Ustalamy bezpłatnie najbliższy możliwy termin. Przy ślubie materiał z drona jest dodatkiem zależnym od pogody i możliwości wykonania lotu w danym miejscu.' },
                { id: 'faq-ready', question: 'Czy zdjęcia i filmy są gotowe do publikacji?', answer: 'Tak. Otrzymujesz opracowane pliki w formatach dopasowanych do strony, ogłoszenia albo mediów społecznościowych — zgodnie z wybranym pakietem.' },
                { id: 'faq-ai', question: 'Czy na stronie pokazujesz obrazy wygenerowane przez AI jako realizacje?', answer: 'Nie. Portfolio służy do pokazania wykonanych przeze mnie materiałów. Ewentualna wizualizacja koncepcji wygenerowana lub istotnie zmieniona przez AI będzie wyraźnie oznaczona.' },
            ],
        },
        {
            id: 'drone-cta', type: 'cta', enabled: true, tone: 'dark', eyebrow: '', title: 'Masz miejsce lub wydarzenie do pokazania?',
            description: 'Wybierz najbliższy zakres. W formularzu podasz miasto, preferowany termin i najważniejsze zadanie materiału.',
            buttonLabel: 'Rozpocznij rezerwację', buttonHref: '/rezerwacja/dron?pakiet=nieruchomosc-foto&source=drone-offer-bottom',
        },
    ],
};

function cloneDefaultConfig(): DronePhotographyConfig {
    return JSON.parse(JSON.stringify(DEFAULT_DRONE_PHOTOGRAPHY_CONFIG)) as DronePhotographyConfig;
}

function isObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function parseDronePhotographyConfig(value: unknown): DronePhotographyConfig {
    let parsed = value;
    if (typeof value === 'string') {
        try { parsed = JSON.parse(value); } catch { return cloneDefaultConfig(); }
    }
    if (!isObject(parsed) || parsed.version !== 1 || !Array.isArray(parsed.modules)) return cloneDefaultConfig();

    const defaults = cloneDefaultConfig();
    const candidate = parsed as Partial<DronePhotographyConfig>;
    const packages = Array.isArray(candidate.packages)
        ? candidate.packages.filter(item => isObject(item) && typeof item.slug === 'string' && typeof item.name === 'string').map(item => ({
            ...item,
            price: Math.max(0, Number(item.price) || 0),
            features: Array.isArray(item.features) ? item.features.filter(feature => typeof feature === 'string') : [],
            active: item.active !== false,
        } as DronePhotographyPackage))
        : defaults.packages;
    const allowedModuleTypes = new Set(defaults.modules.map(module => module.type));
    const rawModules = Array.isArray(candidate.modules) ? candidate.modules : [];
    const modules = rawModules
        .filter(module => isObject(module) && typeof module.type === 'string' && allowedModuleTypes.has(module.type as DronePhotographyModule['type']))
        .map(module => {
            const template = defaults.modules.find(item => item.type === module.type);
            return { ...template, ...module } as DronePhotographyModule;
        });

    return {
        version: 1,
        theme: isObject(candidate.theme) ? { ...defaults.theme, ...candidate.theme } as DroneTheme : defaults.theme,
        areas: Array.isArray(candidate.areas) ? candidate.areas.filter(area => typeof area === 'string' && area.trim()).map(area => area.trim()) : defaults.areas,
        packages: packages.length ? packages : defaults.packages,
        booking: isObject(candidate.booking) ? { ...defaults.booking, ...candidate.booking } as DroneBookingCopy : defaults.booking,
        seo: isObject(candidate.seo) ? { ...defaults.seo, ...candidate.seo } as DronePhotographyConfig['seo'] : defaults.seo,
        modules: modules.length ? modules : defaults.modules,
    };
}

export function validateDronePhotographyConfig(value: unknown): { valid: true } | { valid: false; error: string } {
    let parsed = value;
    if (typeof value === 'string') {
        try { parsed = JSON.parse(value); } catch { return { valid: false, error: 'Dane modułów nie są poprawnym JSON-em.' }; }
    }
    if (!isObject(parsed) || parsed.version !== 1) return { valid: false, error: 'Nieobsługiwana wersja konfiguracji strony.' };
    if (!Array.isArray(parsed.modules) || parsed.modules.length === 0) return { valid: false, error: 'Strona musi zawierać co najmniej jeden moduł.' };
    if (!Array.isArray(parsed.packages) || parsed.packages.length === 0) return { valid: false, error: 'Oferta musi zawierać co najmniej jeden pakiet.' };
    if (!Array.isArray(parsed.areas) || parsed.areas.filter(area => typeof area === 'string' && area.trim()).length === 0) return { valid: false, error: 'Podaj co najmniej jeden obszar działania.' };

    const slugs = new Set<string>();
    const moduleIds = new Set<string>();
    for (const module of parsed.modules) {
        if (!isObject(module) || typeof module.id !== 'string' || !module.id || typeof module.type !== 'string') return { valid: false, error: 'Każdy moduł musi mieć typ i identyfikator.' };
        if (moduleIds.has(module.id)) return { valid: false, error: `Identyfikator modułu „${module.id}” występuje więcej niż raz.` };
        moduleIds.add(module.id);
    }
    let activeCount = 0;
    for (const item of parsed.packages) {
        if (!isObject(item) || typeof item.slug !== 'string' || !item.slug.trim() || typeof item.name !== 'string' || !item.name.trim()) {
            return { valid: false, error: 'Każdy pakiet musi mieć nazwę i identyfikator.' };
        }
        if (slugs.has(item.slug)) return { valid: false, error: `Identyfikator pakietu „${item.slug}” występuje więcej niż raz.` };
        slugs.add(item.slug);
        if (!Number.isFinite(Number(item.price)) || Number(item.price) < 0) return { valid: false, error: `Pakiet „${item.name}” ma nieprawidłową cenę.` };
        if (item.active !== false) activeCount += 1;
    }
    if (activeCount === 0) return { valid: false, error: 'Co najmniej jeden pakiet musi być aktywny.' };
    return { valid: true };
}

export const DRONE_PHOTOGRAPHY_PACKAGES: readonly DronePhotographyPackage[] = DEFAULT_DRONE_PHOTOGRAPHY_CONFIG.packages;
export const DRONE_PHOTOGRAPHY_AREAS = DEFAULT_DRONE_PHOTOGRAPHY_CONFIG.areas;

export function getDronePhotographyPackage(slug: string | null | undefined, packages: readonly DronePhotographyPackage[] = DRONE_PHOTOGRAPHY_PACKAGES): DronePhotographyPackage {
    const activePackages = packages.filter(item => item.active !== false);
    return activePackages.find(item => item.slug === slug) || activePackages[0] || packages[0] || DEFAULT_DRONE_PHOTOGRAPHY_CONFIG.packages[0];
}

export function droneBookingHref(packageSlug: DronePhotographyPackageSlug, source: string) {
    const params = new URLSearchParams({ pakiet: packageSlug, source });
    return `/rezerwacja/dron?${params.toString()}`;
}

export function formatDronePrice(item: DronePhotographyPackage) {
    const price = new Intl.NumberFormat('pl-PL').format(item.price);
    if (item.pricePrefix === '+') return `+${price} zł`;
    if (item.pricePrefix) return `${item.pricePrefix} ${price} zł`;
    return `${price} zł`;
}

export function safeDroneHref(value: string | undefined, fallback = '#') {
    if (!value) return fallback;
    if (value.startsWith('/') || value.startsWith('#')) return value;
    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol) ? url.toString() : fallback;
    } catch {
        return fallback;
    }
}
