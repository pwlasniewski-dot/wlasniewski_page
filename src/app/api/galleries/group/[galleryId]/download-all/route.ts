// API Route: GET /api/galleries/group/[galleryId]/download-all
// Parent: pobiera całą galerię grupową jako ZIP (pełna rozdzielczość)
// REQUIRES: Valid parent JWT token
// NOTE: Builds ZIP fully in-memory (no Node.js streams) — required for Netlify serverless.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import archiver from 'archiver';
import { verifyParentToken, extractTokenFromHeader } from '@/lib/auth/parent-jwt';

export const maxDuration = 60; // seconds — Netlify Pro allows up to 60s

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

    const toJpegBuffer = async (input: Buffer): Promise<Buffer> => input;

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
          for (let i = 0; i < gallery.photos.length; i++) {
            const photo = gallery.photos[i];
            try {
              const res = await fetch(photo.file_url);
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const srcBuf = Buffer.from(await res.arrayBuffer());
              const jpegBuf = await toJpegBuffer(srcBuf);
              const idxStr = String(i + 1).padStart(3, '0');
              archive.append(jpegBuf, { name: `zdjecie-${idxStr}.jpg` });
            } catch (err) {
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
    return NextResponse.json({ error: 'Błąd generowania ZIP' }, { status: 500 });
  }
}
