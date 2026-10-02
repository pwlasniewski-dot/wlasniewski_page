import { isPromotionWindowActive, type PublicPackagePromotion } from '@/lib/packagePromotionPricing';

export const DEFAULT_HOMEPAGE_PROMOTION_COPY = {
    title: 'Aktualne promocje',
    subtitle: 'Sprawdź zakres wybranego pakietu i dostępny termin.',
    buttonText: 'Wybierz pakiet i termin',
    emptyMessage: 'Aktualnie nie prowadzę promocji',
    noFeaturedMessage: 'Sprawdź aktualne ceny i pakiety',
    unavailableMessage: 'Nie mogę teraz potwierdzić promocji. Sprawdź aktualną ofertę w rezerwacji.',
    emptyButtonText: 'Zobacz ofertę i pakiety',
    emptyButtonLink: '/rezerwacja?source=home-promotions',
};

/** The featured loader owns CMS selection; this removes expired rows and aliases. */
export function activeHomepagePromotions(promotions: PublicPackagePromotion[], now = new Date()) {
    const unique = new Map<number, PublicPackagePromotion>();
    for (const promotion of promotions) {
        if (isPromotionWindowActive(promotion, now) && !unique.has(promotion.id)) unique.set(promotion.id, promotion);
    }
    return [...unique.values()];
}

export function homepagePromotionBookingHref(promotion: PublicPackagePromotion) {
    return `/rezerwacja?${new URLSearchParams({
        source: 'home-promotions', service: promotion.serviceName,
        package_id: String(promotion.packageId), promotion_id: String(promotion.id),
    })}`;
}
