export type AttributionEvent = {
  event_type: string; session_id: string; page_url?: string | null; created_at: Date; metadata?: Record<string, unknown>;
};

const SALES_INTENT_START_EVENTS = new Set([
  'v2_booking_start',
  'v2_booking_started',
  'v2_booking_form_started',
  'v2_drone_booking_started',
  'v2_photo_inquiry_started',
  'v2_aero_inquiry_started',
]);

export function isSalesIntentStart(event: AttributionEvent) {
  return SALES_INTENT_START_EVENTS.has(event.event_type);
}

export function isSemanticCta(event: AttributionEvent) {
  if (event.event_type !== 'v2_click') return false;
  const metadata = event.metadata || {};
  const signal = [metadata.analytics_id, metadata.analyticsId, metadata.action, metadata.target, metadata.href]
    .filter(value => typeof value === 'string').join(' ').toLowerCase();
  return /(cta|rezerw|kontakt|ofert|cen)/.test(signal);
}

export function pathsBeforeFirstBookingStart(events: AttributionEvent[], identityForEvent: (event: AttributionEvent) => string) {
  const ordered = [...events].sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
  const startIndex = ordered.findIndex(isSalesIntentStart);
  if (startIndex < 0) return [];
  return Array.from(new Set(ordered.slice(0, startIndex).filter(event => event.event_type === 'v2_page_view').map(identityForEvent)));
}
