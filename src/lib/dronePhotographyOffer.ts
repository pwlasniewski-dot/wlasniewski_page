export type DronePhotographyPackageSlug =
    | 'nieruchomosc-foto'
    | 'foto-film'
    | 'firma-obiekt'
    | 'slub-dodatek';

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
};

export const DRONE_PHOTOGRAPHY_PACKAGES: readonly DronePhotographyPackage[] = [
    {
        slug: 'nieruchomosc-foto',
        name: 'Nieruchomość z powietrza',
        shortName: 'Zdjęcia nieruchomości',
        audience: 'nieruchomosc',
        price: 449,
        summary: 'Dom, działka, pensjonat lub obiekt przeznaczony do sprzedaży i wynajmu.',
        delivery: 'gotowe zdjęcia do 2 dni roboczych od lotu',
        features: [
            '10 wybranych i opracowanych zdjęć',
            'ujęcia bryły, otoczenia i dojazdu',
            'pliki do ogłoszeń, strony i mediów społecznościowych',
            'jedna lokalizacja i do 60 minut pracy na miejscu',
        ],
    },
    {
        slug: 'foto-film',
        name: 'Zdjęcia i krótki film',
        shortName: 'Zdjęcia + film',
        audience: 'nieruchomosc',
        price: 990,
        summary: 'Pełniejsza prezentacja nieruchomości, obiektu noclegowego lub miejsca na wydarzenia.',
        delivery: 'gotowy materiał do 3 dni roboczych od lotu',
        features: [
            '12 wybranych i opracowanych zdjęć',
            'film 30–45 sekund z montażem i muzyką',
            'wersja pozioma oraz krótki pionowy materiał do social mediów',
            'pliki przygotowane do publikacji w internecie',
        ],
        featured: true,
    },
    {
        slug: 'firma-obiekt',
        name: 'Firma i obiekt',
        shortName: 'Firma / obiekt',
        audience: 'firma',
        price: 1290,
        pricePrefix: 'od',
        summary: 'Materiał do strony firmy, kampanii, prezentacji inwestycji lub promocji miejsca.',
        delivery: 'termin oddania ustalany przed potwierdzeniem zlecenia',
        features: [
            'minimum 15 opracowanych zdjęć',
            'film 45–60 sekund z montażem',
            'formaty dopasowane do strony i mediów społecznościowych',
            'prawo wykorzystania materiału we własnej promocji firmy',
        ],
    },
    {
        slug: 'slub-dodatek',
        name: 'Ślub z drona',
        shortName: 'Dron do reportażu ślubnego',
        audience: 'slub',
        price: 690,
        pricePrefix: '+',
        summary: 'Dodatek do mojego reportażu ślubnego, realizowany przy odpowiedniej pogodzie i możliwości wykonania lotu.',
        delivery: 'razem z gotowym reportażem ślubnym',
        features: [
            '8–12 opracowanych zdjęć z powietrza',
            'krótki filmowy fragment miejsca i otoczenia',
            'ujęcie obiektu, pleneru i bezpiecznie ustawionej grupy',
            'sprawdzenie przestrzeni powietrznej przed realizacją',
        ],
    },
] as const;

export const DRONE_PHOTOGRAPHY_AREAS = [
    'Toruń',
    'Grudziądz',
    'Wąbrzeźno',
    'Chełmno',
    'Świecie',
] as const;

export function getDronePhotographyPackage(slug: string | null | undefined) {
    return DRONE_PHOTOGRAPHY_PACKAGES.find(item => item.slug === slug) || DRONE_PHOTOGRAPHY_PACKAGES[0];
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
