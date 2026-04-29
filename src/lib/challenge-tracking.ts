'use client';

import { useEffect, useRef } from 'react';

type EventType =
    | 'page_viewed'
    | 'scrolled_25'
    | 'scrolled_50'
    | 'scrolled_75'
    | 'scrolled_100'
    | 'cta_accept_clicked'
    | 'cta_reject_clicked'
    | 'cta_pay_clicked'
    | 'package_details_opened'
    | 'gallery_opened'
    | 'maps_opened'
    | 'shared_clicked'
    | 'pdf_downloaded'
    | 'ics_downloaded';

const FIRED = new Set<string>();

/**
 * Best-effort tracking helper for the public Foto Wyzwanie pages.
 * - Uses sendBeacon when available so the request survives navigation.
 * - In-memory dedupe within the same tab so listeners don't fire multiple times for the same event.
 * - Server is idempotent for non-CTA milestones, so refresh is safe.
 */
export function trackChallengeEvent(
    uniqueLink: string,
    event_type: EventType,
    extra?: { description?: string; meta?: Record<string, unknown> }
): void {
    if (!uniqueLink || typeof window === 'undefined') return;
    const key = `${uniqueLink}:${event_type}`;
    const ALWAYS = new Set<EventType>([
        'cta_accept_clicked',
        'cta_reject_clicked',
        'cta_pay_clicked',
        'shared_clicked',
        'pdf_downloaded',
        'ics_downloaded',
    ]);
    if (!ALWAYS.has(event_type) && FIRED.has(key)) return;
    FIRED.add(key);

    const url = `/api/photo-challenge/${encodeURIComponent(uniqueLink)}/track`;
    const payload = JSON.stringify({ event_type, ...(extra || {}) });

    try {
        if (navigator.sendBeacon) {
            const blob = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon(url, blob);
            return;
        }
    } catch {
        // fall through to fetch
    }
    void fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
    }).catch(() => {
        /* swallow */
    });
}

/**
 * Hook: fires `page_viewed` once on mount and `scrolled_25/50/75/100` milestones based on document scroll.
 */
export function useChallengeTracking(uniqueLink: string | null | undefined): void {
    const milestonesFired = useRef<Set<number>>(new Set());

    useEffect(() => {
        if (!uniqueLink) return;
        trackChallengeEvent(uniqueLink, 'page_viewed');

        const milestones = [25, 50, 75, 100] as const;
        let raf = 0;

        const compute = () => {
            const doc = document.documentElement;
            const scrollTop = window.scrollY || doc.scrollTop;
            const viewport = window.innerHeight;
            const total = Math.max(doc.scrollHeight - viewport, 1);
            const pct = Math.min(100, Math.round((scrollTop / total) * 100));
            for (const m of milestones) {
                if (pct >= m && !milestonesFired.current.has(m)) {
                    milestonesFired.current.add(m);
                    trackChallengeEvent(uniqueLink, `scrolled_${m}` as EventType);
                }
            }
        };

        const onScroll = () => {
            if (raf) return;
            raf = window.requestAnimationFrame(() => {
                raf = 0;
                compute();
            });
        };

        compute();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            if (raf) cancelAnimationFrame(raf);
        };
    }, [uniqueLink]);
}
