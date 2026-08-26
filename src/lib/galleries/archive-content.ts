import { createHash } from 'crypto';

export type GalleryArchiveContentKind = 'individual' | 'group';

export function createGalleryArchiveJobId(input: {
    kind: GalleryArchiveContentKind;
    galleryId: number;
    participantId: number | null;
    requestedPhotoIds: number[];
    galleryUpdatedAt: Date;
    contentFingerprint?: string;
}) {
    const canonical = JSON.stringify({
        kind: input.kind,
        galleryId: input.galleryId,
        participantId: input.participantId,
        requestedPhotoIds: [...new Set(input.requestedPhotoIds)].sort((a, b) => a - b),
        // A gallery row timestamp alone does not reliably change when a photo
        // source is remapped. Callers that know the actual manifest provide a
        // fingerprint of photo IDs + stable HQ object keys.
        contentFingerprint: input.contentFingerprint || input.galleryUpdatedAt.toISOString(),
    });
    return createHash('sha256').update(canonical).digest('hex');
}

export function createGalleryArchiveContentFingerprint(
    photos: Array<{ id: number; download_source_url: string | null }>,
) {
    const manifest = photos
        .map(photo => [photo.id, photo.download_source_url] as const)
        .sort((a, b) => a[0] - b[0]);
    return createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
}
