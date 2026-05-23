// Utility functions for gallery photo processing
import sharp from 'sharp';
// import fs from 'fs/promises'; // Removed fs
// import path from 'path'; // Removed path
import crypto from 'crypto';
import { uploadToS3, deleteFromS3 } from './storage/s3';

export interface ProcessedPhoto {
    file_url: string;
    thumbnail_url: string;
    file_size: number;
    width: number;
    height: number;
    content_hash: string;
}

/**
 * Process and save a photo with thumbnail
 * @param file - File buffer
 * @param galleryId - Gallery ID
 * @returns Processed photo metadata
 */
export async function processGalleryPhoto(
    file: Buffer,
    galleryId: number,
    options: { skipOptimization?: boolean; sourceMimeType?: string } = {}
): Promise<ProcessedPhoto> {
    // Generate unique filename
    const hash = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();

    // Determine extension and processing based on options
    let processedBuffer: Buffer;
    let extension: string;
    let mimeType: string;

    if (options.skipOptimization) {
        // Keep original
        processedBuffer = file;

        // Avoid sharp for passthrough uploads (more robust on serverless runtimes).
        const sourceMime = (options.sourceMimeType || '').toLowerCase();
        if (sourceMime === 'image/png') {
            extension = 'png';
            mimeType = 'image/png';
        } else if (sourceMime === 'image/webp') {
            extension = 'webp';
            mimeType = 'image/webp';
        } else {
            extension = 'jpg';
            mimeType = 'image/jpeg';
        }
    } else {
        const originalImage = sharp(file);

        // Optimize to WebP, Max 2000px
        extension = 'webp';
        mimeType = 'image/webp';

        processedBuffer = await originalImage
            .resize(2000, 2000, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 85 })
            .toBuffer();
    }

    const filename = `${timestamp}-${hash}.${extension}`;
    const folderPath = `galleries/${galleryId}`;

    // Get file size
    const file_size = processedBuffer.length;
    const content_hash = crypto.createHash('sha256').update(processedBuffer).digest('hex');

    // Upload main image to S3
    const file_url = await uploadToS3(processedBuffer, `${folderPath}/${filename}`, mimeType);

    let thumbnail_url = file_url;
    let width = 0;
    let height = 0;

    if (!options.skipOptimization) {
        const thumbnailFilename = `thumb_${timestamp}-${hash}.webp`;

        const thumbnailBuffer = await sharp(file)
            .rotate() // Ensure rotation is correct
            .resize(400, 400, {
                fit: 'cover',
                position: 'center'
            })
            .webp({ quality: 80 })
            .toBuffer();

        // Upload thumbnail to S3
        thumbnail_url = await uploadToS3(thumbnailBuffer, `${folderPath}/${thumbnailFilename}`, 'image/webp');

        // Get dimensions of processed image
        const processedMetadata = await sharp(processedBuffer).metadata();
        width = processedMetadata.width || 0;
        height = processedMetadata.height || 0;
    }

    return {
        file_url,
        thumbnail_url,
        file_size,
        width,
        height,
        content_hash,
    };
}

/**
 * Delete photo files from storage
 * @param file_url - Original file URL
 * @param thumbnail_url - Thumbnail URL
 */
export async function deleteGalleryPhoto(
    file_url: string,
    thumbnail_url: string | null
): Promise<void> {
    try {
        // Delete original
        await deleteFromS3(file_url);

        // Delete thumbnail if exists
        if (thumbnail_url) {
            await deleteFromS3(thumbnail_url);
        }

    } catch (error) {
        console.error('Failed to delete files from S3:', error);
        // We don't throw here to ensure database record deletion proceeds even if S3 fails
        // or maybe we should? For now log and continue is safer for data consistency if S3 is flaky.
    }
}

/**
 * Generate unique access code for gallery
 */
export function generateAccessCode(): string {
    return crypto.randomBytes(16).toString('hex');
}
