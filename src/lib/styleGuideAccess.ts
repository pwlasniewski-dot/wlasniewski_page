export type GuideUserIdentity = {
    id: number;
    email: string;
};

export type GuideOfferOwner = {
    client_id: number | null;
    client_email: string | null;
};

export function isPrivateStyleGuideCategory(category: string | null | undefined): boolean {
    return category?.trim().toLowerCase() === 'pose';
}

export function canAccessGuideOffer(user: GuideUserIdentity, offer: GuideOfferOwner): boolean {
    if (offer.client_id !== null) {
        return offer.client_id === user.id;
    }

    return Boolean(
        offer.client_email
        && offer.client_email.trim().toLowerCase() === user.email.trim().toLowerCase()
    );
}

export function publicStyleGuideCategoryFilter() {
    return {
        OR: [
            { category: null },
            { category: { not: 'pose' } },
        ],
    };
}
