import type { PageSection } from '@/components/admin/PageBuilder';

export const AERO_SITE = {
    name: 'Aero Analiza',
    legalName: 'Foto-Dron Przemysław Właśniewski',
    url: 'https://aeroanaliza.pl',
    email: 'pwlasniewski@gmail.com',
    phone: '+48 530 788 694',
    phoneHref: '+48530788694',
    locality: 'Płużnica',
    region: 'kujawsko-pomorskie',
} as const;

export type AeroPageDefinition = {
    slug: string;
    title: string;
    description: string;
    keywords: string[];
    changeFrequency: 'weekly' | 'monthly' | 'yearly';
    priority: number;
    serviceName?: string;
    serviceDescription?: string;
    faqs?: Array<{ question: string; answer: string }>;
    sections: PageSection[];
};

const contactSection = (service: string): PageSection => ({
    id: `aero-contact-${service}`,
    type: 'b2b_contact',
    data: {
        title: 'Opisz obiekt. Otrzymasz zakres i wycenę.',
        subtitle: 'Podaj lokalizację, rodzaj obiektu i oczekiwany rezultat. Odpowiem osobiście po ocenie wykonalności i warunków lotu.',
        defaultService: service,
        featureTitle: 'Bez zobowiązań',
        featureContent: 'Najpierw ustalamy, czy lot i pomiar odpowiedzą na Twoje pytanie.',
    },
});

const processSection = (steps: Array<{ title: string; description: string }>): PageSection => ({
    id: 'aero-process',
    type: 'b2b_process',
    data: {
        title: 'Od pytania technicznego do użytecznej dokumentacji',
        subtitle: 'Przebieg zlecenia',
        description: 'Zakres lotu dobieram do decyzji, którą klient ma podjąć — nie do liczby efektownych ujęć.',
        featureTitle: 'Odpowiedzialność operatora',
        featureContent: 'Ocena warunków, bezpieczeństwa i ograniczeń przed realizacją.',
        b2b_process: steps.map((step, index) => ({ id: `step-${index + 1}`, ...step })),
    },
});

const sharedSteps = [
    { title: 'Krótka kwalifikacja', description: 'Ustalam problem, lokalizację, wielkość obiektu, oczekiwany rezultat i termin.' },
    { title: 'Plan pomiaru i lotu', description: 'Dobieram warunki, ujęcia oraz zakres danych. Informuję o ograniczeniach metody.' },
    { title: 'Rejestracja w terenie', description: 'Wykonuję uzgodnione ujęcia RGB lub termiczne, zachowując spójny sposób dokumentowania.' },
    { title: 'Selekcja i przekazanie', description: 'Klient otrzymuje uporządkowany materiał i opis obserwacji w uzgodnionym formacie.' },
];

const pages: Record<string, AeroPageDefinition> = {
    '': {
        slug: '',
        title: 'Termowizja i inspekcje dronem w kujawsko-pomorskim',
        description: 'Termowizja, inspekcje dachów i fotowoltaiki oraz monitoring inwestycji dronem DJI Mavic 3 Thermal. Płużnica, Toruń, Bydgoszcz i kujawsko-pomorskie.',
        keywords: ['termowizja dronem kujawsko-pomorskie', 'inspekcja dronem Toruń', 'DJI Mavic 3 Thermal', 'inspekcja dachu dronem', 'inspekcja fotowoltaiki dronem'],
        changeFrequency: 'weekly',
        priority: 1,
        serviceName: 'Inspekcje i termowizja dronem',
        serviceDescription: 'Dokumentacja termiczna i RGB obiektów, dachów, instalacji fotowoltaicznych oraz postępów inwestycji.',
        faqs: [
            { question: 'Gdzie realizowane są zlecenia?', answer: 'Bazą operacyjną jest Płużnica. Zlecenia realizowane są w województwie kujawsko-pomorskim, w tym w rejonie Torunia, Bydgoszczy, Grudziądza, Wąbrzeźna i Brodnicy. Dalszy dojazd jest wyceniany indywidualnie.' },
            { question: 'Czy sam lot wystarczy do postawienia diagnozy?', answer: 'Nie zawsze. Materiał z drona jest dokumentacją obserwacji i wskazaniem obszarów do dalszej weryfikacji. Zakres wniosków zależy od warunków, rodzaju obiektu i uzgodnionego celu badania.' },
        ],
        sections: [
            {
                id: 'aero-content-v2',
                type: 'b2b_hero',
                data: {
                    aeroContentVersion: 2,
                    tag: 'Aero Analiza • kujawsko-pomorskie',
                    title: 'Dane z drona, które pomagają podjąć decyzję',
                    subtitle: 'Termowizja i dokumentacja RGB dachów, instalacji fotowoltaicznych oraz inwestycji. Zakres dobierany do konkretnego problemu technicznego.',
                    image: '/assets/drone/drone-home.webp',
                    buttonText: 'Opisz obiekt i odbierz wycenę',
                    buttonLink: '#wycena',
                },
            },
            {
                id: 'aero-services',
                type: 'features',
                data: {
                    title: 'Usługi zaprojektowane pod realny rezultat',
                    subtitle: 'Każda usługa ma określone dane wejściowe, warunki wykonania i materiał końcowy.',
                    items: [
                        { id: 'thermal', icon: 'thermometer', title: 'Termowizja dronem', text: 'Obraz termiczny 640 × 512 px z kamery DJI Mavic 3 Thermal do lokalizacji anomalii wymagających weryfikacji.', href: '/termowizja' },
                        { id: 'pv', icon: 'zap', title: 'Inspekcja fotowoltaiki', text: 'Przegląd instalacji z powietrza w warunkach dobranych do celu badania oraz uporządkowanie obserwacji.', href: '/inspekcja-fotowoltaiki-dronem' },
                        { id: 'roof', icon: 'shield', title: 'Inspekcja dachu', text: 'Dokumentacja trudno dostępnych połaci, obróbek i detali bez rutynowego wchodzenia na dach.', href: '/inspekcja-dachu-dronem' },
                        { id: 'monitoring', icon: 'building', title: 'Monitoring inwestycji', text: 'Powtarzalne ujęcia postępu prac i czytelny materiał dla inwestora, wykonawcy lub zarządcy.', href: '/monitoring' },
                    ],
                },
            },
            {
                id: 'aero-experience',
                type: 'image_text',
                data: {
                    subtitle: 'Praktyka zamiast obietnic',
                    title: 'Najpierw pytanie, potem lot',
                    content: '<p>Przed realizacją ustalam, czego klient chce się dowiedzieć i czy kamera termiczna lub zoom rzeczywiście pomogą. Na miejscu odpowiadam za ocenę warunków, bezpieczne wykonanie lotu, spójność ujęć i czytelne przekazanie materiału.</p><p>Nie przedstawiam zdjęcia termicznego jako samodzielnej ekspertyzy budowlanej. Jeżeli obserwacja wymaga pomiaru kontaktowego lub opinii branżowej, zaznaczam to wprost.</p>',
                    image: '/assets/drone/drone-home.webp',
                    imagePosition: 'center center',
                    layout: 'right',
                    buttonText: 'Zobacz obszar działania',
                    buttonLink: '/kujawsko-pomorskie',
                },
            },
            processSection(sharedSteps),
            {
                id: 'aero-faq',
                type: 'features',
                data: {
                    title: 'Najczęstsze pytania przed zleceniem',
                    items: [
                        { id: 'faq-area', icon: 'briefcase', title: 'Jaki jest obszar działania?', text: 'Całe kujawsko-pomorskie. Bazą jest Płużnica; koszt dalszego dojazdu ustalam przed realizacją.' },
                        { id: 'faq-deliverable', icon: 'camera', title: 'Co otrzymam?', text: 'Zakres ustalamy przed lotem: wybrane pliki RGB/termiczne, opis obserwacji i — jeżeli zamówiony — uporządkowany raport.' },
                        { id: 'faq-weather', icon: 'shield', title: 'Czy pogoda ma znaczenie?', text: 'Tak. Wiatr, opady, nasłonecznienie i temperatura wpływają na bezpieczeństwo oraz wartość danych. Termin może wymagać zmiany.' },
                        { id: 'faq-price', icon: 'zap', title: 'Od czego zależy cena?', text: 'Od lokalizacji, wielkości i typu obiektu, celu, liczby ujęć, warunków operacyjnych oraz formatu opracowania.' },
                    ],
                },
            },
            contactSection('Konsultacja / dobór usługi'),
        ],
    },
    'termowizja': {
        slug: 'termowizja',
        title: 'Termowizja dronem DJI Mavic 3 Thermal — kujawsko-pomorskie',
        description: 'Termowizja dronem obiektów, dachów, instalacji i infrastruktury. Kamera 640 × 512 px, kwalifikacja warunków i dokumentacja obserwacji.',
        keywords: ['termowizja dronem', 'badanie termowizyjne dronem Toruń', 'kamera termowizyjna dron Bydgoszcz', 'DJI Mavic 3 Thermal termowizja'],
        changeFrequency: 'monthly',
        priority: 0.9,
        serviceName: 'Termowizja dronem',
        serviceDescription: 'Rejestracja i uporządkowanie obrazów termicznych obiektów oraz infrastruktury przy użyciu DJI Mavic 3 Thermal.',
        faqs: [
            { question: 'Jaką rozdzielczość ma kamera termowizyjna?', answer: 'DJI Mavic 3 Thermal rejestruje obraz termiczny w rozdzielczości 640 × 512 pikseli. Producent podaje czułość termiczną NETD ≤50 mK przy F1.0.' },
            { question: 'Czy termowizja działa w każdych warunkach?', answer: 'Nie. Wynik zależy m.in. od różnicy temperatur, nasłonecznienia, wiatru, opadów, emisyjności powierzchni i celu pomiaru. Termin ustala się po kwalifikacji.' },
        ],
        sections: [
            { id: 'aero-content-v2', type: 'b2b_hero', data: { aeroContentVersion: 2, tag: 'Termowizja z powietrza', title: 'Zlokalizuj anomalię, zanim zaplanujesz dalszą diagnostykę', subtitle: 'Radiometryczny obraz termiczny i równoległy materiał RGB pomagają wskazać miejsca wymagające sprawdzenia na obiekcie.', image: '/assets/drone/drone-home.webp', buttonText: 'Wyceń badanie termowizyjne', buttonLink: '#wycena' } },
            { id: 'thermal-scope', type: 'features', data: { title: 'Co można sprawdzić z powietrza', subtitle: 'Możliwość wykonania zależy od geometrii obiektu, warunków i różnicy temperatur.', items: [
                { id: 'roof', icon: 'thermometer', title: 'Połacie i stropodachy', text: 'Wskazanie niejednorodności rozkładu temperatury do dalszej weryfikacji źródła.' },
                { id: 'facade', icon: 'building', title: 'Elewacje i trudno dostępne części', text: 'Dokumentacja termiczna miejsc, których nie da się wygodnie objąć pomiarem z poziomu gruntu.' },
                { id: 'heat', icon: 'zap', title: 'Infrastruktura cieplna', text: 'Poszukiwanie obszarów o podwyższonej temperaturze, jeśli warunki i konstrukcja pozwalają je ujawnić.' },
                { id: 'compare', icon: 'camera', title: 'Porównanie RGB i termowizji', text: 'Zestawienie obu obrazów ułatwia przypisanie obserwacji termicznej do konkretnego elementu obiektu.' },
            ] } },
            processSection(sharedSteps),
            contactSection('Termowizja dronem'),
        ],
    },
    'inspekcja-fotowoltaiki-dronem': {
        slug: 'inspekcja-fotowoltaiki-dronem',
        title: 'Inspekcja fotowoltaiki dronem — kujawsko-pomorskie',
        description: 'Termowizyjna inspekcja instalacji fotowoltaicznej dronem. Kwalifikacja warunków, materiał RGB i termiczny oraz wskazanie obserwacji do weryfikacji.',
        keywords: ['inspekcja fotowoltaiki dronem', 'termowizja paneli fotowoltaicznych', 'badanie PV dronem Toruń', 'inspekcja paneli Bydgoszcz'],
        changeFrequency: 'monthly',
        priority: 0.9,
        serviceName: 'Inspekcja fotowoltaiki dronem',
        serviceDescription: 'Dokumentacja RGB i termiczna instalacji PV oraz wskazanie obszarów wymagających dalszej weryfikacji.',
        faqs: [
            { question: 'Czy dron wykrywa przyczynę usterki panelu?', answer: 'Obraz termiczny może wskazać anomalię, ale nie zawsze określa jej przyczynę. Ostateczna diagnoza może wymagać pomiarów elektrycznych i kontroli wykonanej przez uprawnionego specjalistę.' },
            { question: 'Jakie warunki są potrzebne?', answer: 'Warunki dobiera się do celu inspekcji. Znaczenie mają m.in. nasłonecznienie, zachmurzenie, wiatr, zabrudzenie i obciążenie instalacji.' },
        ],
        sections: [
            { id: 'aero-content-v2', type: 'b2b_hero', data: { aeroContentVersion: 2, tag: 'Instalacje PV', title: 'Sprawdź instalację fotowoltaiczną bez przypadkowych ujęć', subtitle: 'Plan lotu i sposób rejestracji podporządkowane są porównywalności obrazów oraz lokalizacji obserwowanych anomalii.', image: '/assets/drone/drone-home.webp', buttonText: 'Wyceń inspekcję PV', buttonLink: '#wycena' } },
            { id: 'pv-delivery', type: 'features', data: { title: 'Zakres uzgadniany przed lotem', items: [
                { id: 'qualify', icon: 'shield', title: 'Kwalifikacja warunków', text: 'Sprawdzamy, czy termin i stan pracy instalacji pozwolą zebrać użyteczny materiał.' },
                { id: 'capture', icon: 'camera', title: 'Materiał RGB i termiczny', text: 'Ujęcia pomagają przypisać obserwację do fragmentu instalacji lub modułu.' },
                { id: 'observations', icon: 'thermometer', title: 'Lista obserwacji', text: 'Materiał porządkuję tak, aby ułatwić późniejszą kontrolę techniczną.' },
                { id: 'limits', icon: 'briefcase', title: 'Jasne ograniczenia', text: 'Raport z lotu nie zastępuje pomiarów elektrycznych ani diagnozy osoby z właściwymi uprawnieniami.' },
            ] } },
            processSection(sharedSteps),
            contactSection('Inspekcja fotowoltaiki dronem'),
        ],
    },
    'inspekcja-dachu-dronem': {
        slug: 'inspekcja-dachu-dronem',
        title: 'Inspekcja dachu dronem — Toruń, Bydgoszcz i kujawsko-pomorskie',
        description: 'Dokumentacja dachów dronem: połacie, obróbki, rynny i trudno dostępne detale. Ujęcia RGB, zoom i opcjonalna termowizja.',
        keywords: ['inspekcja dachu dronem', 'przegląd dachu dron Toruń', 'zdjęcia dachu Bydgoszcz', 'termowizja dachu dronem'],
        changeFrequency: 'monthly',
        priority: 0.9,
        serviceName: 'Inspekcja dachu dronem',
        serviceDescription: 'Dokumentacja wizualna i opcjonalnie termiczna dachów oraz trudno dostępnych detali.',
        faqs: [
            { question: 'Czy inspekcja dronem zastępuje oględziny na dachu?', answer: 'Nie w każdym przypadku. Pozwala bezpiecznie udokumentować wiele miejsc i zaplanować dalsze działania, ale nie zastępuje badań dotykowych, odkrywek ani opinii konstruktora.' },
            { question: 'Jakie elementy można sfotografować?', answer: 'W zależności od dostępu i warunków: połacie, obróbki, kominy, rynny, kosze, połączenia i miejsca wskazane przez zamawiającego.' },
        ],
        sections: [
            { id: 'aero-content-v2', type: 'b2b_hero', data: { aeroContentVersion: 2, tag: 'Dachy i elewacje', title: 'Zobacz trudno dostępne miejsca przed zamówieniem prac', subtitle: 'Czytelne ujęcia połaci i detali pomagają zarządcy, dekarzowi lub inwestorowi zaplanować dalszą kontrolę.', image: '/assets/drone/drone-home.webp', buttonText: 'Wyceń inspekcję dachu', buttonLink: '#wycena' } },
            { id: 'roof-scope', type: 'features', data: { title: 'Dokumentacja dopasowana do celu', items: [
                { id: 'details', icon: 'camera', title: 'Detale konstrukcji i obróbek', text: 'Ujęcia wskazanych elementów z bezpiecznie dostępnych kierunków.' },
                { id: 'overview', icon: 'building', title: 'Widok całej połaci', text: 'Kontekst ułatwiający zlokalizowanie miejsca i przekazanie go wykonawcy.' },
                { id: 'thermal', icon: 'thermometer', title: 'Opcjonalna termowizja', text: 'Dodatkowa warstwa obserwacji, gdy konstrukcja i warunki dają podstawę do badania.' },
                { id: 'handover', icon: 'briefcase', title: 'Materiał dla dalszej kontroli', text: 'Pliki i opis można przekazać zarządcy lub właściwemu specjaliście branżowemu.' },
            ] } },
            processSection(sharedSteps),
            contactSection('Inspekcja dachu dronem'),
        ],
    },
    'monitoring': {
        slug: 'monitoring',
        title: 'Monitoring inwestycji dronem — kujawsko-pomorskie',
        description: 'Powtarzalna dokumentacja postępu budowy z drona dla inwestorów, wykonawców i zarządców w województwie kujawsko-pomorskim.',
        keywords: ['monitoring budowy dronem', 'dokumentacja postępu budowy', 'zdjęcia inwestycji z drona Toruń', 'monitoring inwestycji Bydgoszcz'],
        changeFrequency: 'monthly',
        priority: 0.8,
        serviceName: 'Monitoring inwestycji dronem',
        serviceDescription: 'Cykliczne, porównywalne ujęcia postępu prac z uzgodnionych kierunków.',
        faqs: [
            { question: 'Jak często wykonywane są loty?', answer: 'Harmonogram wynika z etapów inwestycji — np. co tydzień, co dwa tygodnie, co miesiąc lub przy kamieniach milowych.' },
            { question: 'Czy ujęcia będą porównywalne?', answer: 'Przed pierwszym lotem ustalamy listę kierunków i punktów obserwacji. Dokładna powtarzalność zależy również od warunków i ograniczeń przestrzeni powietrznej.' },
        ],
        sections: [
            { id: 'aero-content-v2', type: 'b2b_hero', data: { aeroContentVersion: 2, tag: 'Dokumentacja postępu', title: 'Jedna inwestycja. Te same kierunki. Czytelna historia zmian.', subtitle: 'Cykliczne zdjęcia i wideo z uzgodnionych punktów pomagają raportować postęp bez mieszania tej usługi z termowizją.', image: '/assets/drone/drone-home.webp', buttonText: 'Ustal harmonogram monitoringu', buttonLink: '#wycena' } },
            { id: 'monitoring-scope', type: 'features', data: { title: 'Co porządkujemy przed pierwszym lotem', items: [
                { id: 'views', icon: 'camera', title: 'Lista ujęć', text: 'Kierunki, wysokości i elementy ważne dla odbiorcy materiału.' },
                { id: 'schedule', icon: 'building', title: 'Harmonogram', text: 'Terminy powiązane z etapami robót, a nie przypadkowe wizyty.' },
                { id: 'files', icon: 'briefcase', title: 'Sposób przekazania', text: 'Spójne nazwy i foldery ułatwiają porównywanie kolejnych serii.' },
                { id: 'weather', icon: 'shield', title: 'Zasady pogodowe', text: 'Warunki graniczne i sposób uzgadniania terminu zastępczego.' },
            ] } },
            processSection(sharedSteps),
            contactSection('Monitoring inwestycji dronem'),
        ],
    },
    'kujawsko-pomorskie': {
        slug: 'kujawsko-pomorskie',
        title: 'Usługi dronem w kujawsko-pomorskim — Aero Analiza',
        description: 'Termowizja i inspekcje dronem z bazy w Płużnicy. Obsługa Torunia, Bydgoszczy, Grudziądza, Wąbrzeźna, Brodnicy i całego województwa.',
        keywords: ['usługi dronem kujawsko-pomorskie', 'termowizja dron Toruń', 'inspekcje dron Bydgoszcz', 'operator drona Płużnica'],
        changeFrequency: 'monthly',
        priority: 0.75,
        serviceName: 'Usługi dronem w województwie kujawsko-pomorskim',
        serviceDescription: 'Termowizja, inspekcje i dokumentacja inwestycji z bazy operacyjnej w Płużnicy.',
        sections: [
            { id: 'aero-content-v2', type: 'b2b_hero', data: { aeroContentVersion: 2, tag: 'Obszar działania', title: 'Płużnica, Toruń, Bydgoszcz i całe kujawsko-pomorskie', subtitle: 'Dojazd oraz warunki operacyjne sprawdzam przed potwierdzeniem terminu. Dalsze realizacje są możliwe po indywidualnym uzgodnieniu.', image: '/assets/drone/drone-home.webp', buttonText: 'Sprawdź możliwość realizacji', buttonLink: '#wycena' } },
            { id: 'regional-services', type: 'features', data: { title: 'Najczęściej obsługiwane potrzeby', items: [
                { id: 'thermal', icon: 'thermometer', title: 'Termowizja obiektów', text: 'Dokumentacja termiczna i RGB dla budynków oraz infrastruktury.' },
                { id: 'pv', icon: 'zap', title: 'Instalacje fotowoltaiczne', text: 'Ujęcia termiczne i wizualne do wskazania miejsc wymagających kontroli.' },
                { id: 'roof', icon: 'shield', title: 'Dachy i elewacje', text: 'Dokumentacja trudno dostępnych elementów bez rutynowej pracy na wysokości.' },
                { id: 'build', icon: 'building', title: 'Inwestycje', text: 'Cykliczne ujęcia postępu budowy dla inwestora i wykonawcy.' },
            ] } },
            contactSection('Usługa dronem — kujawsko-pomorskie'),
        ],
    },
};

export const AERO_PUBLIC_SLUGS = Object.keys(pages);

export function getAeroCmsSlugCandidates(slug: string) {
    const normalized = slug.replace(/^\/+|\/+$/g, '');
    return normalized ? [normalized, `b2b-${normalized}`, `b2b/${normalized}`] : ['b2b', 'strona-b2b', 'oferta-b2b'];
}

export function getAeroPageDefinition(slug: string) {
    const page = pages[slug.replace(/^\/+|\/+$/g, '')];
    if (!page) return undefined;
    let sections = page.sections.map(section => {
        const data = (section as PageSection & { data?: Record<string, unknown> }).data;
        const { data: _nestedData, ...sectionWithoutData } = section as PageSection & { data?: Record<string, unknown> };
        const flattened = data ? ({ ...sectionWithoutData, ...data } as PageSection & { items?: Array<{ id: string; title: string; text: string; href?: string }> }) : sectionWithoutData as PageSection & { items?: Array<{ id: string; title: string; text: string; href?: string }> };
        if (flattened.type === 'features' && flattened.items && !flattened.features) {
            const { items, ...sectionWithoutItems } = flattened;
            return {
                ...sectionWithoutItems,
                features: items.map(item => ({ id: item.id, title: item.title, items: [item.text], enabled: true, buttonText: item.href ? 'Sprawdź zakres' : undefined, buttonLink: item.href })),
            } as PageSection;
        }
        return flattened;
    });
    if (page.faqs?.length && !sections.some(section => section.id === 'aero-faq')) {
        const faqSection: PageSection = {
            id: 'aero-faq', type: 'features', title: 'Pytania przed zleceniem',
            features: page.faqs.map((faq, index) => ({ id: `faq-${index + 1}`, title: faq.question, items: [faq.answer], enabled: true })),
        };
        const contactIndex = sections.findIndex(section => section.type === 'b2b_contact');
        sections = contactIndex >= 0 ? [...sections.slice(0, contactIndex), faqSection, ...sections.slice(contactIndex)] : [...sections, faqSection];
    }
    const visibleFaqs = faqFromSections(sections);
    return {
        ...page,
        faqs: visibleFaqs,
        sections,
    };
}

function plainText(value: string) {
    return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function faqFromSections(sections: PageSection[]) {
    const faqSection = sections.find(section => section.id === 'aero-faq');
    return (faqSection?.features || []).filter(feature => feature.enabled).map(feature => ({ question: plainText(feature.title), answer: plainText(feature.items.join(' ')) }));
}

export function applyAeroCmsToDefinition(
    definition: AeroPageDefinition,
    cmsPage: { title?: string | null; meta_title?: string | null; meta_description?: string | null } | null,
    sections: PageSection[],
): AeroPageDefinition {
    const hero = sections.find(section => section.type === 'b2b_hero');
    return {
        ...definition,
        title: cmsPage?.meta_title || definition.title,
        description: cmsPage?.meta_description || definition.description,
        serviceName: cmsPage?.title || definition.serviceName,
        serviceDescription: hero?.subtitle || definition.serviceDescription,
        faqs: faqFromSections(sections),
        sections,
    };
}

export function hasAeroContentVersion(sections: PageSection[]) {
    return sections.some(section => {
        const data = (section as PageSection & { data?: Record<string, unknown> }).data;
        return section.id === 'aero-content-v2' || data?.aeroContentVersion === 2 || (section as PageSection & { aeroContentVersion?: number }).aeroContentVersion === 2;
    });
}

export function extractLegacyThermalMedia(sections: PageSection[]) {
    const section = sections.find(item => ['thermal_hero', 'thermal_slider'].includes(item.type));
    if (!section) return [];

    const data = ((section as PageSection & { data?: Record<string, unknown> }).data || section) as Record<string, unknown>;
    const sliderPair = Array.isArray(data.thermalSections)
        ? data.thermalSections.find(item => item && typeof item === 'object' && 'visualImage' in item && 'thermalImage' in item) as Record<string, unknown> | undefined
        : undefined;
    const heroPair = Array.isArray(data.thermal_hero_slides)
        ? data.thermal_hero_slides.find(item => item && typeof item === 'object' && 'visualMedia' in item && 'thermalMedia' in item) as Record<string, unknown> | undefined
        : undefined;
    const pair = sliderPair || heroPair || data;
    const visualMedia = typeof pair.visualMedia === 'string' ? pair.visualMedia : typeof pair.visualImage === 'string' ? pair.visualImage : typeof pair.image === 'string' ? pair.image : '';
    const thermalMedia = typeof pair.thermalMedia === 'string' ? pair.thermalMedia : typeof pair.thermalImage === 'string' ? pair.thermalImage : '';
    if (!visualMedia || !thermalMedia) return [];

    const shortText = (value: unknown, fallback: string) => typeof value === 'string' && value.trim() && value.length <= 100 ? value.trim() : fallback;
    const objectPosition = typeof pair.objectPosition === 'string' && pair.objectPosition.length <= 50 ? pair.objectPosition : 'center center';
    const objectPositionMobile = typeof pair.objectPositionMobile === 'string' && pair.objectPositionMobile.length <= 50 ? pair.objectPositionMobile : objectPosition;

    return [{
        id: `legacy-media-${section.id}`,
        type: 'thermal_hero',
        thermal_hero_slides: [{
            id: `legacy-pair-${section.id}`,
            category: 'Materiał z realizacji',
            title: 'Porównanie obrazu RGB i termicznego',
            description: 'Para wymaga ręcznej kontroli zgodności kadru i warunków rejestracji przed użyciem trybu nakładania.',
            visualMedia,
            thermalMedia,
            mediaType: pair.mediaType === 'video' ? 'video' : 'image',
            labelLeft: shortText(pair.labelLeft, 'Obraz rzeczywisty'),
            labelRight: shortText(pair.labelRight, 'Termowizja'),
            alignmentStatus: 'side_by_side_only',
            objectPosition,
            objectPositionMobile,
        }],
    } as PageSection];
}

export function mergeAeroPageSections(definition: AeroPageDefinition, cmsSections: PageSection[]) {
    if (hasAeroContentVersion(cmsSections)) return cmsSections;
    const mediaSections = extractLegacyThermalMedia(cmsSections);
    if (mediaSections.length === 0) return definition.sections;
    return [definition.sections[0], ...mediaSections, ...definition.sections.slice(1)];
}
