import { expect, test } from '@playwright/test';
import {
    resolveClientJourney,
    type ClientJourneySnapshot,
} from '../../src/lib/client/clientJourney';

const baseSnapshot: ClientJourneySnapshot = {
    offer: 'accepted',
    contract: 'signed',
    deposit: 'paid',
    preparationAvailable: true,
    session: 'scheduled',
    gallery: 'not_available',
    order: 'none',
};

function snapshot(
    overrides: Partial<ClientJourneySnapshot>
): ClientJourneySnapshot {
    return { ...baseSnapshot, ...overrides };
}

test.describe('client journey resolver', () => {
    test('prioritizes an offer waiting for the client', () => {
        const result = resolveClientJourney(snapshot({
            offer: 'sent',
            contract: 'missing',
            deposit: 'not_required',
            session: 'not_scheduled',
        }));

        expect(result.currentStage).toBe('offer');
        expect(result.action?.id).toBe('open_offer');
        expect(result.action?.targetTab).toBe('documents');
    });

    test('keeps the contract ahead of deposit and preparation', () => {
        const result = resolveClientJourney(snapshot({
            contract: 'sent',
            deposit: 'pending',
        }));

        expect(result.currentStage).toBe('contract');
        expect(result.action?.id).toBe('sign_contract');
    });

    test('marks an overdue deposit as the next action', () => {
        const result = resolveClientJourney(snapshot({
            deposit: 'overdue',
        }));

        expect(result.currentStage).toBe('deposit');
        expect(result.action?.id).toBe('pay_deposit');
        expect(result.eyebrow).toBe('Płatność po terminie');
    });

    test('opens the preparation guide for a scheduled session', () => {
        const result = resolveClientJourney(baseSnapshot);

        expect(result.currentStage).toBe('preparation');
        expect(result.action?.id).toBe('open_preparation');
        expect(result.action?.targetTab).toBe('preparation');
    });

    test('waits without a false CTA while the gallery is prepared', () => {
        const result = resolveClientJourney(snapshot({
            session: 'completed',
            gallery: 'not_available',
        }));

        expect(result.currentStage).toBe('session');
        expect(result.action).toBeNull();
    });

    test('moves to gallery selection when client choice is required', () => {
        const result = resolveClientJourney(snapshot({
            session: 'completed',
            gallery: 'selection_required',
        }));

        expect(result.currentStage).toBe('gallery');
        expect(result.action?.id).toBe('finish_selection');
        expect(result.action?.targetTab).toBe('sessions');
    });

    test('moves to order payment after the gallery stage', () => {
        const result = resolveClientJourney(snapshot({
            session: 'completed',
            gallery: 'selection_complete',
            order: 'payment_required',
        }));

        expect(result.currentStage).toBe('order');
        expect(result.action?.id).toBe('pay_order');
    });

    test('finishes with a download action when delivery is ready', () => {
        const result = resolveClientJourney(snapshot({
            session: 'completed',
            gallery: 'selection_complete',
            order: 'ready',
        }));

        expect(result.currentStage).toBe('completed');
        expect(result.action?.id).toBe('download_delivery');
        expect(result.timeline.every((item) => item.state !== 'upcoming')).toBe(true);
    });

    test('exposes exactly one current timeline stage', () => {
        const result = resolveClientJourney(snapshot({
            deposit: 'pending',
        }));

        expect(result.timeline.filter((item) => item.state === 'current')).toHaveLength(1);
        expect(result.timeline.find((item) => item.state === 'current')?.id).toBe('deposit');
    });
});
