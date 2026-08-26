export type SupportedUploadMime = 'application/pdf' | 'image/jpeg' | 'image/png';

const startsWith = (buffer: Buffer, signature: readonly number[]) =>
    buffer.length >= signature.length && signature.every((byte, index) => buffer[index] === byte);

export function hasExpectedMagicBytes(buffer: Buffer, mime: SupportedUploadMime): boolean {
    if (mime === 'application/pdf') return startsWith(buffer, [0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
    if (mime === 'image/jpeg') return startsWith(buffer, [0xff, 0xd8, 0xff]);
    if (mime === 'image/png') return startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    return false;
}

export function assertExpectedMagicBytes(buffer: Buffer, mime: SupportedUploadMime): void {
    if (!hasExpectedMagicBytes(buffer, mime)) {
        throw new Error('FILE_SIGNATURE_MISMATCH');
    }
}
