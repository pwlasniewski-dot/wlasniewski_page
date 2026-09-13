/** Operational diagnostics only. Never add free text, URLs, tokens or document contents. */
export const PORTAL_SECTIONS = ['overview', 'sessions', 'bookings', 'documents', 'gift_cards', 'workshops', 'preparation', 'settings', 'partner'] as const;
export const PORTAL_MODULES = ['summary', 'account', 'sessions', 'workshops', 'session'] as const;
export const PORTAL_CLIENT_EVENTS = ['portal_opened', 'tab_opened', 'module_load_started', 'module_load_succeeded', 'module_load_failed', 'retry_clicked', 'action_clicked'] as const;
export const PORTAL_ACTIONS = ['gallery_open', 'offer_open', 'contract_open', 'contract_pdf_download', 'booking_open', 'voucher_open', 'challenge_open', 'next_action_open', 'logout', 'note_save', 'workshop_payment'] as const;
export type PortalSection = typeof PORTAL_SECTIONS[number];
export type PortalModule = typeof PORTAL_MODULES[number];
export type PortalClientEvent = {
    event: typeof PORTAL_CLIENT_EVENTS[number];
    sessionId: string;
    sequence: number;
    section?: PortalSection;
    module?: PortalModule;
    action?: typeof PORTAL_ACTIONS[number];
    durationMs?: number;
    correlationId?: string;
    httpStatus?: number;
};

export const PORTAL_EVENT_ACTION = 'portal_event';
export const PORTAL_EVENT_MAX_BYTES = 1024;
export const PORTAL_EVENT_LIMIT_PER_MINUTE = 90;
export const isPortalUuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const member = (value: unknown, choices: readonly string[]) => typeof value === 'string' && choices.includes(value);
const integer = (value: unknown, min: number, max: number) => typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;

export function parsePortalClientEvent(input: unknown): PortalClientEvent | null {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
    const value = input as Record<string, unknown>;
    const allowed = ['event', 'sessionId', 'sequence', 'section', 'module', 'action', 'durationMs', 'correlationId', 'httpStatus'];
    if (Object.keys(value).some(key => !allowed.includes(key))) return null;
    if (!member(value.event, PORTAL_CLIENT_EVENTS) || !isPortalUuid(value.sessionId) || !integer(value.sequence, 1, 1_000_000)) return null;
    if (value.section !== undefined && !member(value.section, PORTAL_SECTIONS)) return null;
    if (value.module !== undefined && !member(value.module, PORTAL_MODULES)) return null;
    if (value.action !== undefined && !member(value.action, PORTAL_ACTIONS)) return null;
    if (value.durationMs !== undefined && !integer(value.durationMs, 0, 600_000)) return null;
    if (value.httpStatus !== undefined && !integer(value.httpStatus, 100, 599)) return null;
    if (value.correlationId !== undefined && !isPortalUuid(value.correlationId)) return null;
    if (String(value.event).startsWith('module_load_') && !value.module) return null;
    if (value.event === 'tab_opened' && !value.section) return null;
    if (value.event === 'action_clicked' && !value.action) return null;
    return { ...value } as PortalClientEvent;
}

export const PORTAL_EVENT_LABELS: Record<string, string> = {
    portal_opened: 'Otworzył panel', tab_opened: 'Wybrał sekcję',
    module_load_started: 'Rozpoczęto ładowanie sekcji', module_load_succeeded: 'Sekcja załadowana w przeglądarce',
    module_load_failed: 'Błąd ładowania sekcji', retry_clicked: 'Ponowił ładowanie', action_clicked: 'Kliknął działanie',
    request_succeeded: 'Serwer zwrócił dane panelu', request_failed: 'Serwer nie zwrócił danych panelu',
    voucher_pdf_generated: 'Serwer wygenerował PDF vouchera z oferty', voucher_pdf_failed: 'Błąd generowania PDF vouchera z oferty',
};
export const PORTAL_SECTION_LABELS: Record<string, string> = {
    overview: 'Podsumowanie', sessions: 'Galerie i sesje', bookings: 'Rezerwacje', documents: 'Dokumenty',
    gift_cards: 'Karty podarunkowe', workshops: 'Warsztaty', preparation: 'Przygotowanie', settings: 'Ustawienia', partner: 'Partner',
    summary: 'Podsumowanie', account: 'Dane konta', session: 'Sprawdzenie sesji',
};
export const PORTAL_ACTION_LABELS: Record<string, string> = {
    gallery_open: 'Otwórz galerię', offer_open: 'Otwórz ofertę', contract_open: 'Otwórz umowę',
    contract_pdf_download: 'Pobierz PDF umowy', booking_open: 'Otwórz rezerwację', voucher_open: 'Otwórz kartę podarunkową',
    challenge_open: 'Otwórz zaproszenie', next_action_open: 'Przejdź do następnego działania', logout: 'Wyloguj',
    note_save: 'Zapisz notatkę', workshop_payment: 'Przejdź do płatności za warsztaty',
};
