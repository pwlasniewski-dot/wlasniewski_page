import { cleanupExpiredBookingPaymentHolds } from '../../src/lib/payments/booking-hold-cleanup';
import { syncGoogleCalendar } from '../../src/lib/calendar/google-sync';

export default async () => {
    try {
        const result = await cleanupExpiredBookingPaymentHolds();
        // Reuse the existing wake-up; calendar errors must not undo payment cleanup.
        try {
            await syncGoogleCalendar({ budgetMs: 8000 });
        } catch {
            console.error('[google-calendar] scheduled_sync_failed');
        }
        return Response.json(result);
    } catch (error) {
        console.error('[cleanup-booking-payment-holds]', error);
        return Response.json({ error: 'cleanup_failed' }, { status: 500 });
    }
};
