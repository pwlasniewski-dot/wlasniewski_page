'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'analytics_session_id';
const USER_KEY = 'analytics_user_id';

export function useAnalytics() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [sessionId, setSessionId] = useState<string>('');
    const [userId, setUserId] = useState<string>('');

    // Initialize session and user
    useEffect(() => {
        let storedSession = localStorage.getItem(SESSION_KEY);
        if (!storedSession) {
            storedSession = uuidv4();
            localStorage.setItem(SESSION_KEY, storedSession);
        }
        setSessionId(storedSession);

        let storedUser = localStorage.getItem(USER_KEY);
        if (!storedUser) {
            storedUser = uuidv4(); // Anonymous user ID
            localStorage.setItem(USER_KEY, storedUser);
        }
        setUserId(storedUser);
    }, []);

    const trackEvent = useCallback(async (eventType: string, metadata?: any) => {
        if (!sessionId) return; // Wait for initialization

        // EXCLUDE ADMIN PATHS - tylko prawdziwi użytkownicy
        const isAdminPath = pathname.startsWith('/admin');
        if (isAdminPath) {
            console.log('[Analytics] Skipping admin path:', pathname);
            return;
        }

        try {
            const utmSource = searchParams.get('utm_source');
            const utmMedium = searchParams.get('utm_medium');
            const utmCampaign = searchParams.get('utm_campaign');

            await fetch('/api/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event_type: eventType,
                    page_url: pathname,
                    user_id: userId,
                    session_id: sessionId,
                    referrer: document.referrer,
                    utm_source: utmSource,
                    utm_medium: utmMedium,
                    utm_campaign: utmCampaign,
                    metadata
                }),
            });
        } catch (error) {
            console.error('Failed to track event', error);
        }
    }, [pathname, searchParams, sessionId, userId]);

    return { trackEvent };
}

export function AnalyticsTracker() {
    const pathname = usePathname();
    const { trackEvent } = useAnalytics();

    useEffect(() => {
        // Track page view on route change
        const timeout = setTimeout(() => {
            trackEvent('page_view');
        }, 500); // Small delay to ensure session init

        return () => clearTimeout(timeout);
    }, [pathname, trackEvent]);

    return null;
}
