import type {
    ClientContractState,
    ClientDepositState,
    ClientGalleryState,
    ClientJourneySnapshot,
    ClientOfferState,
    ClientOrderState,
    ClientSessionState,
} from './clientJourney';

type DateInput = Date | string | number | null | undefined;

export interface ClientPortalOfferRecord {
    status?: unknown;
    created_at?: DateInput;
}

export interface ClientPortalContractRecord {
    status?: unknown;
    created_at?: DateInput;
    session_date?: DateInput;
    deposit_amount?: unknown;
    deposit_due_at?: DateInput;
    deposit_paid_at?: DateInput;
}

export interface ClientPortalBookingRecord {
    status?: unknown;
    date?: DateInput;
    created_at?: DateInput;
    deposit_amount?: unknown;
    deposit_paid_at?: DateInput;
}

export interface ClientPortalGalleryRecord {
    id?: unknown;
    created_at?: DateInput;
}

export interface ClientPortalPhotoOrderRecord {
    payment_status?: unknown;
    paid_at?: DateInput;
    created_at?: DateInput;
}

export interface ClientJourneySourceData {
    offers?: readonly ClientPortalOfferRecord[];
    contracts?: readonly ClientPortalContractRecord[];
    bookings?: readonly ClientPortalBookingRecord[];
    galleries?: readonly ClientPortalGalleryRecord[];
    photoOrders?: readonly ClientPortalPhotoOrderRecord[];
    preparationAvailable?: boolean;
    now?: Date;
}

const CANCELLED_SESSION_STATUSES = new Set([
    'cancelled',
    'canceled',
    'refunded',
    'archived',
]);
const COMPLETED_SESSION_STATUSES = new Set([
    'completed',
    'complete',
    'done',
    'finished',
]);

function normalizeStatus(value: unknown): string {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function toDate(value: DateInput): Date | null {
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    if (value === null || value === undefined || value === '') return null;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function timestamp(value: DateInput): number {
    return toDate(value)?.getTime() ?? Number.NEGATIVE_INFINITY;
}

function hasPositiveAmount(value: unknown): boolean {
    if (typeof value === 'number') return Number.isFinite(value) && value > 0;
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0;
    }
    return false;
}

function newestFirst<T>(items: readonly T[], getDate: (item: T) => DateInput): T[] {
    return [...items].sort((a, b) => timestamp(getDate(b)) - timestamp(getDate(a)));
}

function selectOffer(offers: readonly ClientPortalOfferRecord[]): ClientPortalOfferRecord | null {
    const ordered = newestFirst(offers, (offer) => offer.created_at);

    // A global panel cannot safely combine several unrelated sessions.
    // Use the newest non-rejected offer instead of reviving an older draft.
    return ordered.find((offer) => normalizeStatus(offer.status) !== 'rejected')
        ?? ordered[0]
        ?? null;
}

function selectContract(contracts: readonly ClientPortalContractRecord[]): ClientPortalContractRecord | null {
    const ordered = newestFirst(contracts, (contract) => contract.created_at);

    return ordered.find((contract) => normalizeStatus(contract.status) !== 'rejected')
        ?? ordered[0]
        ?? null;
}

function mapOfferState(offer: ClientPortalOfferRecord | null): ClientOfferState {
    const status = normalizeStatus(offer?.status);
    const allowed: ClientOfferState[] = [
        'draft',
        'sent',
        'pending',
        'negotiating',
        'unlock_requested',
        'accepted',
        'rejected',
    ];

    return allowed.includes(status as ClientOfferState)
        ? status as ClientOfferState
        : 'missing';
}

function mapContractState(contract: ClientPortalContractRecord | null): ClientContractState {
    const status = normalizeStatus(contract?.status);
    const allowed: ClientContractState[] = ['pending', 'sent', 'signed', 'rejected'];

    return allowed.includes(status as ClientContractState)
        ? status as ClientContractState
        : 'missing';
}

function mapDepositState(
    contract: ClientPortalContractRecord | null,
    booking: ClientPortalBookingRecord | null,
    now: Date
): ClientDepositState {
    const source = contract && hasPositiveAmount(contract.deposit_amount)
        ? {
            amount: contract.deposit_amount,
            paidAt: contract.deposit_paid_at,
            dueAt: contract.deposit_due_at,
        }
        : booking && hasPositiveAmount(booking.deposit_amount)
            ? {
                amount: booking.deposit_amount,
                paidAt: booking.deposit_paid_at,
                dueAt: null,
            }
            : null;

    if (!source || !hasPositiveAmount(source.amount)) return 'not_required';
    if (toDate(source.paidAt)) return 'paid';

    const dueAt = toDate(source.dueAt);
    if (dueAt && dueAt.getTime() < now.getTime()) return 'overdue';

    return 'pending';
}

function selectRelevantBooking(
    bookings: readonly ClientPortalBookingRecord[],
    now: Date
): ClientPortalBookingRecord | null {
    const valid = bookings.filter((booking) => {
        const status = normalizeStatus(booking.status);
        return !CANCELLED_SESSION_STATUSES.has(status);
    });

    const future = valid
        .filter((booking) => {
            const date = toDate(booking.date);
            return date && date.getTime() >= now.getTime();
        })
        .sort((a, b) => timestamp(a.date) - timestamp(b.date));

    if (future[0]) return future[0];

    const completedByStatus = newestFirst(
        valid.filter((booking) => COMPLETED_SESSION_STATUSES.has(normalizeStatus(booking.status))),
        (booking) => booking.date ?? booking.created_at
    );
    if (completedByStatus[0]) return completedByStatus[0];

    const past = newestFirst(
        valid.filter((booking) => {
            const date = toDate(booking.date);
            return date && date.getTime() < now.getTime();
        }),
        (booking) => booking.date
    );

    return past[0] ?? valid[0] ?? null;
}

function mapSessionState(
    bookings: readonly ClientPortalBookingRecord[],
    contract: ClientPortalContractRecord | null,
    hasGallery: boolean,
    now: Date
): ClientSessionState {
    if (hasGallery) return 'completed';

    const booking = selectRelevantBooking(bookings, now);
    if (booking) {
        const status = normalizeStatus(booking.status);
        if (COMPLETED_SESSION_STATUSES.has(status)) return 'completed';

        const date = toDate(booking.date);
        if (date && date.getTime() < now.getTime()) return 'completed';
        if (date) return 'scheduled';
    }

    const contractDate = toDate(contract?.session_date);
    if (contractDate) {
        return contractDate.getTime() < now.getTime() ? 'completed' : 'scheduled';
    }

    const hasOnlyCancelledBookings = bookings.length > 0
        && bookings.every((item) => CANCELLED_SESSION_STATUSES.has(normalizeStatus(item.status)));

    return hasOnlyCancelledBookings ? 'cancelled' : 'not_scheduled';
}

function selectLatestOrder(
    orders: readonly ClientPortalPhotoOrderRecord[]
): ClientPortalPhotoOrderRecord | null {
    return newestFirst(orders, (order) => order.created_at)[0] ?? null;
}

function mapOrderState(order: ClientPortalPhotoOrderRecord | null): ClientOrderState {
    const status = normalizeStatus(order?.payment_status);

    if (!order || ['cancelled', 'canceled', 'refunded'].includes(status)) return 'none';
    if (['ready', 'completed', 'delivered'].includes(status)) return 'ready';
    if (['processing', 'in_progress'].includes(status)) return 'processing';
    if (status === 'paid' || toDate(order.paid_at)) return 'paid';

    return 'payment_required';
}

function mapGalleryState(
    hasGallery: boolean,
    hasOrder: boolean
): ClientGalleryState {
    if (!hasGallery) return 'not_available';

    // The current client gallery endpoint does not expose a dedicated
    // selection-completed flag. An existing order is the safest available
    // signal that the selection has already been submitted.
    return hasOrder ? 'selection_complete' : 'selection_required';
}

export function createClientJourneySnapshot(
    source: ClientJourneySourceData
): ClientJourneySnapshot {
    const now = source.now && !Number.isNaN(source.now.getTime())
        ? source.now
        : new Date();
    const offers = source.offers ?? [];
    const contracts = source.contracts ?? [];
    const bookings = source.bookings ?? [];
    const galleries = source.galleries ?? [];
    const photoOrders = source.photoOrders ?? [];

    const offer = selectOffer(offers);
    const contract = selectContract(contracts);
    const booking = selectRelevantBooking(bookings, now);
    const latestOrder = selectLatestOrder(photoOrders);
    const hasGallery = galleries.length > 0 || Boolean(latestOrder);

    return {
        offer: mapOfferState(offer),
        contract: mapContractState(contract),
        deposit: mapDepositState(contract, booking, now),
        preparationAvailable: source.preparationAvailable ?? true,
        session: mapSessionState(bookings, contract, hasGallery, now),
        gallery: mapGalleryState(hasGallery, Boolean(latestOrder)),
        order: mapOrderState(latestOrder),
    };
}
