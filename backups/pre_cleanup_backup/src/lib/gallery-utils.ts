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
    options: { skipOptimization?: boolean } = {}
): Promise<ProcessedPhoto> {
    // Generate unique filename
    const hash = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();

    // Determine extension and processing based on options
    let processedBuffer: Buffer;
    let extension: string;
    let mimeType: string;

    const originalImage = sharp(file);
    const metadata = await originalImage.metadata();

    if (options.skipOptimization) {
        // Keep original
        processedBuffer = file;
        // Detect extension from format or default to jpg
        extension = metadata.format === 'png' ? 'png' : 'jpg';
        mimeType = metadata.format === 'png' ? 'image/png' : 'image/jpeg';
    } else {
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

    // Upload main image to S3
    const file_url = await uploadToS3(processedBuffer, `${folderPath}/${filename}`, mimeType);

    // Create thumbnail (400px width) - Always WebP or JPEG? Let's stick to JPEG for thumbnails for max compatibility or WebP? 
    // Let's use WebP for thumbnails too if main is optimized, or JPEG if not? 
    // Actually, thumbnails should be small. WebP is good.
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
    const thumbnail_url = await uploadToS3(thumbnailBuffer, `${folderPath}/${thumbnailFilename}`, 'image/webp');

    // Get dimensions of processed image
    const processedMetadata = await sharp(processedBuffer).metadata();

    return {
        file_url,
        thumbnail_url,
        file_size,
        width: processedMetadata.width || 0,
        height: processedMetadata.height || 0,
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
