// API Route: PUT /api/admin/galleries/[id]/photos/[photoId]
// Update or delete a gallery photo

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import crypto from 'crypto';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { deleteFromS3, uploadToS3 } from '@/lib/storage/s3';
import { logSystem } from '@/lib/logger';

const MAX_FILE_SIZE = 30 * 1024 * 1024;
const MIN_DOWNLOAD_WIDTH = 3000;
const MIN_DOWNLOAD_HEIGHT = 2000;

type ReplaceMode = 'both' | 'preview' | 'download';

function extractS3Key(fileUrl: string): string {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http')) {
        const parsed = new URL(fileUrl);
        return decodeURIComponent(parsed.pathname.replace(/^\//, ''));
    }
    return fileUrl;
}

function normalizeReplaceMode(value: FormDataEntryValue | null): ReplaceMode {
    const v = String(value || '').trim().toLowerCase();
    if (v === 'preview') return 'preview';
    if (v === 'download') return 'download';
    return 'both';
}

// POST - Replace photo file in-place (keeps the same photo ID)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; photoId: string }> }
) {
    return withAuth(request, async (req) => {
        try {
            const { id, photoId } = await params;
            const galleryId = Number(id);
            const parsedPhotoId = Number(photoId);

            if (!Number.isInteger(galleryId) || !Number.isInteger(parsedPhotoId)) {
                await logSystem('WARN', 'MEDIA_UPLOAD', 'GALLERY_PHOTO_REPLACE_INVALID_IDS', {
                    admin_user_id: req.user?.id || null,
                    gallery_id_raw: id,
                    photo_id_raw: photoId,
                });
                return NextResponse.json(
                    { success: false, error: 'Nieprawidłowe ID galerii lub zdjęcia' },
                    { status: 400 }
                );
            }

            const existingPhoto = await prisma.galleryPhoto.findFirst({
                where: { id: parsedPhotoId, gallery_id: galleryId },
                select: {
                    id: true,
                    file_url: true,
                    thumbnail_url: true,
                    file_size: true,
                    width: true,
                    height: true,
                },
            });

            if (!existingPhoto) {
                await logSystem('WARN', 'MEDIA_UPLOAD', 'GALLERY_PHOTO_REPLACE_NOT_FOUND', {
                    admin_user_id: req.user?.id || null,
                    gallery_id: galleryId,
                    photo_id: parsedPhotoId,
                });
                return NextResponse.json(
                    { success: false, error: 'Zdjęcie nie znalezione w tej galerii' },
                    { status: 404 }
                );
            }

            const formData = await request.formData();
            const file = formData.get('photo') as File | null;
            const mode = normalizeReplaceMode(formData.get('mode'));

            if (!file || !file.type?.startsWith('image/')) {
                await logSystem('WARN', 'MEDIA_UPLOAD', 'GALLERY_PHOTO_REPLACE_INVALID_FILE', {
                    admin_user_id: req.user?.id || null,
                    gallery_id: galleryId,
                    photo_id: parsedPhotoId,
                    file_type: file?.type || null,
                });
                return NextResponse.json(
                    { success: false, error: 'Wymagany jest poprawny plik obrazu (pole photo)' },
                    { status: 400 }
                );
            }

            if (file.size > MAX_FILE_SIZE) {
                await logSystem('WARN', 'MEDIA_UPLOAD', 'GALLERY_PHOTO_REPLACE_FILE_TOO_LARGE', {
                    admin_user_id: req.user?.id || null,
                    gallery_id: galleryId,
                    photo_id: parsedPhotoId,
                    file_size: file.size,
                    max_size: MAX_FILE_SIZE,
                });
                return NextResponse.json(
                    { success: false, error: `Plik jest za duży (max 30MB)` },
                    { status: 400 }
                );
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            const metadata = await sharp(buffer).metadata();

            const newWidth = metadata.width || 0;
            const newHeight = metadata.height || 0;
            const shouldReplaceDownload = mode === 'both' || mode === 'download';
            const shouldReplacePreview = mode === 'both' || mode === 'preview';

            if (shouldReplaceDownload && (newWidth < MIN_DOWNLOAD_WIDTH || newHeight < MIN_DOWNLOAD_HEIGHT)) {
                await logSystem('WARN', 'MEDIA_UPLOAD', 'GALLERY_PHOTO_REPLACE_DOWNLOAD_TOO_SMALL', {
                    admin_user_id: req.user?.id || null,
                    gallery_id: galleryId,
                    photo_id: parsedPhotoId,
                    mode,
                    width: newWidth,
                    height: newHeight,
                    min_width: MIN_DOWNLOAD_WIDTH,
                    min_height: MIN_DOWNLOAD_HEIGHT,
                });
                return NextResponse.json(
                    {
                        success: false,
                        error: `Źródło pobierania musi mieć min. ${MIN_DOWNLOAD_WIDTH}x${MIN_DOWNLOAD_HEIGHT}px`,
                    },
                    { status: 400 }
                );
            }

            const hash = crypto.randomBytes(8).toString('hex');
            const timestamp = Date.now();
            const folderPath = `galleries/${galleryId}`;
            const updateData: any = {};
            let downloadKey: string | null = null;
            let thumbnailKey: string | null = null;

            // Upload to SEPARATE S3 keys — do not modify original files
            if (shouldReplaceDownload) {
                const downloadFilename = `download-${timestamp}-${hash}.jpg`;
                downloadKey = `${folderPath}/${downloadFilename}`;
                const normalizedDownload = await sharp(buffer)
                    .rotate()
                    .jpeg({ quality: 94, chromaSubsampling: '4:4:4', mozjpeg: true })
                    .toBuffer();
                const downloadUrl = await uploadToS3(normalizedDownload, downloadKey, 'image/jpeg', { access: 'private' });
                
                updateData.download_source_url = downloadUrl;
                updateData.download_source_width = newWidth;
                updateData.download_source_height = newHeight;
            }

            if (shouldReplacePreview) {
                const thumbFilename = `preview-thumb-${timestamp}-${hash}.webp`;
                thumbnailKey = `${folderPath}/${thumbFilename}`;
                const thumbnailBuffer = await sharp(buffer)
                    .rotate()
                    .resize(400, 400, {
                        fit: 'cover',
                        position: 'center',
                    })
                    .webp({ quality: 80 })
                    .toBuffer();

                const thumbnailUrl = await uploadToS3(thumbnailBuffer, thumbnailKey, 'image/webp');
                updateData.thumbnail_source_url = thumbnailUrl;
            }

            const updated = await prisma.galleryPhoto.update({
                where: { id: parsedPhotoId },
                data: updateData,
            });

            await logSystem('INFO', 'MEDIA_UPLOAD', 'GALLERY_PHOTO_REPLACED_IN_PLACE', {
                admin_user_id: req.user?.id || null,
                gallery_id: galleryId,
                photo_id: parsedPhotoId,
                mode,
                file_key: downloadKey,
                thumbnail_key: thumbnailKey,
                old: {
                    file_size: existingPhoto.file_size,
                    width: existingPhoto.width,
                    height: existingPhoto.height,
                },
                new: {
                    file_size: updated.file_size,
                    width: updated.width,
                    height: updated.height,
                },
            });

            return NextResponse.json({
                success: true,
                message: mode === 'preview'
                    ? 'Podmieniono źródło podglądu zdjęcia'
                    : mode === 'download'
                        ? 'Podmieniono źródło pobierania (oryginał)'
                        : 'Podmieniono źródło podglądu i pobierania',
                photo: updated,
            });
        } catch (error) {
            console.error('Error replacing photo:', error);
            await logSystem('ERROR', 'MEDIA_UPLOAD', 'GALLERY_PHOTO_REPLACE_FAILED', {
                admin_user_id: req.user?.id || null,
                error: error instanceof Error ? error.message : String(error),
            });
            return NextResponse.json(
                { success: false, error: 'Nie udało się podmienić zdjęcia' },
                { status: 500 }
            );
        }
    });
}

// PUT - Update photo properties
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; photoId: string }> }
) {
    return withAuth(request, async () => {
        try {
            const { id, photoId } = await params;
            const galleryId = Number(id);
            const parsedPhotoId = Number(photoId);
            if (!Number.isInteger(galleryId) || !Number.isInteger(parsedPhotoId)) {
                return NextResponse.json({ success: false, error: 'Nieprawidłowe ID' }, { status: 400 });
            }
            const body = await request.json();

            const { is_standard, order_index } = body;

            const updateData: any = {};
            if (is_standard !== undefined) updateData.is_standard = is_standard;
            if (order_index !== undefined) updateData.order_index = order_index;

            const existing = await prisma.galleryPhoto.findFirst({
                where: { id: parsedPhotoId, gallery_id: galleryId },
                select: { id: true, is_standard: true, gallery: { select: { is_active: true, gallery_mode: true } } },
            });
            if (!existing) {
                return NextResponse.json({ success: false, error: 'Zdjęcie nie należy do tej galerii' }, { status: 404 });
            }
            if (existing.gallery.is_active && existing.gallery.gallery_mode !== 'GROUP'
                && is_standard !== undefined && Boolean(is_standard) !== existing.is_standard) {
                return NextResponse.json({
                    success: false,
                    error: 'Nie można zmienić składu pakietu w aktywnej galerii. Najpierw wyłącz dostęp klienta.',
                }, { status: 409 });
            }

            const photo = await prisma.galleryPhoto.update({
                where: { id: parsedPhotoId },
                data: updateData,
            });

            return NextResponse.json({
                success: true,
                photo,
            });
        } catch (error) {
            console.error('Error updating photo:', error);
            return NextResponse.json(
                { success: false, error: 'Nie udało się zaktualizować zdjęcia' },
                { status: 500 }
            );
        }
    });
}

// GalleryAdmin historically used PATCH. Keep both methods on the same validated path.
export const PATCH = PUT;

// DELETE - Delete photo
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; photoId: string }> }
) {
    return withAuth(request, async () => {
        try {
            const { id, photoId } = await params;
            const galleryId = Number(id);
            const parsedPhotoId = Number(photoId);
            if (!Number.isInteger(galleryId) || !Number.isInteger(parsedPhotoId)) {
                return NextResponse.json({ success: false, error: 'Nieprawidłowe ID' }, { status: 400 });
            }

            // Get photo info to delete files
            const photo = await prisma.galleryPhoto.findFirst({
                where: { id: parsedPhotoId, gallery_id: galleryId }
            });

            if (!photo) {
                return NextResponse.json(
                    { success: false, error: 'Zdjęcie nie znalezione' },
                    { status: 404 }
                );
            }
            const gallery = await prisma.clientGallery.findUnique({
                where: { id: galleryId },
                select: { is_active: true, gallery_mode: true },
            });
            if (gallery?.is_active && gallery.gallery_mode !== 'GROUP' && photo.is_standard) {
                return NextResponse.json({
                    success: false,
                    error: 'Nie można usunąć zdjęcia należącego do pakietu z aktywnej galerii. Najpierw wyłącz dostęp klienta.',
                }, { status: 409 });
            }

            // Delete files from S3
            try {
                if (photo.file_url) {
                    await deleteFromS3(photo.file_url);
                }
                if (photo.thumbnail_url) {
                    await deleteFromS3(photo.thumbnail_url);
                }
                if (photo.download_source_url && photo.download_source_url !== photo.file_url) {
                    await deleteFromS3(photo.download_source_url);
                }
                if (photo.thumbnail_source_url && photo.thumbnail_source_url !== photo.thumbnail_url) {
                    await deleteFromS3(photo.thumbnail_source_url);
                }
            } catch (fileError) {
                console.error('Error deleting files from S3:', fileError);
                // Continue even if S3 deletion fails
            }

            // Delete from database
            await prisma.galleryPhoto.delete({
                where: { id: parsedPhotoId }
            });

            return NextResponse.json({
                success: true,
                message: 'Zdjęcie usunięte',
            });
        } catch (error) {
            console.error('Error deleting photo:', error);
            return NextResponse.json(
                { success: false, error: 'Nie udało się usunąć zdjęcia' },
                { status: 500 }
            );
        }
    });
}
