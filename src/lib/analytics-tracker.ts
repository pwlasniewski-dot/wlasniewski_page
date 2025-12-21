/**
 * ANALYTICS TRACKER SDK
 * 
 * Auto-tracks user journey: page views, scrolls, clicks, form interactions
 * Filters out: admin routes, admin IP, bots
 */

'use client';

interface TrackingEvent {
    session_id: string;
    event_type: string;
    page_url: string;
    element_id?: string;
    element_text?: string;
    scroll_depth?: number;
    time_on_page?: number;
    form_id?: string;
    form_field?: string;
    metadata?: any;
}

class AnalyticsTracker {
    private sessionId: string = '';
    private eventQueue: TrackingEvent[] = [];
    private pageStartTime: number = Date.now();
    private maxScrollDepth: number = 0;
    private flushInterval?: NodeJS.Timeout;

    constructor() {
        // Only run in browser
        if (typeof window === 'undefined') return;

        // Skip admin pages
        if (window.location.pathname.startsWith('/admin')) return;

        this.sessionId = this.getOrCreateSession();
        this.initializeTrackers();
        this.startFlushInterval();
    }

    private getOrCreateSession(): string {
        const existing = localStorage.getItem('analytics_session_id');
        if (existing) {
            // Check if session is still valid (< 30 min old)
            const sessionStart = localStorage.getItem('analytics_session_start');
            if (sessionStart) {
                const elapsed = Date.now() - parseInt(sessionStart);
                if (elapsed < 30 * 60 * 1000) {
                    return existing;
                }
            }
        }

        // Create new session
        const newSessionId = this.generateSessionId();
        localStorage.setItem('analytics_session_id', newSessionId);
        localStorage.setItem('analytics_session_start', Date.now().toString());
        return newSessionId;
    }

    private generateSessionId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private initializeTrackers() {
        // Track initial page view
        this.trackPageView();

        // Track scroll depth
        this.trackScrollDepth();

        // Track clicks
        document.addEventListener('click', this.handleClick.bind(this), true);

        // Track form interactions
        this.trackFormInteractions();

        // Track page exit
        window.addEventListener('beforeunload', () => {
            this.trackEvent({
                event_type: 'PAGE_EXIT',
                time_on_page: Math.round((Date.now() - this.pageStartTime) / 1000)
            });
            this.flushEvents(true); // Synchronous flush on exit
        });

        // Track visibility changes (tab switch)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent({
                    event_type: 'TAB_HIDDEN',
                    time_on_page: Math.round((Date.now() - this.pageStartTime) / 1000)
                });
            } else {
                this.trackEvent({ event_type: 'TAB_VISIBLE' });
            }
        });
    }

    private trackPageView() {
        this.trackEvent({
            event_type: 'PAGE_VIEW',
            metadata: {
                referrer: document.referrer,
                url_params: window.location.search
            }
        });
    }

    private trackScrollDepth() {
        const updateScroll = () => {
            const scrollPercent = this.calculateScrollPercent();
            if (scrollPercent > this.maxScrollDepth) {
                this.maxScrollDepth = scrollPercent;
                // Only track significant scroll milestones (25%, 50%, 75%, 100%)
                if ([25, 50, 75, 100].includes(scrollPercent)) {
                    this.trackEvent({
                        event_type: 'SCROLL',
                        scroll_depth: scrollPercent
                    });
                }
            }
        };

        // Debounced scroll handler
        let scrollTimeout: NodeJS.Timeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(updateScroll, 500);
        });
    }

    private calculateScrollPercent(): number {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.scrollY;
        const scrollPercent = Math.round(((scrollTop + windowHeight) / documentHeight) * 100);
        return Math.min(100, scrollPercent);
    }

    private handleClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target) return;

        // Get meaningful info about clicked element
        const elementId = target.id;
        const elementText = target.textContent?.slice(0, 100) || ''; // Limit text length
        const elementTag = target.tagName.toLowerCase();
        const elementClass = target.className;

        // Track significant clicks (buttons, links, CTAs)
        if (['button', 'a', 'input'].includes(elementTag) || target.getAttribute('role') === 'button') {
            this.trackEvent({
                event_type: 'CLICK',
                element_id: elementId || undefined,
                element_text: elementText,
                metadata: {
                    tag: elementTag,
                    class: elementClass,
                    href: (target as HTMLAnchorElement).href
                }
            });
        }
    }

    private trackFormInteractions() {
        setTimeout(() => {
            const forms = document.querySelectorAll('form');

            forms.forEach(form => {
                const formId = form.id || form.getAttribute('name') || 'unnamed_form';
                let formStarted = false;

                form.addEventListener('submit', (e) => {
                    this.trackEvent({
                        event_type: 'FORM_SUBMIT',
                        form_id: formId
                    });
                });

                const inputs = form.querySelectorAll('input, textarea, select');
                inputs.forEach(input => {
                    input.addEventListener('focus', () => {
                        if (!formStarted) {
                            formStarted = true;
                            this.trackEvent({
                                event_type: 'FORM_START',
                                form_id: formId,
                                form_field: (input as HTMLInputElement).name
                            });
                        }
                    });

                    input.addEventListener('blur', () => {
                        // Track abandonment if user filled something then stopped
                        const value = (input as HTMLInputElement).value;
                        if (value && !form.querySelector('[type="submit"]')?.matches(':focus')) {
                            setTimeout(() => {
                                if (!form.contains(document.activeElement)) {
                                    this.trackEvent({
                                        event_type: 'FORM_FIELD_BLUR',
                                        form_id: formId,
                                        form_field: (input as HTMLInputElement).name
                                    });
                                }
                            }, 100);
                        }
                    });
                });
            });
        }, 1000); // Wait for forms to render
    }

    private trackEvent(event: Partial<TrackingEvent>) {
        this.eventQueue.push({
            session_id: this.sessionId,
            event_type: event.event_type || 'UNKNOWN',
            page_url: window.location.pathname,
            ...event
        });

        // Auto-flush if queue is large
        if (this.eventQueue.length >= 10) {
            this.flushEvents();
        }
    }

    private startFlushInterval() {
        // Flush events every 15 seconds
        this.flushInterval = setInterval(() => {
            this.flushEvents();
        }, 15000);
    }

    private async flushEvents(synchronous = false) {
        if (this.eventQueue.length === 0) return;

        const eventsToSend = [...this.eventQueue];
        this.eventQueue = [];

        try {
            if (synchronous) {
                // Use sendBeacon for guaranteed delivery on page exit
                navigator.sendBeacon(
                    '/api/analytics/track',
                    JSON.stringify({ events: eventsToSend })
                );
            } else {
                await fetch('/api/analytics/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ events: eventsToSend })
                });
            }
        } catch (error) {
            console.error('[Analytics] Failed to send events:', error);
            // Re-queue events if failed (optional)
            // this.eventQueue.push(...eventsToSend);
        }
    }
}

// Auto-initialize tracker (client-side only)
if (typeof window !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new AnalyticsTracker();
        });
    } else {
        new AnalyticsTracker();
    }
}

export { AnalyticsTracker };
