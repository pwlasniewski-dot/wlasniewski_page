import { PAYMENT_HOLD_MILLISECONDS } from './paymentPolicy';

export const PAYMENT_HOLD_MINUTES = PAYMENT_HOLD_MILLISECONDS / 60_000;

const NON_BLOCKING_STATUSES = new Set(['cancelled', 'rejected', 'archived', 'payment_failed']);

export function isBookingBlockingAvailability(
    booking: { status?: string | null; created_at?: Date | string | null },
    _now = new Date(),
) {
    const status = String(booking.status || '').toLowerCase();
    if (NON_BLOCKING_STATUSES.has(status)) return false;

    // Pending remains blocking until PayU has been checked and the local record
    // is explicitly cancelled by the scheduled cleanup. Age alone is unsafe:
    // a late COMPLETED notification must never create a double booking.
    if (status === 'pending') return true;
    return true;
}
