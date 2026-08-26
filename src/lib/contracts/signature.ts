import { createHash } from 'node:crypto';

export const MAX_SIGNATURE_PNG_BYTES = 500_000;
export const MAX_SIGNATURE_DIMENSION = 2_000;

export class ContractSignatureError extends Error {}

export function decodeContractSignature(input: unknown) {
    if (typeof input !== 'string') throw new ContractSignatureError('Podpis jest wymagany do zatwierdzenia umowy.');
    const match = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(input);
    if (!match) throw new ContractSignatureError('Podpis musi być poprawnym obrazem PNG.');
    const buffer = Buffer.from(match[1], 'base64');
    if (!buffer.length || buffer.length > MAX_SIGNATURE_PNG_BYTES) {
        throw new ContractSignatureError('Podpis jest pusty lub zbyt duży.');
    }
    const pngMagic = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    if (buffer.length < 24 || !buffer.subarray(0, 8).equals(pngMagic) || buffer.toString('ascii', 12, 16) !== 'IHDR') {
        throw new ContractSignatureError('Podpis nie jest poprawnym plikiem PNG.');
    }
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    if (!width || !height || width > MAX_SIGNATURE_DIMENSION || height > MAX_SIGNATURE_DIMENSION) {
        throw new ContractSignatureError('Wymiary obrazu podpisu są nieprawidłowe.');
    }
    return {
        buffer,
        width,
        height,
        sha256: createHash('sha256').update(buffer).digest('hex'),
    };
}
