export type TodayQueuePriority = 'critical' | 'high' | 'normal';
export type TodayQueueKind = 'inquiry' | 'booking' | 'offer' | 'contract';

export type TodayQueueItem = {
    id: string;
    kind: TodayQueueKind;
    title: string;
    clientName: string;
    clientEmail: string | null;
    clientPhone: string | null;
    status: string;
    priority: TodayQueuePriority;
    reason: string;
    cta: string;
    href: string;
    createdAt: string;
    dueAt: string | null;
    value: number | null;
    source: string | null;
    overdue: boolean;
};

export type TodayQueueSummary = {
    total: number;
    critical: number;
    overdue: number;
    newInquiries: number;
    payments: number;
    documents: number;
};

type DateValue = Date | string | null | undefined;

type InquiryInput = {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    session_type?: string | null;
    source?: string | null;
    status: string;
    created_at: DateValue;
};

type BookingInput = {
    id: number;
    client_name: string;
    email: string;
    phone?: string | null;
    service: string;
    package: string;
    price: number;
    date: DateValue;
    status: string;
    created_at: DateValue;
    deposit_amount?: number | null;
    deposit_paid_at?: DateValue;
    remaining_amount?: number | null;
    remaining_paid_at?: DateValue;
    remaining_due_at?: DateValue;
};

type OfferInput = {
    id: number;
    title: string;
    status: string;
    total_price: number;
    client_email?: string | null;
    created_at: DateValue;
    updated_at?: DateValue;
    valid_until?: DateValue;
    session_date?: DateValue;
    user?: { id: number; name?: string | null; email: string } | null;
};

type ContractInput = {
    id: number;
    status: string;
    created_at: DateValue;
    updated_at?: DateValue;
    deposit_amount?: number | null;
    deposit_due_at?: DateValue;
    deposit_paid_at?: DateValue;
    session_date?: DateValue;
    user?: { id: number; name?: string | null; email: string } | null;
    offer?: {
        id: number;
        title: string;
        total_price: number;
        client_email?: string | null;
        status: string;
    } | null;
};

export type TodayQueueInput = {
    inquiries: InquiryInput[];
    bookings: BookingInput[];
    offers: OfferInput[];
    contracts: ContractInput[];
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function toDate(value: DateValue): Date | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function iso(value: DateValue): string | null {
    return toDate(value)?.toISOString() ?? null;
}

function ageMs(value: DateValue, now: Date): number {
    const date = toDate(value);
    return date ? Math.max(0, now.getTime() - date.getTime()) : 0;
}

function isPast(value: DateValue, now: Date): boolean {
    const date = toDate(value);
    return Boolean(date && date.getTime() < now.getTime());
}

function plusMs(value: DateValue, duration: number): string | null {
    const date = toDate(value);
    return date ? new Date(date.getTime() + duration).toISOString() : null;
}

function priorityRank(priority: TodayQueuePriority): number {
    if (priority === 'critical') return 0;
    if (priority === 'high') return 1;
    return 2;
}

function inquiryItems(inquiries: InquiryInput[], now: Date): TodayQueueItem[] {
    return inquiries.map((inquiry) => {
        const age = ageMs(inquiry.created_at, now);
        const dueAt = plusMs(inquiry.created_at, 2 * HOUR_MS);
        const overdue = Boolean(dueAt && new Date(dueAt).getTime() < now.getTime());
        const priority: TodayQueuePriority = inquiry.status === 'new' && age >= DAY_MS
            ? 'critical'
            : inquiry.status === 'new' && age >= 2 * HOUR_MS
                ? 'high'
                : inquiry.status === 'qualified'
                    ? 'high'
                    : 'normal';

        const reason = inquiry.status === 'new'
            ? 'Nowe zapytanie — wykonaj pierwszy kontakt.'
            : inquiry.status === 'qualified'
                ? 'Zakwalifikowany lead — przygotuj ofertę lub termin.'
                : 'Kontakt rozpoczęty — zapisz następny krok.';

        return {
            id: `inquiry-${inquiry.id}`,
            kind: 'inquiry',
            title: inquiry.session_type || 'Zapytanie o sesję',
            clientName: inquiry.name,
            clientEmail: inquiry.email || null,
            clientPhone: inquiry.phone || null,
            status: inquiry.status,
            priority,
            reason,
            cta: 'Otwórz zapytania',
            href: '/admin/inquiries',
            createdAt: iso(inquiry.created_at) || now.toISOString(),
            dueAt,
            value: null,
            source: inquiry.source || null,
            overdue,
        };
    });
}

function bookingItems(bookings: BookingInput[], now: Date): TodayQueueItem[] {
    return bookings.flatMap((booking) => {
        const createdAge = ageMs(booking.created_at, now);
        const sessionDate = toDate(booking.date);
        const hoursToSession = sessionDate ? (sessionDate.getTime() - now.getTime()) / HOUR_MS : null;
        const depositMissing = Boolean(booking.deposit_amount && !booking.deposit_paid_at);
        const remainingMissing = Boolean(booking.remaining_amount && !booking.remaining_paid_at);
        const remainingOverdue = remainingMissing && isPast(booking.remaining_due_at, now);
        const pendingTooLong = booking.status === 'pending' && createdAge >= DAY_MS;
        const sessionSoon = hoursToSession !== null && hoursToSession >= 0 && hoursToSession <= 72;

        if (!depositMissing && !remainingMissing && !pendingTooLong && !sessionSoon) return [];

        let reason = 'Sprawdź stan rezerwacji i następny krok.';
        let dueAt = iso(booking.date);
        let priority: TodayQueuePriority = 'normal';
        let overdue = false;

        if (remainingOverdue) {
            reason = 'Pozostała płatność jest po terminie.';
            dueAt = iso(booking.remaining_due_at);
            priority = 'critical';
            overdue = true;
        } else if (depositMissing && sessionSoon) {
            reason = 'Sesja jest blisko, a zaliczka nie jest oznaczona jako zapłacona.';
            priority = 'critical';
        } else if (depositMissing) {
            reason = 'Rezerwacja oczekuje na zaliczkę lub potwierdzenie płatności.';
            priority = pendingTooLong ? 'high' : 'normal';
            dueAt = plusMs(booking.created_at, DAY_MS);
            overdue = pendingTooLong;
        } else if (remainingMissing) {
            reason = 'Pozostała kwota wymaga rozliczenia.';
            dueAt = iso(booking.remaining_due_at) || iso(booking.date);
            priority = remainingOverdue ? 'critical' : 'high';
            overdue = remainingOverdue;
        } else if (sessionSoon) {
            reason = 'Sesja w ciągu 72 godzin — sprawdź przygotowanie klienta.';
            priority = 'high';
        }

        return [{
            id: `booking-${booking.id}`,
            kind: 'booking' as const,
            title: `${booking.service} — ${booking.package}`,
            clientName: booking.client_name,
            clientEmail: booking.email || null,
            clientPhone: booking.phone || null,
            status: booking.status,
            priority,
            reason,
            cta: 'Otwórz zamówienia',
            href: '/admin/bookings/orders',
            createdAt: iso(booking.created_at) || now.toISOString(),
            dueAt,
            value: booking.price,
            source: 'rezerwacja',
            overdue,
        }];
    });
}

function offerItems(offers: OfferInput[], now: Date): TodayQueueItem[] {
    return offers.map((offer) => {
        const age = ageMs(offer.updated_at || offer.created_at, now);
        const validUntilPast = isPast(offer.valid_until, now);
        const staleSent = offer.status === 'sent' && age >= 3 * DAY_MS;
        const priority: TodayQueuePriority = validUntilPast
            ? 'critical'
            : offer.status === 'negotiating' || staleSent
                ? 'high'
                : 'normal';
        const reason = validUntilPast
            ? 'Oferta przekroczyła termin ważności — zdecyduj o wznowieniu lub zamknięciu.'
            : offer.status === 'draft'
                ? 'Szkic oferty wymaga dokończenia i wysłania.'
                : offer.status === 'negotiating'
                    ? 'Klient negocjuje warunki — odpowiedz i zapisz decyzję.'
                    : staleSent
                        ? 'Oferta wysłana ponad 3 dni temu — sprawdź reakcję klienta.'
                        : 'Oferta oczekuje na decyzję klienta.';
        const clientName = offer.user?.name || offer.client_email || 'Klient bez przypisanego profilu';

        return {
            id: `offer-${offer.id}`,
            kind: 'offer',
            title: offer.title,
            clientName,
            clientEmail: offer.user?.email || offer.client_email || null,
            clientPhone: null,
            status: offer.status,
            priority,
            reason,
            cta: 'Otwórz ofertę',
            href: `/admin/offers/${offer.id}`,
            createdAt: iso(offer.created_at) || now.toISOString(),
            dueAt: iso(offer.valid_until) || plusMs(offer.updated_at || offer.created_at, 3 * DAY_MS),
            value: offer.total_price,
            source: 'oferta',
            overdue: validUntilPast || staleSent,
        };
    });
}

function contractItems(contracts: ContractInput[], now: Date): TodayQueueItem[] {
    return contracts.flatMap((contract) => {
        const age = ageMs(contract.updated_at || contract.created_at, now);
        const depositMissing = Boolean(contract.deposit_amount && !contract.deposit_paid_at);
        const depositOverdue = depositMissing && isPast(contract.deposit_due_at, now);
        const awaitingSignature = contract.status === 'pending' || contract.status === 'sent';

        if (!depositMissing && !awaitingSignature) return [];

        const priority: TodayQueuePriority = depositOverdue
            ? 'critical'
            : awaitingSignature && age >= 3 * DAY_MS
                ? 'high'
                : depositMissing
                    ? 'high'
                    : 'normal';
        const reason = depositOverdue
            ? 'Zaliczka z umowy jest po terminie.'
            : awaitingSignature && age >= 3 * DAY_MS
                ? 'Umowa czeka na podpis ponad 3 dni.'
                : awaitingSignature
                    ? 'Umowa oczekuje na podpis klienta.'
                    : 'Umowa podpisana, ale zaliczka nie jest rozliczona.';
        const clientName = contract.user?.name || contract.offer?.client_email || 'Klient bez przypisanego profilu';
        const href = contract.user?.id
            ? `/admin/clients/${contract.user.id}?tab=contracts`
            : contract.offer?.id
                ? `/admin/offers/${contract.offer.id}/contract`
                : '/admin/dashboard';

        return [{
            id: `contract-${contract.id}`,
            kind: 'contract' as const,
            title: contract.offer?.title || `Umowa nr ${contract.id}`,
            clientName,
            clientEmail: contract.user?.email || contract.offer?.client_email || null,
            clientPhone: null,
            status: contract.status,
            priority,
            reason,
            cta: 'Otwórz umowę',
            href,
            createdAt: iso(contract.created_at) || now.toISOString(),
            dueAt: iso(contract.deposit_due_at) || plusMs(contract.updated_at || contract.created_at, 3 * DAY_MS),
            value: contract.offer?.total_price ?? contract.deposit_amount ?? null,
            source: 'umowa',
            overdue: depositOverdue || (awaitingSignature && age >= 3 * DAY_MS),
        }];
    });
}

export function buildTodayQueue(input: TodayQueueInput, now = new Date()): {
    items: TodayQueueItem[];
    summary: TodayQueueSummary;
} {
    const items = [
        ...inquiryItems(input.inquiries, now),
        ...bookingItems(input.bookings, now),
        ...offerItems(input.offers, now),
        ...contractItems(input.contracts, now),
    ]
        .sort((a, b) => {
            const priorityDifference = priorityRank(a.priority) - priorityRank(b.priority);
            if (priorityDifference !== 0) return priorityDifference;
            if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
            const aDue = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
            const bDue = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
            if (aDue !== bDue) return aDue - bDue;
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        })
        .slice(0, 50);

    return {
        items,
        summary: {
            total: items.length,
            critical: items.filter((item) => item.priority === 'critical').length,
            overdue: items.filter((item) => item.overdue).length,
            newInquiries: items.filter((item) => item.kind === 'inquiry' && item.status === 'new').length,
            payments: items.filter((item) => item.kind === 'booking' || (item.kind === 'contract' && item.reason.toLowerCase().includes('zalicz'))).length,
            documents: items.filter((item) => item.kind === 'offer' || item.kind === 'contract').length,
        },
    };
}
