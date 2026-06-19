// API Route: GET /api/admin/galleries/[id]/participants/[participantId]/download-all
// Admin: pobiera ZIP z wszystkimi zdjęciami wybranymi przez rodzica w pełnej rozdzielczości
// Nazwy plików w archiwum: {IDENTIFIKATOR}_{Imie-Nazwisko}_{NN}.jpg

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import sharp from 'sharp';
import { withAuth } from '@/lib/auth/middleware';

function normalizeDisplayName(input: string | null | undefined): string {
  const safe = (input || 'Klient')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return safe || 'Klient';
}

function normalizeZipFilename(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'klient';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  return withAuth(request, async () => {
    try {
      const { id, participantId } = await params;
      const galleryId = Number(id);
      const pId = Number(participantId);

      if (isNaN(galleryId) || isNaN(pId)) {
        return NextResponse.json({ error: 'Nieprawidłowe ID' }, { status: 400 });
      }

      const participant = await prisma.galleryParticipant.findFirst({
        where: { id: pId, gallery_id: galleryId },
        include: {
          selections: {
            include: {
              photo: { select: { id: true, file_url: true } },
            },
            orderBy: { selected_at: 'asc' },
          },
        },
      });

      if (!participant) {
        return NextResponse.json({ error: 'Uczestnik nie istnieje' }, { status: 404 });
      }

      if (participant.selections.length === 0) {
        return NextResponse.json({ error: 'Rodzic nie wybrał żadnych zdjęć' }, { status: 404 });
      }

      const displayName = normalizeDisplayName(participant.parent_name);
      const zipName = `${normalizeZipFilename(displayName)}-wybrane-zdjecia.zip`;

      const passthrough = new PassThrough();
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.on('error', (err) => {
        console.error('Archiver error:', err);
        passthrough.end();
      });

      archive.pipe(passthrough);

      (async () => {
        try {
          for (let i = 0; i < participant.selections.length; i++) {
            const sel = participant.selections[i];
            try {
              const response = await fetch(sel.photo.file_url);
              if (!response.ok) throw new Error(`HTTP ${response.status}`);
              const sourceBuffer = Buffer.from(await response.arrayBuffer());
              const jpgBuffer = await sharp(sourceBuffer)
                .pipelineColorspace('srgb')
                .toColorspace('srgb')
                .withMetadata({ icc: 'srgb' })
                .jpeg({ quality: 95, chromaSubsampling: '4:4:4', mozjpeg: true })
                .toBuffer();

              const idxStr = String(i + 1);
              const name = `${displayName} ${idxStr}.jpg`;
              archive.append(jpgBuffer, { name });
            } catch (err) {
              console.error(`Failed to add photo ${sel.photo.id}:`, err);
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
      console.error('Admin participant download-all error:', error);
      return NextResponse.json({ error: 'Błąd generowania ZIP' }, { status: 500 });
    }
  });
}
