import { createHash } from 'node:crypto';

export function galleryCartFingerprint(input: {
    galleryId: number;
    photoIds: number[];
    productIds: number[];
}): string {
    const canonical = JSON.stringify({
        galleryId: input.galleryId,
        photoIds: [...input.photoIds].sort((a, b) => a - b),
        productIds: [...input.productIds].sort((a, b) => a - b),
    });
    return createHash('sha256').update(canonical).digest('hex');
}
