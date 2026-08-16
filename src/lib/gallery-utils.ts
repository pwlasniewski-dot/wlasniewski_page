// Utility functions for gallery photo processing
import sharp from 'sharp';
// import fs from 'fs/promises'; // Removed fs
// import path from 'path'; // Removed path
import crypto from 'crypto';
import { uploadToS3, deleteFromS3 } from './storage/s3';

// Gallery uploads run inside a reused serverless process. Keep libvips from
// retaining large decoded images between requests and avoid multiplying the
// memory cost of a single high-resolution photo across worker threads.
sharp.cache({ memory: 16, files: 0, items: 20 });
sharp.concurrency(1);

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

    const filename = `${timestamp}-${hash}.webp`;
    const downloadFilename = `download-${timestamp}-${hash}.jpg`;
    const thumbnailFilename = `thumb_${timestamp}-${hash}.webp`;
    const folderPath = `galleries/${galleryId}`;

    // Build and upload the smaller public assets in their own scope. The
    // thumbnail is derived from the already reduced preview, so the original
    // high-resolution image is decoded only twice instead of three times.
    const publicAssets = await (async () => {
        const previewBuffer = await sharp(file)
            .rotate()
            .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 85 })
            .toBuffer();
        const processedMetadata = await sharp(previewBuffer).metadata();
        const thumbnailBuffer = await sharp(previewBuffer)
            .resize(400, 400, { fit: 'cover', position: 'center' })
            .webp({ quality: 80 })
            .toBuffer();
        const thumbnailUrl = await uploadToS3(
            thumbnailBuffer,
            `${folderPath}/${thumbnailFilename}`,
            'image/webp',
        );
        const fileUrl = await uploadToS3(previewBuffer, `${folderPath}/${filename}`, 'image/webp');

        return {
            fileUrl,
            thumbnailUrl,
            fileSize: previewBuffer.length,
            width: processedMetadata.width || 0,
            height: processedMetadata.height || 0,
        };
    })();

    // Create the private JPG HQ only after the public buffers are no longer
    // needed by image processing. This lowers peak memory for large originals.
    const downloadAsset = await (async () => {
        const downloadBuffer = await sharp(file)
            .rotate()
            .jpeg({ quality: 94, chromaSubsampling: '4:4:4', mozjpeg: true })
            .toBuffer();
        const downloadMetadata = await sharp(downloadBuffer).metadata();
        const contentHash = crypto.createHash('sha256').update(downloadBuffer).digest('hex');
        const downloadSourceUrl = await uploadToS3(
            downloadBuffer,
            `${folderPath}/${downloadFilename}`,
            'image/jpeg',
            { access: 'private' },
        );

        return {
            downloadSourceUrl,
            contentHash,
            width: downloadMetadata.width || 0,
            height: downloadMetadata.height || 0,
        };
    })();

    return {
        file_url: publicAssets.fileUrl,
        thumbnail_url: publicAssets.thumbnailUrl,
        download_source_url: downloadAsset.downloadSourceUrl,
        file_size: publicAssets.fileSize,
        width: publicAssets.width,
        height: publicAssets.height,
        download_source_width: downloadAsset.width,
        download_source_height: downloadAsset.height,
        content_hash: downloadAsset.contentHash,
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
