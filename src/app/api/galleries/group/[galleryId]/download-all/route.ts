// API Route: GET /api/galleries/group/[galleryId]/download-all
// Parent: pobiera całą galerię grupową jako ZIP (pełna rozdzielczość)
// REQUIRES: Valid parent JWT token

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import { verifyParentToken, extractTokenFromHeader } from '@/lib/auth/parent-jwt';
import sharp from 'sharp';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> }
) {
  try {
    const { galleryId: gIdRaw } = await params;
    const galleryId = parseInt(gIdRaw);

    if (isNaN(galleryId)) {
      return NextResponse.json({ error: 'Nieprawidłowe ID' }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    const payload = await verifyParentToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Nieprawidłowy token' }, { status: 401 });
    }

    if (payload.gallery_id !== galleryId) {
      return NextResponse.json({ error: 'Brak dostępu' }, { status: 403 });
    }

    const gallery = await prisma.clientGallery.findFirst({
      where: { id: galleryId, gallery_mode: 'GROUP', is_active: true },
      include: { photos: { orderBy: { order_index: 'asc' } } },
    });

    if (!gallery) {
      return NextResponse.json({ error: 'Galeria niedostępna' }, { status: 403 });
    }

    if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Galeria wygasła' }, { status: 403 });
    }

    if (gallery.photos.length === 0) {
      return NextResponse.json({ error: 'Brak zdjęć w galerii' }, { status: 404 });
    }

    const zipName = `galeria-${gallery.id}.zip`;
    const passthrough = new PassThrough();
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => {
      console.error('Archiver error:', err);
      passthrough.end();
    });

    archive.pipe(passthrough);

    const toJpegBuffer = async (input: Buffer) => {
      try {
        return await sharp(input)
          .rotate()
          .jpeg({ quality: 92, mozjpeg: true })
          .toBuffer();
      } catch {
        // If conversion fails for a specific file, keep original bytes to avoid breaking full ZIP.
        return input;
      }
    };

    (async () => {
      try {
        for (let i = 0; i < gallery.photos.length; i++) {
          const photo = gallery.photos[i];
          try {
            const response = await fetch(photo.file_url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const srcBuf = Buffer.from(await response.arrayBuffer());
            const jpegBuf = await toJpegBuffer(srcBuf);
            const idxStr = String(i + 1).padStart(3, '0');
            archive.append(jpegBuf, { name: `zdjecie-${idxStr}.jpg` });
          } catch (err) {
            console.error(`Failed to add photo ${photo.id}:`, err);
          }
        }
        await archive.finalize();
      } catch (err) {
        console.error('ZIP generation error:', err);
        archive.abort();
      }
    })();

    return new NextResponse(passthrough as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipName}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Parent download-all error:', error);
    return NextResponse.json({ error: 'Błąd generowania ZIP' }, { status: 500 });
  }
}
