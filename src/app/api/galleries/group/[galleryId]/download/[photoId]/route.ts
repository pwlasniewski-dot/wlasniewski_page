// API Route: GET /api/galleries/group/[galleryId]/download/[photoId]
// Parent: pobiera pojedyncze zdjęcie z galerii grupowej (pełna rozdzielczość)
// REQUIRES: Valid parent JWT token

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import sharp from 'sharp';
import { verifyParentToken, extractTokenFromHeader } from '@/lib/auth/parent-jwt';
import { logSystem } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ galleryId: string; photoId: string }> }
) {
  try {
    const { galleryId: gIdRaw, photoId: pIdRaw } = await params;
    const galleryId = parseInt(gIdRaw);
    const photoId = parseInt(pIdRaw);

    if (isNaN(galleryId) || isNaN(photoId)) {
      await logSystem('WARN', 'BASKET', 'GROUP_DOWNLOAD_SINGLE_INVALID_IDS', {
        gallery_id_raw: gIdRaw,
        photo_id_raw: pIdRaw,
      });
      return NextResponse.json({ error: 'Nieprawidłowe ID' }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader) || request.nextUrl.searchParams.get('download_token');
    if (!token) {
      await logSystem('WARN', 'BASKET', 'GROUP_DOWNLOAD_SINGLE_NO_TOKEN', {
        gallery_id: galleryId,
        photo_id: photoId,
      });
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    const payload = await verifyParentToken(token);
    if (!payload) {
      await logSystem('WARN', 'BASKET', 'GROUP_DOWNLOAD_SINGLE_INVALID_TOKEN', {
        gallery_id: galleryId,
        photo_id: photoId,
      });
      return NextResponse.json({ error: 'Nieprawidłowy token' }, { status: 401 });
    }

    if (payload.gallery_id !== galleryId) {
      await logSystem('WARN', 'BASKET', 'GROUP_DOWNLOAD_SINGLE_FORBIDDEN', {
        participant_id: payload.participant_id,
        token_gallery_id: payload.gallery_id,
        requested_gallery_id: galleryId,
        photo_id: photoId,
      });
      return NextResponse.json({ error: 'Brak dostępu' }, { status: 403 });
    }

    const gallery = await prisma.clientGallery.findFirst({
      where: { id: galleryId, gallery_mode: 'GROUP', is_active: true },
      select: { id: true, expires_at: true },
    });

    if (!gallery) {
      await logSystem('WARN', 'BASKET', 'GROUP_DOWNLOAD_SINGLE_GALLERY_UNAVAILABLE', {
        participant_id: payload.participant_id,
        gallery_id: galleryId,
        photo_id: photoId,
      });
      return NextResponse.json({ error: 'Galeria niedostępna' }, { status: 403 });
    }

    if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
      await logSystem('WARN', 'BASKET', 'GROUP_DOWNLOAD_SINGLE_GALLERY_EXPIRED', {
        participant_id: payload.participant_id,
        gallery_id: galleryId,
        photo_id: photoId,
      });
      return NextResponse.json({ error: 'Galeria wygasła' }, { status: 403 });
    }

    const photo = await prisma.galleryPhoto.findFirst({
      where: { id: photoId, gallery_id: galleryId },
      select: { 
        id: true, 
        file_url: true,
        download_source_url: true,
        width: true, 
        height: true,
        download_source_width: true,
        download_source_height: true,
      },
    });

    if (!photo) {
      await logSystem('WARN', 'BASKET', 'GROUP_DOWNLOAD_SINGLE_PHOTO_NOT_FOUND', {
        participant_id: payload.participant_id,
        gallery_id: galleryId,
        photo_id: photoId,
      });
      return NextResponse.json({ error: 'Zdjęcie nie istnieje' }, { status: 404 });
    }

    // Use download_source if mapped, otherwise use original file_url
    const downloadUrl = photo.download_source_url || photo.file_url;
    const isMapped = !!photo.download_source_url;

    // Pobieramy to, co jest — bez blokady na pełną jakość.
    // Fetch and return original bytes — no conversion/compression on download.
    const s3Response = await fetch(downloadUrl);
    if (!s3Response.ok) {
      await logSystem('ERROR', 'BASKET', 'GROUP_DOWNLOAD_SINGLE_S3_FETCH_FAILED', {
        participant_id: payload.participant_id,
        gallery_id: galleryId,
        photo_id: photoId,
        s3_status: s3Response.status,
        is_download_source: isMapped,
      });
      return NextResponse.json({ error: 'Nie udało się pobrać pliku' }, { status: 502 });
    }
    const srcBuffer = Buffer.from(await s3Response.arrayBuffer());

    // Konwersja do JPG — klient/laboratorium wymaga JPG, nie webp.
    // Jeśli źródło to już JPG (zmapowany oryginał), streamujemy surowo — bez utraty jakości.
    const srcContentType = (s3Response.headers.get('content-type') || '').toLowerCase();
    const srcIsJpeg = srcContentType.includes('jpeg') || /\.jpe?g(\?|$)/i.test(downloadUrl);
    let buffer: Buffer;
    let contentType: string;
    let ext: string;
    if (srcIsJpeg) {
      buffer = srcBuffer;
      contentType = 'image/jpeg';
      ext = 'jpg';
    } else {
      try {
        buffer = await sharp(srcBuffer)
          .pipelineColorspace('srgb')
          .toColorspace('srgb')
          .withMetadata({ icc: 'srgb' })
          .jpeg({ quality: 95, chromaSubsampling: '4:4:4', mozjpeg: true })
          .toBuffer();
        contentType = 'image/jpeg';
        ext = 'jpg';
      } catch (convErr) {
        console.error(`JPG conversion failed for photo ${photo.id}, serving original:`, convErr);
        buffer = srcBuffer;
        contentType = s3Response.headers.get('content-type') || 'application/octet-stream';
        const urlPath = (() => {
          try { return new URL(downloadUrl).pathname; } catch { return downloadUrl; }
        })();
        const extMatch = urlPath.match(/\.([a-zA-Z0-9]+)$/);
        ext = extMatch ? extMatch[1].toLowerCase() : 'bin';
      }
    }
    const filename = `zdjecie-${photo.id}.${ext}`;

    await logSystem('INFO', 'BASKET', 'GROUP_DOWNLOAD_SINGLE_SUCCESS', {
      participant_id: payload.participant_id,
      gallery_id: galleryId,
      photo_id: photoId,
      bytes: buffer.length,
      content_type: contentType,
      filename,
      is_download_source: isMapped,
    });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Parent download photo error:', error);
    await logSystem('ERROR', 'BASKET', 'GROUP_DOWNLOAD_SINGLE_FATAL_ERROR', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Błąd pobierania' }, { status: 500 });
  }
}
