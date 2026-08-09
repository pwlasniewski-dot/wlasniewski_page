import assert from 'node:assert/strict';
import test from 'node:test';
import { createGalleryArchiveJobId } from '../../src/lib/galleries/archive-jobs';

const galleryUpdatedAt = new Date('2026-08-09T09:00:00.000Z');

function individualJobId(archivePhotoIds: number[]) {
    return createGalleryArchiveJobId({
        kind: 'individual',
        galleryId: 42,
        participantId: null,
        requestedPhotoIds: archivePhotoIds,
        galleryUpdatedAt,
    });
}

test('individual gallery archive job ID is stable for the same purchased photos', () => {
    assert.equal(individualJobId([10, 20]), individualJobId([10, 20]));
});

test('individual gallery archive job ID changes when another photo is purchased', () => {
    assert.notEqual(individualJobId([10, 20]), individualJobId([10, 20, 30]));
});

test('individual gallery archive job ID canonicalizes photo order and duplicates', () => {
    assert.equal(individualJobId([30, 10, 20, 10]), individualJobId([10, 20, 30]));
});

test('photos without access do not affect the individual gallery archive job ID', () => {
    const allPhotoIds = [10, 20, 999];
    const entitledPhotoIds = new Set([10, 20]);
    const accessiblePhotoIds = allPhotoIds.filter(id => entitledPhotoIds.has(id));

    assert.equal(individualJobId(accessiblePhotoIds), individualJobId([10, 20]));
});
