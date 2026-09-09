import { expect, test } from '@playwright/test';
import { resolveClientJourney } from '../../src/lib/client/clientJourney';
import { createClientJourneySnapshot } from '../../src/lib/client/clientJourneyAdapter';

const NOW = new Date('2026-08-02T12:00:00.000Z');

test.describe('client journey adapter', () => {
    test('uses the newest non-rejected offer and does not revive an older draft', () => {
        const snapshot = createClientJourneySnapshot({
            now: NOW,
            offers: [
                { status: 'draft', created_at: '2026-07-01T10:00:00.000Z' },
                { status: 'accepted', created_at: '2026-08-01T10:00:00.000Z' },
            ],
        });

        expect(snapshot.offer).toBe('accepted');
    });

    test('ignores the newest rejected offer when an active offer exists', () => {
        const snapshot = createClientJourneySnapshot({
            now: NOW,
            offers: [
                { status: 'rejected', created_at: '2026-08-02T10:00:00.000Z' },
                { status: 'accepted', created_at: '2026-08-01T10:00:00.000Z' },
            ],
        });

        expect(snapshot.offer).toBe('accepted');
    });

    test('maps an unpaid contract deposit after its due date as overdue', () => {
        const snapshot = createClientJourneySnapshot({
            now: NOW,
            offers: [{ status: 'accepted', created_at: '2026-07-20T10:00:00.000Z' }],
            contracts: [{
                status: 'signed',
                created_at: '2026-07-21T10:00:00.000Z',
                deposit_amount: 300,
                deposit_due_at: '2026-07-31T23:59:59.000Z',
                deposit_paid_at: null,
            }],
            bookings: [{ status: 'confirmed', date: '2026-08-06T15:00:00.000Z' }],
        });
        const journey = resolveClientJourney(snapshot);

        expect(snapshot.deposit).toBe('overdue');
        expect(journey.action?.id).toBe('pay_deposit');
    });

    test('does not invent a booking deposit deadline that the API does not expose', () => {
        const snapshot = createClientJourneySnapshot({
            now: NOW,
            bookings: [{
                status: 'confirmed',
                date: '2026-08-06T15:00:00.000Z',
                deposit_amount: 300,
                deposit_paid_at: null,
            }],
        });

        expect(snapshot.deposit).toBe('pending');
    });

    test('uses the nearest upcoming booking as the active session', () => {
        const snapshot = createClientJourneySnapshot({
            now: NOW,
            bookings: [
                {
                    status: 'confirmed',
                    date: '2026-09-20T15:00:00.000Z',
                    deposit_amount: 300,
                    deposit_paid_at: '2026-08-01T10:00:00.000Z',
                },
                {
                    status: 'confirmed',
                    date: '2026-08-06T15:00:00.000Z',
                    deposit_amount: 300,
                    deposit_paid_at: null,
                },
            ],
        });

        expect(snapshot.session).toBe('scheduled');
        expect(snapshot.deposit).toBe('pending');
    });

    test('maps a past booking without a gallery as a completed session', () => {
        const snapshot = createClientJourneySnapshot({
            now: NOW,
            bookings: [{ status: 'confirmed', date: '2026-07-15T15:00:00.000Z' }],
        });

        expect(snapshot.session).toBe('completed');
        expect(snapshot.gallery).toBe('not_available');
        expect(resolveClientJourney(snapshot).action).toBeNull();
    });

    test('maps an available gallery without an order to photo selection', () => {
        const snapshot = createClientJourneySnapshot({
            now: NOW,
            galleries: [{ id: 11, created_at: '2026-08-01T10:00:00.000Z' }],
        });
        const journey = resolveClientJourney(snapshot);

        expect(snapshot.session).toBe('completed');
        expect(snapshot.gallery).toBe('selection_required');
        expect(journey.action?.id).toBe('finish_selection');
    });

    test('maps a pending photo order to payment', () => {
        const snapshot = createClientJourneySnapshot({
            now: NOW,
            galleries: [{ id: 11, created_at: '2026-08-01T10:00:00.000Z' }],
            photoOrders: [{
                payment_status: 'pending',
                created_at: '2026-08-02T09:00:00.000Z',
            }],
        });
        const journey = resolveClientJourney(snapshot);

        expect(snapshot.gallery).toBe('selection_complete');
        expect(snapshot.order).toBe('payment_required');
        expect(journey.action?.id).toBe('pay_order');
    });

    test('infers the gallery stage from an existing paid order when the gallery request is empty', () => {
        const snapshot = createClientJourneySnapshot({
            now: NOW,
            photoOrders: [{
                payment_status: 'paid',
                paid_at: '2026-08-02T09:15:00.000Z',
                created_at: '2026-08-02T09:00:00.000Z',
            }],
        });

        expect(snapshot.session).toBe('completed');
        expect(snapshot.gallery).toBe('selection_complete');
        expect(snapshot.order).toBe('paid');
    });

    test('does not report delivery as ready when the current API only confirms payment', () => {
        const snapshot = createClientJourneySnapshot({
            now: NOW,
            photoOrders: [{
                payment_status: 'paid',
                paid_at: '2026-08-02T09:15:00.000Z',
                created_at: '2026-08-02T09:00:00.000Z',
            }],
        });

        expect(snapshot.order).toBe('paid');
        expect(resolveClientJourney(snapshot).action).toBeNull();
    });

    test('maps a history containing only cancelled bookings as cancelled', () => {
        const snapshot = createClientJourneySnapshot({
            now: NOW,
            bookings: [
                { status: 'cancelled', date: '2026-08-06T15:00:00.000Z' },
                { status: 'refunded', date: '2026-07-20T15:00:00.000Z' },
            ],
        });

        expect(snapshot.session).toBe('cancelled');
        expect(resolveClientJourney(snapshot).action?.id).toBe('contact_photographer');
    });
});
