type TrackingContext = {
    localStorage: Pick<Storage, 'getItem'>;
    gtag?: (...args: unknown[]) => void;
};

/** Only a saved inquiry, with current consent, can be an Ads conversion. */
export function trackPhotoInquiryConversion(
    inquiryId: unknown,
    metadata: Record<string, string | undefined> = {},
    context: TrackingContext | undefined = typeof window === 'undefined' ? undefined : window as TrackingContext,
) {
    if (!context || typeof context.gtag !== 'function' || !Number.isSafeInteger(inquiryId) || Number(inquiryId) <= 0) return false;
    try {
        if (context.localStorage.getItem('cookie_consent') !== 'accepted') return false;
        // The stable server ID deduplicates repeated delivery of this conversion in Google Ads.
        context.gtag('event', 'conversion', {
            send_to: 'AW-17548893646/mNauCJy3h-YbEM67-69B',
            transaction_id: `inquiry-${inquiryId}`,
        });
        context.gtag('event', 'generate_lead', metadata);
        return true;
    } catch {
        // Analytics must never turn a successfully saved inquiry into a form error.
        return false;
    }
}
