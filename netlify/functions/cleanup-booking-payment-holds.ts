import { cleanupExpiredBookingPaymentHolds } from '../../src/lib/payments/booking-hold-cleanup';

export default async () => {
    try {
        const result = await cleanupExpiredBookingPaymentHolds();
        return Response.json(result);
    } catch (error) {
        console.error('[cleanup-booking-payment-holds]', error);
        return Response.json({ error: 'cleanup_failed' }, { status: 500 });
    }
};
