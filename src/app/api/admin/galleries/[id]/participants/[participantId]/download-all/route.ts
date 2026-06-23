// API Route: GET /api/admin/galleries/[id]/participants/[participantId]/download-all
// Admin: pobiera ZIP z wszystkimi zdjęciami do druku rodzica (standard + opłacone dodatkowe)
// Nazwy plików w archiwum: {Imie-Nazwisko} {NN} [{FORMAT}] [{STANDARD|PLATNE}].jpg

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import sharp from 'sharp';
import { withAuth } from '@/lib/auth/middleware';

const DEFAULT_STANDARD_PRINT_FORMAT = '15x21';

function parsePhotoIds(raw: string | null | undefined): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0);
    }
  } catch {
    // ignore invalid payload
  }
  return [];
}

function parsePaidPrintFormat(raw: string | null | undefined): string {
  if (!raw) return '10x15';
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed && parsed.kind === 'group_extra_prints' && typeof parsed.print_size === 'string') {
      return parsed.print_size;
    }
  } catch {
    // ignore invalid payload
  }
  return '10x15';
}

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

      const paidOrders = await prisma.photoOrder.findMany({
        where: {
          gallery_id: galleryId,
          participant_id: pId,
          payment_status: { in: ['paid', 'completed'] },
        },
        select: {
          photo_ids: true,
          product_ids: true,
          created_at: true,
        },
        orderBy: { created_at: 'asc' },
      });

      if (!participant) {
        return NextResponse.json({ error: 'Uczestnik nie istnieje' }, { status: 404 });
      }

      const hasStandard = participant.selections.length > 0;
      const hasPaid = paidOrders.length > 0;

      if (!hasStandard && !hasPaid) {
        return NextResponse.json({ error: 'Rodzic nie wybrał żadnych zdjęć' }, { status: 404 });
      }

      const displayName = normalizeDisplayName(participant.parent_name);
      const zipName = `${normalizeZipFilename(displayName)}-wybrane-zdjecia.zip`;

      const paidPhotoIds = new Set<number>();
      const paidFormatByPhotoId = new Map<number, string>();
      paidOrders.forEach((order) => {
        const format = parsePaidPrintFormat(order.product_ids);
        parsePhotoIds(order.photo_ids).forEach((photoId) => {
          paidPhotoIds.add(photoId);
          if (!paidFormatByPhotoId.has(photoId)) {
            paidFormatByPhotoId.set(photoId, format);
          }
        });
      });

      const paidPhotos = paidPhotoIds.size
        ? await prisma.galleryPhoto.findMany({
            where: {
              id: { in: Array.from(paidPhotoIds) },
              gallery_id: galleryId,
            },
            select: { id: true, file_url: true },
          })
        : [];

      const paidPhotoUrlById = new Map(paidPhotos.map((photo) => [photo.id, photo.file_url]));

      const standardItems = participant.selections.map((selection) => ({
        id: selection.photo.id,
        file_url: selection.photo.file_url,
        source: 'STANDARD' as const,
        format: DEFAULT_STANDARD_PRINT_FORMAT,
      }));

      const paidItems = Array.from(paidPhotoIds)
        .map((id) => ({
          id,
          file_url: paidPhotoUrlById.get(id) || null,
          source: 'PLATNE' as const,
          format: paidFormatByPhotoId.get(id) || '10x15',
        }))
        .filter((item): item is { id: number; file_url: string; source: 'PLATNE'; format: string } => Boolean(item.file_url));

      const mergedItems: Array<{ id: number; file_url: string; source: 'STANDARD' | 'PLATNE'; format: string }> = [];
      const seen = new Set<number>();
      [...standardItems, ...paidItems].forEach((item) => {
        if (seen.has(item.id)) return;
        seen.add(item.id);
        mergedItems.push(item);
      });

      const passthrough = new PassThrough();
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.on('error', (err) => {
        console.error('Archiver error:', err);
        passthrough.end();
      });

      archive.pipe(passthrough);

      (async () => {
        try {
          for (let i = 0; i < mergedItems.length; i++) {
            const item = mergedItems[i];
            try {
              const response = await fetch(item.file_url);
              if (!response.ok) throw new Error(`HTTP ${response.status}`);
              const sourceBuffer = Buffer.from(await response.arrayBuffer());
              const jpgBuffer = await sharp(sourceBuffer)
                .pipelineColorspace('srgb')
                .toColorspace('srgb')
                .withMetadata({ icc: 'srgb' })
                .jpeg({ quality: 95, chromaSubsampling: '4:4:4', mozjpeg: true })
                .toBuffer();

              const idxStr = String(i + 1);
              const name = `${displayName} ${idxStr} [${item.format}] [${item.source}].jpg`;
              archive.append(jpgBuffer, { name });
            } catch (err) {
              console.error(`Failed to add photo ${item.id}:`, err);
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
