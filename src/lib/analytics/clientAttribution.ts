export type ClientSalesAttribution = {
    analytics_session_id?: string;
    landing_page?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
};

type StoredSession = {
    id?: unknown;
    landing_page?: unknown;
    utm_source?: unknown;
    utm_medium?: unknown;
    utm_campaign?: unknown;
};

const SAFE_ID = /^[a-zA-Z0-9-]{1,100}$/;
const SAFE_CAMPAIGN = /^[a-zA-Z0-9._-]{1,80}$/;
const ATTRIBUTION_KEYS = ['analytics_session_id', 'landing_page', 'utm_source', 'utm_medium', 'utm_campaign'] as const;

function safeCampaign(value: unknown) {
    return typeof value === 'string' && SAFE_CAMPAIGN.test(value) ? value : undefined;
}

export function parseConsentedClientAttribution(
    consentValue: string | null,
    rawSession: string | null,
): ClientSalesAttribution {
    if (consentValue !== 'accepted' || !rawSession) return {};

    let session: StoredSession;
    try {
        session = JSON.parse(rawSession) as StoredSession;
    } catch {
        return {};
    }

    const analyticsSessionId = typeof session.id === 'string' && SAFE_ID.test(session.id)
        ? session.id
        : undefined;
    const landingPage = typeof session.landing_page === 'string'
        && session.landing_page.startsWith('/')
        && !session.landing_page.startsWith('//')
        && session.landing_page.length <= 300
        ? session.landing_page
        : undefined;

    return {
        analytics_session_id: analyticsSessionId,
        landing_page: landingPage,
        utm_source: safeCampaign(session.utm_source),
        utm_medium: safeCampaign(session.utm_medium),
        utm_campaign: safeCampaign(session.utm_campaign),
    };
}

export function readConsentedClientAttribution(): ClientSalesAttribution {
    if (typeof window === 'undefined') return {};

    try {
        return parseConsentedClientAttribution(
            window.localStorage.getItem('cookie_consent'),
            window.localStorage.getItem('analytics_v2_session'),
        );
    } catch {
        return {};
    }
}

type CheckoutItemWithMetadata = {
    type?: unknown;
    metadata?: unknown;
};

/**
 * Cart data can outlive a consent decision. Always remove the old snapshot and
 * attach only the attribution allowed at the moment checkout is submitted.
 */
export function checkoutItemsWithCurrentAttribution<T extends CheckoutItemWithMetadata>(
    items: readonly T[],
    attribution: ClientSalesAttribution,
): T[] {
    return items.map(item => {
        if (!item.metadata || typeof item.metadata !== 'object' || Array.isArray(item.metadata)) return { ...item };
        const metadata = { ...(item.metadata as Record<string, unknown>) };
        for (const key of ATTRIBUTION_KEYS) delete metadata[key];
        if (item.type === 'booking') {
            for (const [key, value] of Object.entries(attribution)) {
                if (value !== undefined) metadata[key] = value;
            }
        }
        return { ...item, metadata };
    });
}

export function stripAttributionFromStoredCart(rawCart: string | null) {
    if (!rawCart) return null;
    try {
        const parsed = JSON.parse(rawCart);
        if (!Array.isArray(parsed)) return null;
        return JSON.stringify(checkoutItemsWithCurrentAttribution(parsed, {}));
    } catch {
        return null;
    }
}
