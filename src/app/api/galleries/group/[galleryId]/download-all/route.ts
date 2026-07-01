// API Route: GET /api/galleries/group/[galleryId]/download-all
// Parent: pobiera całą galerię grupową jako ZIP (pełna rozdzielczość)
// REQUIRES: Valid parent JWT token
// NOTE: Builds ZIP fully in-memory (no Node.js streams) — required for Netlify serverless.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import archiver from 'archiver';
import { verifyParentToken, extractTokenFromHeader } from '@/lib/auth/parent-jwt';
import { uploadStreamToS3 } from '@/lib/storage/s3';
import { logSystem } from '@/lib/logger';

export const maxDuration = 60; // seconds — Netlify Pro allows up to 60s

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> }
) {
  try {
    const { galleryId: gIdRaw } = await params;
    const galleryId = parseInt(gIdRaw);

    if (isNaN(galleryId)) {
      await logSystem('WARN', 'BASKET', 'GROUP_DOWNLOAD_ALL_INVALID_GALLERY_ID', {
        gallery_id_raw: gIdRaw,
      });
      return NextResponse.json({ error: 'Nieprawidłowe ID' }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader) || request.nextUrl.searchParams.get('download_token');
    if (!token) {
      await logSystem('WARN', 'BASKET', 'GROUP_DOWNLOAD_ALL_NO_TOKEN', {
        gallery_id: galleryId,
      });
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    const payload = await verifyParentToken(token);
    if (!payload) {
      await logSystem('WARN', 'BASKET', 'GROUP_DOWNLOAD_ALL_INVALID_TOKEN', {
        gallery_id: galleryId,
      });
      return NextResponse.json({ error: 'Nieprawidłowy token' }, { status: 401 });
    }

    if (payload.gallery_id !== galleryId) {
      await logSystem('WARN', 'BASKET', 'GROUP_DOWNLOAD_ALL_FORBIDDEN', {
        participant_id: payload.participant_id,
        token_gallery_id: payload.gallery_id,
        requested_gallery_id: galleryId,
      });
      return NextResponse.json({ error: 'Brak dostępu' }, { status: 403 });
    }

    const gallery = await prisma.clientGallery.findFirst({
      where: { id: galleryId, gallery_mode: 'GROUP', is_active: true },
      include: { photos: { orderBy: { order_index: 'asc' } } },
    });

    if (!gallery) {
      await logSystem('WARN', 'BASKET', 'GROUP_DOWNLOAD_ALL_GALLERY_UNAVAILABLE', {
        participant_id: payload.participant_id,
        gallery_id: galleryId,
      });
      return NextResponse.json({ error: 'Galeria niedostępna' }, { status: 403 });
    }

    if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
      await logSystem('WARN', 'BASKET', 'GROUP_DOWNLOAD_ALL_GALLERY_EXPIRED', {
        participant_id: payload.participant_id,
        gallery_id: galleryId,
      });
      return NextResponse.json({ error: 'Galeria wygasła' }, { status: 403 });
    }

    if (gallery.photos.length === 0) {
      await logSystem('WARN', 'BASKET', 'GROUP_DOWNLOAD_ALL_EMPTY_GALLERY', {
        participant_id: payload.participant_id,
        gallery_id: galleryId,
      });
      return NextResponse.json({ error: 'Brak zdjęć w galerii' }, { status: 404 });
    }

    const requestedPhotoIdsRaw = new URL(request.url).searchParams.get('photo_ids') || '';
    const requestedPhotoIds = requestedPhotoIdsRaw
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value > 0);

    const targetPhotos = requestedPhotoIds.length > 0
      ? gallery.photos.filter((photo) => requestedPhotoIds.includes(photo.id))
      : gallery.photos;

    if (requestedPhotoIds.length > 0 && targetPhotos.length === 0) {
      return NextResponse.json({ error: 'Nie znaleziono wybranych zdjęć do pobrania' }, { status: 404 });
    }

    // Pobieramy to, co jest: zmapowane pełne źródło jeśli istnieje, w innym wypadku
    // aktualny plik (webp/podgląd). Nie blokujemy pobrania brakiem pełnej jakości.
    const eligiblePhotos = targetPhotos;

    if (eligiblePhotos.length === 0) {
      return NextResponse.json(
        { error: 'Brak zdjęć do pobrania' },
        { status: 404 }
      );
    }

    let addedPhotos = 0;
    let failedPhotos = 0;
    const failedPhotoIds: number[] = [];

    // ZIP jest budowany w locie i STRUMIENIOWANY prosto na S3 (bez trzymania całości
    // w pamięci) — to jedyny niezawodny sposób na duże galerie w serverless.
    // Klient dostaje mały JSON z linkiem do gotowego pliku na S3.
    // STORE mode (bez kompresji) — JPEG/webp się nie kompresują, oszczędza CPU.
    const CONCURRENCY = 20;
    const archive = archiver('zip', { store: true });
    archive.on('warning', (err) => console.warn('archiver warning:', err));

    const randomSuffix = Math.random().toString(36).slice(2, 10);
    const zipName = requestedPhotoIds.length > 0
      ? `galeria-${gallery.id}-wybrane-${eligiblePhotos.length}.zip`
      : `galeria-${gallery.id}.zip`;
    const s3Key = `temp-zips/gallery-${gallery.id}/${Date.now()}-${randomSuffix}-${zipName}`;

    // Start strumieniowego uploadu na S3 (czyta z archiwum w miarę napływu danych)
    const uploadPromise = uploadStreamToS3(
      archive as unknown as import('stream').Readable,
      s3Key,
      'application/zip',
      `attachment; filename="${zipName}"`,
    );

    // Pobieramy pliki z S3 RÓWNOLEGLE w partiach i dokładamy je do archiwum.
    for (let start = 0; start < eligiblePhotos.length; start += CONCURRENCY) {
      const batch = eligiblePhotos.slice(start, start + CONCURRENCY);
      const results = await Promise.all(batch.map(async (photo, offset) => {
        const i = start + offset;
        try {
          const downloadUrl = photo.download_source_url || photo.file_url;
          const res = await fetch(downloadUrl);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const srcBuf = Buffer.from(await res.arrayBuffer());
          const urlPath = (() => {
            try {
              return new URL(downloadUrl).pathname;
            } catch {
              return downloadUrl;
            }
          })();
          const extMatch = urlPath.match(/\.([a-zA-Z0-9]+)$/);
          const ext = extMatch ? extMatch[1].toLowerCase() : 'bin';
          return { index: i, buf: srcBuf, ext };
        } catch (err) {
          failedPhotos += 1;
          failedPhotoIds.push(photo.id);
          console.error(`Failed to fetch photo ${photo.id}:`, err);
          return null;
        }
      }));

      for (const item of results) {
        if (!item) continue;
        const idxStr = String(item.index + 1).padStart(3, '0');
        archive.append(item.buf, { name: `zdjecie-${idxStr}.${item.ext}` });
        addedPhotos += 1;
      }
    }

    if (addedPhotos === 0) {
      archive.destroy();
      await uploadPromise.catch(() => {});
      return NextResponse.json(
        { error: 'Nie udało się pobrać żadnego zdjęcia. Spróbuj ponownie za chwilę.' },
        { status: 502 }
      );
    }

    await archive.finalize();
    const downloadUrl = await uploadPromise;

    await logSystem('INFO', 'BASKET', 'GROUP_DOWNLOAD_ALL_SUCCESS', {
      participant_id: payload.participant_id,
      gallery_id: galleryId,
      requested_photo_count: gallery.photos.length,
      eligible_photo_count: eligiblePhotos.length,
      added_photo_count: addedPhotos,
      failed_photo_count: failedPhotos,
      failed_photo_ids: failedPhotoIds,
      zip_name: zipName,
      s3_key: s3Key,
    });

    return NextResponse.json({
      success: true,
      downloadUrl,
      fileName: zipName,
      photoCount: addedPhotos,
      failedCount: failedPhotos,
    });
  } catch (error) {
    console.error('Parent download-all error:', error);
    await logSystem('ERROR', 'BASKET', 'GROUP_DOWNLOAD_ALL_FATAL_ERROR', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Błąd generowania ZIP' }, { status: 500 });
  }
}
