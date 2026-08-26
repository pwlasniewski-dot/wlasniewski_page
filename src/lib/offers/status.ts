export const CLIENT_VISIBLE_OFFER_STATUSES = [
    'sent',
    'open',
    'accepted',
    'rejected',
    'expired',
    'unlock_requested',
] as const;

export const CLIENT_ACTIONABLE_OFFER_STATUSES = ['sent', 'open'] as const;
export const ADMIN_IMMUTABLE_OFFER_STATUSES = ['sending', 'sent', 'accepted', 'superseded'] as const;
export const UNSENDABLE_OFFER_STATUSES = ['sending', 'accepted', 'rejected', 'expired', 'superseded', 'template'] as const;

export function normalizeOfferStatus(status: unknown): string {
    return String(status || '').trim().toLowerCase();
}

export function isClientVisibleOfferStatus(status: unknown): boolean {
    return (CLIENT_VISIBLE_OFFER_STATUSES as readonly string[]).includes(normalizeOfferStatus(status));
}

export function isClientActionableOfferStatus(status: unknown): boolean {
    return (CLIENT_ACTIONABLE_OFFER_STATUSES as readonly string[]).includes(normalizeOfferStatus(status));
}

export function isAdminImmutableOfferStatus(status: unknown): boolean {
    return (ADMIN_IMMUTABLE_OFFER_STATUSES as readonly string[]).includes(normalizeOfferStatus(status));
}

export function isUnsendableOfferStatus(status: unknown): boolean {
    return (UNSENDABLE_OFFER_STATUSES as readonly string[]).includes(normalizeOfferStatus(status));
}

export const CLIENT_VISIBLE_OFFER_STATUS_VALUES = CLIENT_VISIBLE_OFFER_STATUSES.flatMap(status => [
    status,
    status.toUpperCase(),
]);

export const CLIENT_ACTIONABLE_OFFER_STATUS_VALUES = CLIENT_ACTIONABLE_OFFER_STATUSES.flatMap(status => [
    status,
    status.toUpperCase(),
]);
