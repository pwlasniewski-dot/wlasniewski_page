import { cleanupExpiredBookingPaymentHolds } from '../../src/lib/payments/booking-hold-cleanup';

export const handler = async () => {
    try {
        const result = await cleanupExpiredBookingPaymentHolds();
        return { statusCode: 200, body: JSON.stringify(result) };
    } catch (error) {
        console.error('[cleanup-booking-payment-holds]', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'cleanup_failed' }) };
    }
};
