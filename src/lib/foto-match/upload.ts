/**
 * Foto-Match: helper do uploadu + moderacji.
 * Buforuje plik, robi resize (max 1600px) + JPEG kompresję przez sharp,
 * uploaduje do S3, woła Rekognition, zwraca metadane do zapisu w DB.
 */
import sharp from 'sharp';
import { uploadToS3 } from '@/lib/storage/s3';
import { detectModeration, type ModerationResult } from './moderation';

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 85;
const FOTO_MATCH_PREFIX = 'foto-match/';

export type ProcessedUpload = {
    url: string;
    moderation: ModerationResult;
    sizeBytes: number;
    mimeType: 'image/jpeg';
};

/**
 * Pełen pipeline: resize → S3 → Rekognition.
 * Wszystko w jednym buforze — nie czyta pliku ponownie z S3 dla AI.
 */
export async function processProfilePhoto(
    rawBuffer: Buffer,
    options: { profileId: number; index: number }
): Promise<ProcessedUpload> {
    // 1. Resize + recompress
    const processed = await sharp(rawBuffer)
        .rotate() // honor EXIF
        .resize(MAX_DIMENSION, MAX_DIMENSION, {
            fit: 'inside',
            withoutEnlargement: true,
        })
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
        .toBuffer();

    // 2. Equipment key + S3 upload
    const ts = Date.now();
    const filename = `${FOTO_MATCH_PREFIX}profile/${options.profileId}/photo-${options.index}-${ts}.jpg`;
    const url = await uploadToS3(processed, filename, 'image/jpeg');

    // 3. AI moderation (równolegle do uploadu można by zrobić, ale Rekognition
    //    woli mniejsze obrazy = robimy po resize, sekwencyjnie).
    const moderation = await detectModeration(processed);

    return {
        url,
        moderation,
        sizeBytes: processed.length,
        mimeType: 'image/jpeg',
    };
}

/**
 * Wariant dla zdjęć weryfikacyjnych (selfie / dowód) — bez Rekognition,
 * tylko upload (manual review przez admina).
 * Zapisujemy w prywatnym prefiksie (mimo że bucket public, oddzielamy katalogiem
 * + nazwy z hashem).
 */
export async function processVerificationPhoto(
    rawBuffer: Buffer,
    options: { profileId: number; kind: 'selfie' | 'id_doc' }
): Promise<{ url: string; sizeBytes: number }> {
    const processed = await sharp(rawBuffer)
        .rotate()
        .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90, mozjpeg: true })
        .toBuffer();

    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 10);
    const filename = `${FOTO_MATCH_PREFIX}verification/${options.profileId}/${options.kind}-${ts}-${rand}.jpg`;
    const url = await uploadToS3(processed, filename, 'image/jpeg');

    return { url, sizeBytes: processed.length };
}
