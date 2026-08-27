'use client';

/**
 * UTM auto-tracker.
 * Mount once in root layout. After analytics consent:
 *  - reads utm_* from URL
 *  - persists session_id in localStorage so kolejne kroki (rezerwacja, formularz) wiązały się z tym samym leadem
 *  - POSTs to /api/track-utm
 */
import { useEffect } from 'react';

export default function UtmTracker() {
    useEffect(() => {
        let tracked = false;

        const clearLegacyAttribution = () => {
            localStorage.removeItem('pw_session_id');
            localStorage.removeItem('pw_utm_source');
            localStorage.removeItem('pw_utm_campaign');
        };

        const trackConsentedUtm = () => {
            try {
                const consent = localStorage.getItem('cookie_consent');
                if (consent !== 'accepted') {
                    if (consent === 'rejected') clearLegacyAttribution();
                    return;
                }
                if (tracked) return;

                const params = new URLSearchParams(window.location.search);
                const utm_source = params.get('utm_source');
                const utm_medium = params.get('utm_medium');
                const utm_campaign = params.get('utm_campaign');

                if (!utm_source && !utm_medium && !utm_campaign) return;

                const sessionKey = 'pw_session_id';
                let sessionId = localStorage.getItem(sessionKey);
                if (!sessionId) {
                    sessionId = crypto.randomUUID();
                    localStorage.setItem(sessionKey, sessionId);
                }
                localStorage.setItem('pw_utm_source', utm_source || '');
                localStorage.setItem('pw_utm_campaign', utm_campaign || '');
                tracked = true;

                fetch('/api/track-utm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        utm_source,
                        utm_medium,
                        utm_campaign,
                        page_url: window.location.pathname,
                        referrer: document.referrer || null,
                        session_id: sessionId,
                    }),
                }).catch(() => {
                    /* silent fail — tracking nie blokuje UX */
                });
            } catch {
                /* noop */
            }
        };

        const onConsentChanged = () => trackConsentedUtm();
        trackConsentedUtm();
        window.addEventListener('cookie-consent-changed', onConsentChanged);
        return () => window.removeEventListener('cookie-consent-changed', onConsentChanged);
    }, []);

    return null;
}
