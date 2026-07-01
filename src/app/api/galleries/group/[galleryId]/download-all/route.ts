// API Route: GET /api/galleries/group/[galleryId]/download-all
// Parent: pobiera całą galerię grupową jako ZIP (pełna rozdzielczość)
// REQUIRES: Valid parent JWT token
// NOTE: Builds ZIP fully in-memory (no Node.js streams) — required for Netlify serverless.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import archiver from 'archiver';
import { verifyParentToken, extractTokenFromHeader } from '@/lib/auth/parent-jwt';
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

    // Build ZIP fully in memory — required for Netlify serverless (no streaming support)
    // STORE mode (no compression) — JPEGs don't compress, saves CPU/memory
    const zipBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const archive = archiver('zip', { store: true });

      archive.on('data', (chunk: Buffer) => chunks.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', reject);
      (async () => {
        try {
          for (let i = 0; i < eligiblePhotos.length; i++) {
            const photo = eligiblePhotos[i];
            try {
              const downloadUrl = photo.download_source_url || photo.file_url;
              const res = await fetch(downloadUrl);
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const srcBuf = Buffer.from(await res.arrayBuffer());
              const idxStr = String(i + 1).padStart(3, '0');
              const urlPath = (() => {
                try {
                  return new URL(downloadUrl).pathname;
                } catch {
                  return downloadUrl;
                }
              })();
              const extMatch = urlPath.match(/\.([a-zA-Z0-9]+)$/);
              const ext = extMatch ? extMatch[1].toLowerCase() : 'bin';
              archive.append(srcBuf, { name: `zdjecie-${idxStr}.${ext}` });
              addedPhotos += 1;
            } catch (err) {
              failedPhotos += 1;
              failedPhotoIds.push(photo.id);
              console.error(`Failed to add photo ${photo.id}:`, err);
            }
          }
          await archive.finalize();
        } catch (err) {
          reject(err);
        }
      })();
    });

    const zipName = `galeria-${gallery.id}.zip`;
    await logSystem('INFO', 'BASKET', 'GROUP_DOWNLOAD_ALL_SUCCESS', {
      participant_id: payload.participant_id,
      gallery_id: galleryId,
      requested_photo_count: gallery.photos.length,
      eligible_photo_count: eligiblePhotos.length,
      added_photo_count: addedPhotos,
      failed_photo_count: failedPhotos,
      failed_photo_ids: failedPhotoIds,
      zip_bytes: zipBuffer.length,
      zip_name: zipName,
    });

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipName}"`,
        'Content-Length': String(zipBuffer.length),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Parent download-all error:', error);
    await logSystem('ERROR', 'BASKET', 'GROUP_DOWNLOAD_ALL_FATAL_ERROR', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Błąd generowania ZIP' }, { status: 500 });
  }
}
