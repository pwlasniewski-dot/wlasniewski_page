'use client';

/**
 * UTM auto-tracker.
 * Mount once in root layout. On page load:
 *  - reads utm_* from URL
 *  - persists session_id in localStorage so kolejne kroki (rezerwacja, formularz) wiązały się z tym samym leadem
 *  - POSTs to /api/track-utm
 */
import { useEffect } from 'react';

export default function UtmTracker() {
    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const utm_source = params.get('utm_source');
            const utm_medium = params.get('utm_medium');
            const utm_campaign = params.get('utm_campaign');

            if (!utm_source && !utm_medium && !utm_campaign) return;

            // Persist for cross-page attribution
            const sessionKey = 'pw_session_id';
            let sessionId = localStorage.getItem(sessionKey);
            if (!sessionId) {
                sessionId = crypto.randomUUID();
                localStorage.setItem(sessionKey, sessionId);
            }
            localStorage.setItem('pw_utm_source', utm_source || '');
            localStorage.setItem('pw_utm_campaign', utm_campaign || '');

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
    }, []);

    return null;
}
