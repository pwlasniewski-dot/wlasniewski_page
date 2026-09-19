export type ServiceGrowthConfig = {
    slug: 'sesja-rodzinna' | 'slub';
    metaTitle: string;
    metaDescription: string;
    h1: string;
    eyebrow: string;
    intro: string;
    bookingService: 'Sesja' | 'Ślub';
    packageSummary: string;
};

const SERVICE_GROWTH_CONFIGS: Record<ServiceGrowthConfig['slug'], ServiceGrowthConfig> = {
    'sesja-rodzinna': {
        slug: 'sesja-rodzinna',
        metaTitle: 'Sesja rodzinna Toruń i okolice | Pakiety',
        metaDescription: 'Sesja rodzinna w Toruniu i okolicy. Wybierz zakres i sprawdź wolny termin online.',
        h1: 'Sesja rodzinna w Toruniu i okolicy',
        eyebrow: 'Sesje rodzinne',
        intro: 'Fotografuję rodziny w domu, w plenerze albo w miejscu, które wspólnie ustalimy. Przed rezerwacją wybierasz zakres i termin. Jeżeli nie wiesz, który pakiet będzie odpowiedni, napisz do mnie.',
        bookingService: 'Sesja',
        packageSummary: 'Pakiety rodzinne obejmują różny czas fotografowania, liczbę gotowych zdjęć i dodatki. Wszystkie ceny widzisz przed wyborem terminu.',
    },
    slub: {
        slug: 'slub',
        metaTitle: 'Fotograf ślubny Toruń i okolice | Pakiety',
        metaDescription: 'Fotograf ślubny w Toruniu i okolicy. Zdjęcia od przygotowań do oczepin, reportaż z przyjęcia i sesja ślubna. Sprawdź termin i zakres fotografii.',
        h1: 'Fotograf ślubny w Toruniu i okolicy',
        eyebrow: 'Fotografia ślubna',
        intro: 'Fotografuję śluby od przygotowań do oczepin. Jestem blisko najważniejszych momentów, ale nie ustawiam całego dnia pod aparat. Przed podpisaniem umowy ustalamy zakres, liczbę godzin i sesję, żeby wszystko było jasne.',
        bookingService: 'Ślub',
        packageSummary: 'Możecie wybrać samą ceremonię, ślub z kameralnym przyjęciem albo pełny reportaż od przygotowań do oczepin. Pakiety obejmują fotografię. Zakres i cena są widoczne przed rezerwacją.',
    },
};

export function getServiceGrowthConfig(slug: string): ServiceGrowthConfig | null {
    const normalized = slug.toLowerCase() as ServiceGrowthConfig['slug'];
    return SERVICE_GROWTH_CONFIGS[normalized] || null;
}
