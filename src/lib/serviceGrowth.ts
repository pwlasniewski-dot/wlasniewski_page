export type ServiceGrowthConfig = {
    slug: 'sesja-rodzinna' | 'slub';
    metaTitle: string;
    metaDescription: string;
    h1: string;
    eyebrow: string;
    intro: string;
    bookingService: 'Sesja' | 'Ślub';
    bookingLabel: string;
    packageSummary: string;
};

const SERVICE_GROWTH_CONFIGS: Record<ServiceGrowthConfig['slug'], ServiceGrowthConfig> = {
    'sesja-rodzinna': {
        slug: 'sesja-rodzinna',
        metaTitle: 'Sesja rodzinna Toruń i okolice | Pakiety od 750 zł',
        metaDescription: 'Sesja rodzinna w Toruniu, Grudziądzu, Wąbrzeźnie, Chełmnie lub Świeciu. Pakiety od 750 zł. Wybierz zakres i sprawdź wolny termin online.',
        h1: 'Sesja rodzinna w Toruniu i okolicy',
        eyebrow: 'Sesje rodzinne',
        intro: 'Fotografuję rodziny w domu, w plenerze albo w miejscu, które wspólnie ustalimy. Przed rezerwacją wybierasz zakres i termin. Jeżeli nie wiesz, który pakiet będzie odpowiedni, napisz do mnie.',
        bookingService: 'Sesja',
        bookingLabel: 'Wybierz pakiet i termin',
        packageSummary: 'Pakiety rodzinne obejmują różny czas fotografowania, liczbę gotowych zdjęć i dodatki. Wszystkie ceny widzisz przed wyborem terminu.',
    },
    slub: {
        slug: 'slub',
        metaTitle: 'Fotograf ślubny Toruń i okolice | Pakiety od 1900 zł',
        metaDescription: 'Fotografia ślubna w Toruniu i okolicy: ceremonia, kameralne przyjęcie lub pełny reportaż. Pakiety od 1900 zł. Sprawdź wolny termin online.',
        h1: 'Fotograf ślubny w Toruniu i okolicy',
        eyebrow: 'Fotografia ślubna',
        intro: 'Fotografuję ceremonie, przyjęcia, przygotowania oraz krótkie sesje w dniu ślubu. Zakres ustalamy przed podpisaniem umowy — nie musicie wybierać większego pakietu, niż rzeczywiście potrzebujecie.',
        bookingService: 'Ślub',
        bookingLabel: 'Wybierz zakres i termin',
        packageSummary: 'Możecie wybrać samą ceremonię, ślub z kameralnym przyjęciem albo pełny reportaż. Zakres i cena są widoczne przed rezerwacją.',
    },
};

export function getServiceGrowthConfig(slug: string): ServiceGrowthConfig | null {
    const normalized = slug.toLowerCase() as ServiceGrowthConfig['slug'];
    return SERVICE_GROWTH_CONFIGS[normalized] || null;
}

