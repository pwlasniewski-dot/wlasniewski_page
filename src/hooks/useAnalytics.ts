'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

const USER_KEY = 'analytics_v2_user_id';
const SESSION_KEY = 'analytics_v2_session';
const EXCLUDE_KEY = 'analytics_exclude';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVE_WINDOW_MS = 60 * 1000;
const HEARTBEAT_MS = 15 * 1000;

type SessionState = {
  id: string;
  started_at: number;
  last_activity_at: number;
  landing_page: string;
  source: string;
  referrer: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
};

type Identity = {
  userId: string;
  session: SessionState;
  isNewSession: boolean;
};

function classifySource(referrer: string, utmSource?: string, utmMedium?: string) {
  const source = (utmSource || '').toLowerCase();
  const medium = (utmMedium || '').toLowerCase();
  const ref = referrer.toLowerCase();

  if (source || medium) {
    if (source.includes('google') && (medium.includes('cpc') || medium.includes('paid'))) return 'Google Ads';
    if (source.includes('facebook') || source === 'fb') return 'Facebook';
    if (source.includes('instagram') || source === 'ig') return 'Instagram';
    if (source.includes('google')) return 'Google';
    return `${utmSource || 'UTM'}${utmMedium ? ` / ${utmMedium}` : ''}`;
  }

  if (!referrer) return 'Direct';
  if (ref.includes('google.')) return 'Google Organic';
  if (ref.includes('facebook.com') || ref.includes('fb.com')) return 'Facebook';
  if (ref.includes('instagram.com')) return 'Instagram';
  if (ref.includes('google.com/maps') || ref.includes('google.pl/maps')) return 'Google Business Profile';
  try {
    return new URL(referrer).hostname.replace(/^www\./, '') || 'Referral';
  } catch {
    return 'Referral';
  }
}

function getOrCreateIdentity(): Identity | null {
  if (typeof window === 'undefined') return null;

  let userId = localStorage.getItem(USER_KEY);
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem(USER_KEY, userId);
  }

  const now = Date.now();
  let existing: SessionState | null = null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    existing = raw ? JSON.parse(raw) : null;
  } catch {
    existing = null;
  }

  const expired = !existing || !existing.last_activity_at || now - existing.last_activity_at > SESSION_TIMEOUT_MS;
  if (!expired && existing) {
    const session = { ...existing, last_activity_at: now };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { userId, session, isNewSession: false };
  }

  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source') || undefined;
  const utmMedium = params.get('utm_medium') || undefined;
  const utmCampaign = params.get('utm_campaign') || undefined;
  const referrer = document.referrer || '';

  const session: SessionState = {
    id: uuidv4(),
    started_at: now,
    last_activity_at: now,
    landing_page: `${window.location.pathname}${window.location.search}`,
    source: classifySource(referrer, utmSource, utmMedium),
    referrer,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { userId, session, isNewSession: true };
}

function normalizeEventType(eventType: string) {
  if (eventType.startsWith('v2_')) return eventType;
  return `v2_${eventType.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`;
}

async function postEvent(payload: Record<string, unknown>, beacon = false) {
  const body = JSON.stringify({ event: payload });
  if (beacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/v2/track', new Blob([body], { type: 'application/json' }));
    return;
  }

  await fetch('/api/analytics/v2/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  });
}

export function useAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const trackEvent = useCallback(async (eventType: string, metadata: Record<string, unknown> = {}, beacon = false) => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(EXCLUDE_KEY) === 'true') return;
    if (pathname.startsWith('/admin')) return;

    const identity = getOrCreateIdentity();
    if (!identity) return;

    const session = identity.session;
    const common = {
      user_id: identity.userId,
      session_id: session.id,
      page_url: pathname || '/',
      referrer: session.referrer || document.referrer || '',
      utm_source: session.utm_source,
      utm_medium: session.utm_medium,
      utm_campaign: session.utm_campaign,
    };

    const baseMetadata = {
      client_ts: new Date().toISOString(),
      landing_page: session.landing_page,
      source: session.source,
      session_started_at: new Date(session.started_at).toISOString(),
      query: searchParams.toString(),
      title: document.title,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    };

    try {
      if (identity.isNewSession && normalizeEventType(eventType) !== 'v2_session_start') {
        await postEvent({
          ...common,
          event_type: 'v2_session_start',
          metadata: baseMetadata,
        }, beacon);
      }

      await postEvent({
        ...common,
        event_type: normalizeEventType(eventType),
        metadata: { ...baseMetadata, ...metadata },
      }, beacon);
    } catch (error) {
      console.error('[Analytics V2] Failed to track event', error);
    }
  }, [pathname, searchParams]);

  return { trackEvent };
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { trackEvent } = useAnalytics();
  const lastInteractionRef = useRef(Date.now());
  const formStartedRef = useRef(new WeakSet<HTMLFormElement>());
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (pathname.startsWith('/admin')) {
      localStorage.setItem(EXCLUDE_KEY, 'true');
      return;
    }

    const route = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    if (previousPathRef.current === route) return;
    previousPathRef.current = route;

    void trackEvent('page_view', { route });
  }, [pathname, searchParams, trackEvent]);

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;

    const markInteraction = () => {
      lastInteractionRef.current = Date.now();
      const identity = getOrCreateIdentity();
      if (identity) {
        identity.session.last_activity_at = Date.now();
        localStorage.setItem(SESSION_KEY, JSON.stringify(identity.session));
      }
    };

    const onClick = (event: MouseEvent) => {
      markInteraction();
      const target = (event.target as HTMLElement | null)?.closest('a,button,[role="button"],[data-analytics]') as HTMLElement | null;
      if (!target) return;

      void trackEvent('click', {
        tag: target.tagName.toLowerCase(),
        text: (target.textContent || '').trim().slice(0, 120),
        href: target instanceof HTMLAnchorElement ? target.href : undefined,
        analytics_id: target.getAttribute('data-analytics') || target.id || undefined,
      });
    };

    const onFocusIn = (event: FocusEvent) => {
      markInteraction();
      const input = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
      const form = input?.closest('form');
      if (!form || formStartedRef.current.has(form)) return;
      formStartedRef.current.add(form);
      void trackEvent('form_start', {
        form_id: form.id || form.getAttribute('name') || 'unnamed_form',
        first_field: input?.name || input?.id || undefined,
      });
    };

    const onSubmit = (event: SubmitEvent) => {
      markInteraction();
      const form = event.target as HTMLFormElement | null;
      if (!form) return;
      void trackEvent('form_submit', {
        form_id: form.id || form.getAttribute('name') || 'unnamed_form',
      });
    };

    const onVisibility = () => {
      if (document.hidden) {
        const active = Date.now() - lastInteractionRef.current <= ACTIVE_WINDOW_MS;
        void trackEvent('visibility_hidden', { active }, true);
      } else {
        markInteraction();
        void trackEvent('visibility_visible');
      }
    };

    const onPageHide = () => {
      const active = Date.now() - lastInteractionRef.current <= ACTIVE_WINDOW_MS;
      void trackEvent('page_exit', { active }, true);
    };

    const heartbeat = window.setInterval(() => {
      const active = !document.hidden && Date.now() - lastInteractionRef.current <= ACTIVE_WINDOW_MS;
      if (active) {
        void trackEvent('engagement', { active_ms: HEARTBEAT_MS });
      }
    }, HEARTBEAT_MS);

    document.addEventListener('click', onClick, true);
    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('submit', onSubmit, true);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pointerdown', markInteraction, { passive: true });
    window.addEventListener('touchstart', markInteraction, { passive: true });
    window.addEventListener('keydown', markInteraction);
    window.addEventListener('scroll', markInteraction, { passive: true });
    window.addEventListener('pagehide', onPageHide);

    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('focusin', onFocusIn, true);
      document.removeEventListener('submit', onSubmit, true);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointerdown', markInteraction);
      window.removeEventListener('touchstart', markInteraction);
      window.removeEventListener('keydown', markInteraction);
      window.removeEventListener('scroll', markInteraction);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [pathname, trackEvent]);

  return null;
}
