import { cleanupExpiredBookingPaymentHolds } from '../../src/lib/payments/booking-hold-cleanup';
import { syncGoogleCalendar } from '../../src/lib/calendar/google-sync';

export default async () => {
    try {
        const result = await cleanupExpiredBookingPaymentHolds();
        // One daily slot on the existing quarter-hour schedule. Check the clock
        // before calling the service, so other runs make no calendar DB reads.
        try {
            const now = new Date();
            if (now.getUTCHours() === 6 && now.getUTCMinutes() === 15) {
                await syncGoogleCalendar({ budgetMs: 8000 });
            }
        } catch {
            console.error('[google-calendar] scheduled_sync_failed');
        }
        return Response.json(result);
    } catch (error) {
        console.error('[cleanup-booking-payment-holds]', error);
        return Response.json({ error: 'cleanup_failed' }, { status: 500 });
    }
};
