// Utility functions for gallery photo processing
import sharp from 'sharp';
// import fs from 'fs/promises'; // Removed fs
// import path from 'path'; // Removed path
import crypto from 'crypto';
import { uploadToS3, deleteFromS3 } from './storage/s3';

export interface ProcessedPhoto {
    file_url: string;
    thumbnail_url: string;
    download_source_url: string;
    file_size: number;
    width: number;
    height: number;
    download_source_width: number;
    download_source_height: number;
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

    // Every upload creates two independent assets:
    // public, reduced WebP preview and private, full-quality JPG download source.
    const previewBuffer = await sharp(file)
        .rotate()
        .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
    const downloadBuffer = await sharp(file)
        .rotate()
        .jpeg({ quality: 94, chromaSubsampling: '4:4:4', mozjpeg: true })
        .toBuffer();

    const filename = `${timestamp}-${hash}.webp`;
    const downloadFilename = `download-${timestamp}-${hash}.jpg`;
    const folderPath = `galleries/${galleryId}`;

    // Get file size
    const file_size = previewBuffer.length;
    const content_hash = crypto.createHash('sha256').update(downloadBuffer).digest('hex');

    // Upload main image to S3
    const file_url = await uploadToS3(previewBuffer, `${folderPath}/${filename}`, 'image/webp');
    const download_source_url = await uploadToS3(
        downloadBuffer,
        `${folderPath}/${downloadFilename}`,
        'image/jpeg',
        { access: 'private' },
    );

    let width = 0;
    let height = 0;

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

    const processedMetadata = await sharp(previewBuffer).metadata();
    const downloadMetadata = await sharp(downloadBuffer).metadata();
    width = processedMetadata.width || 0;
    height = processedMetadata.height || 0;

    return {
        file_url,
        thumbnail_url,
        download_source_url,
        file_size,
        width,
        height,
        download_source_width: downloadMetadata.width || 0,
        download_source_height: downloadMetadata.height || 0,
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
    thumbnail_url: string | null,
    download_source_url?: string | null,
): Promise<void> {
    try {
        // Delete original
        await deleteFromS3(file_url);

        // Delete thumbnail if exists
        if (thumbnail_url) {
            await deleteFromS3(thumbnail_url);
        }
        if (download_source_url && download_source_url !== file_url) {
            await deleteFromS3(download_source_url);
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
