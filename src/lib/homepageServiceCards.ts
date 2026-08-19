export interface HomepageServiceCard {
    title: string;
    label: string;
    service: string;
    copy: string;
    href: string;
    image: string;
    image_mobile?: string;
    image_position?: string;
    cta_label?: string;
    secondary_href?: string;
    secondary_label?: string;
}

export const DEFAULT_HOMEPAGE_SERVICE_CARDS: HomepageServiceCard[] = [
    { title: 'Sesja rodzinna', label: 'Bliskość', service: 'Sesja', copy: 'Dla rodziny, pary albo na spokojne zdjęcia kilku pokoleń.', href: '/rezerwacja?source=home&service=Sesja', image: '/assets/slider/fotografia-rodzinna-grudziadz-01.webp', image_position: 'center center' },
    { title: 'Ślub', label: 'Reportaż', service: 'Ślub', copy: 'Od ceremonii w urzędzie po pełny reportaż z wesela.', href: '/rezerwacja?source=home&service=Ślub', image: '/assets/slider/fotografia-slubna-torun-16.webp', image_position: 'center center' },
    { title: 'Urodziny i przyjęcia', label: 'Emocje', service: 'Urodziny', copy: 'Reportaż z urodzin, jubileuszu lub rodzinnej uroczystości.', href: '/rezerwacja?source=home&service=Urodziny', image: '/assets/slider/naturalne-zdjecia-rodzinne-lisewo-03.webp', image_position: 'center center' },
    {
        title: 'Fotografia z drona',
        label: 'Z powietrza',
        service: 'Dron',
        copy: 'Zdjęcia i filmy dla nieruchomości, firm oraz jako dodatek do reportażu ślubnego.',
        href: '/fotografia-z-drona?source=home-service-card',
        image: '/assets/drone/drone-home.webp',
        image_position: 'center center',
        cta_label: 'Zobacz ofertę i ceny',
        secondary_href: '/rezerwacja?service=Dron&source=home-service-card',
        secondary_label: 'Rezerwuj',
    },
];

export function mergeHomepageServiceCards(value: unknown): HomepageServiceCard[] {
    if (!Array.isArray(value)) return DEFAULT_HOMEPAGE_SERVICE_CARDS.map(card => ({ ...card }));

    return DEFAULT_HOMEPAGE_SERVICE_CARDS.map((fallback, index) => {
        const saved = value[index];
        const merged = saved && typeof saved === 'object' ? { ...fallback, ...saved } : { ...fallback };
        if (merged.service === 'Dron' && merged.secondary_href?.startsWith('/rezerwacja/dron')) {
            merged.secondary_href = merged.secondary_href
                .replace('/rezerwacja/dron?', '/rezerwacja?service=Dron&')
                .replace('/rezerwacja/dron', '/rezerwacja?service=Dron');
        }
        return merged;
    });
}
