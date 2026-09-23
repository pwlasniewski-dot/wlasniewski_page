/** Values allowed in the anonymous booking journey. Never pass form values here. */
export const BOOKING_FIELDS = [
  'name', 'email', 'phone', 'company', 'venue_city', 'venue_place', 'notes',
  'drone_goal', 'rodo', 'drone_terms', 'promo_code', 'gift_card_code',
] as const;
export type BookingField = typeof BOOKING_FIELDS[number];
export type BookingFieldState = 'filled' | 'empty' | 'invalid' | 'checked' | 'unchecked';

export const BOOKING_ACTIONS = [
  'service_select', 'package_select', 'date_select', 'time_select', 'booking_calendar',
  'add_to_cart', 'promo_apply', 'promo_remove', 'gift_card_apply', 'gift_card_remove',
  'drone_addon_select', 'drone_addon_remove', 'photographer_change',
] as const;

const fields = new Set<string>(BOOKING_FIELDS);
const states = new Set<string>(['filled', 'empty', 'invalid', 'checked', 'unchecked']);
const actions = new Set<string>(BOOKING_ACTIONS);
const selection = ['service_id', 'service_name', 'package_id', 'package_name'];
const eventKeys: Record<string, readonly string[]> = {
  v2_booking_view: [...selection, 'package_count'],
  v2_service_selected: ['service_id', 'service_name'],
  v2_package_selected: [...selection, 'amount_bucket'],
  v2_promotion_package_selected: [...selection, 'promotion_id', 'amount_bucket'],
  v2_date_selected: ['service_id', 'package_id', 'booking_date', 'selection_cleared'],
  v2_time_selected: ['service_id', 'package_id', 'booking_date', 'booking_time', 'selection_cleared'],
  v2_booking_start: [...selection, 'booking_date', 'booking_time'],
  v2_booking_added_to_cart: [...selection, 'booking_date', 'booking_time', 'item_count', 'amount_bucket'],
  v2_booking_form_started: ['step', 'service_name', 'area'],
  v2_booking_field_state: ['field', 'state'],
  v2_booking_code_result: ['code_type', 'status', 'reason_code'],
  v2_drone_addon_selected: ['package_name', 'selected'],
};

function catalogName(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  // Catalog labels originate from the public API, never input text. These bounds
  // additionally reject URLs, emails, long numeric identifiers and token shapes.
  if (!text || text.length > 100 || !/[\p{L}]/u.test(text)) return undefined;
  if (!/^[\p{L}\p{N} .,'’„”"()&+×–—\-]+$/u.test(text)) return undefined;
  if (/(?:https?|www|mailto|javascript|bearer)\b/i.test(text)) return undefined;
  if (/\d{6,}|[a-zA-Z0-9_-]{32,}/.test(text)) return undefined;
  return text;
}

function bookingDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^(?:20|21)\d{2}-\d{2}-\d{2}$/.test(value)) return undefined;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : undefined;
}

/** Shared by browser, ingest and dashboard: only event-specific, bounded data survives. */
export function sanitizeBookingJourneyMetadata(eventType: string, raw: unknown): Record<string, unknown> {
  const type = eventType.startsWith('v2_') ? eventType : `v2_${eventType}`;
  const allowed = eventKeys[type];
  if (!allowed || !raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const input = raw as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of allowed) {
    const value = input[key];
    if (key === 'service_name' || key === 'package_name') {
      const name = catalogName(value);
      if (name) result[key] = name;
    } else if (['service_id', 'package_id', 'promotion_id'].includes(key)) {
      if (typeof value === 'number' && Number.isInteger(value) && value !== 0 && Math.abs(value) <= 2_147_483_647) result[key] = value;
    } else if (key === 'booking_date') {
      const date = bookingDate(value);
      if (date) result[key] = date;
    } else if (key === 'booking_time') {
      if (typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) result[key] = value;
    } else if (key === 'field') {
      if (typeof value === 'string' && fields.has(value)) result[key] = value;
    } else if (key === 'state') {
      if (typeof value === 'string' && states.has(value)) result[key] = value;
    } else if (key === 'step') {
      if (typeof value === 'string' && ['first_choice', 'service', 'package', 'date'].includes(value)) result[key] = value;
    } else if (key === 'amount_bucket') {
      if (typeof value === 'string' && ['under_500', '500_999', '1000_plus'].includes(value)) result[key] = value;
    } else if (key === 'item_count' || key === 'package_count') {
      if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 1000) result[key] = value;
    } else if (key === 'area') {
      if (value === 'booking_form') result[key] = value;
    } else if (key === 'selected' || key === 'selection_cleared') {
      if (typeof value === 'boolean') result[key] = value;
    } else if (key === 'code_type') {
      if (value === 'promo' || value === 'gift_card') result[key] = value;
    } else if (key === 'status') {
      if (value === 'ok' || value === 'error' || value === 'failed') result[key] = value;
    } else if (key === 'reason_code') {
      if (typeof value === 'string' && ['accepted', 'invalid_code', 'wrong_code_type', 'promotion_conflict', 'http_error', 'network_error'].includes(value)) result[key] = value;
    }
  }
  // A partial field snapshot is not meaningful evidence.
  if (type === 'v2_booking_field_state' && (!result.field || !result.state)) return {};
  const action = safeBookingAction(input.analytics_id);
  if (action) result.analytics_id = action;
  return result;
}

export function isBookingJourneyEvent(eventType: string): boolean {
  return Object.hasOwn(eventKeys, eventType.startsWith('v2_') ? eventType : `v2_${eventType}`);
}

export function safeBookingAction(value: unknown): string | undefined {
  return typeof value === 'string' && actions.has(value) ? value : undefined;
}

export function safeAnalyticsCode(value: unknown): string | undefined {
  return typeof value === 'string' && /^[a-z][a-z0-9_-]{0,79}$/.test(value) ? value : undefined;
}

/** Reads only a boolean state, never returns the field's contents. */
export function bookingFieldSnapshot(element: {
  tagName: string; type?: string; value?: string; checked?: boolean;
  validity?: { valid: boolean }; getAttribute(name: string): string | null;
}, invalid = false): { field: BookingField; state: BookingFieldState } | null {
  const field = element.getAttribute('data-booking-field');
  if (!field || !fields.has(field) || !['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) return null;
  if (element.type === 'password' || element.type === 'hidden') return null;
  const state: BookingFieldState = invalid ? 'invalid'
    : element.type === 'checkbox' ? (element.checked ? 'checked' : 'unchecked')
      : !element.value?.trim() ? 'empty'
        : element.validity?.valid === false ? 'invalid' : 'filled';
  return { field: field as BookingField, state };
}
