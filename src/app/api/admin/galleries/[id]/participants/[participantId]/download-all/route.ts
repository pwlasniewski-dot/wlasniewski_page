// API Route: GET /api/admin/galleries/[id]/participants/[participantId]/download-all
// Admin: pobiera ZIP z wszystkimi zdjęciami do druku rodzica (standard + opłacone dodatkowe)
// Nazwy plików w archiwum: {Imie-Nazwisko} {NN} [{FORMAT}] [{STANDARD|PLATNE}].jpg

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import sharp from 'sharp';
import { withAuthWithQueryToken } from '@/lib/auth/middleware';
import { deleteFromS3, uploadStreamToS3 } from '@/lib/storage/s3';

export const maxDuration = 60; // seconds — Netlify Pro

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

function parsePaidPrintEntries(photoIdsRaw: string | null | undefined, productIdsRaw: string | null | undefined): Array<{ photo_id: number; format: string; quantity: number }> {
  const fallbackPhotoIds = parsePhotoIds(photoIdsRaw);

  if (productIdsRaw) {
    try {
      const parsed = JSON.parse(productIdsRaw) as Record<string, unknown>;
      if (parsed && parsed.kind === 'group_extra_prints') {
        const rawLines = Array.isArray(parsed.lines) ? parsed.lines : [];
        const lines = rawLines
          .map((line) => {
            const item = line as Record<string, unknown>;
            const photo_id = Number(item.photo_id);
            const print_size = typeof item.print_size === 'string' ? item.print_size : null;
            const quantity = Number(item.quantity);
            if (!Number.isInteger(photo_id) || photo_id <= 0) return null;
            if (!print_size) return null;
            if (!Number.isInteger(quantity) || quantity <= 0) return null;
            return { photo_id, format: print_size, quantity };
          })
          .filter((line): line is { photo_id: number; format: string; quantity: number } => Boolean(line));

        if (lines.length > 0) return lines;

        if (typeof parsed.print_size === 'string' && fallbackPhotoIds.length > 0) {
          const byPhoto = new Map<number, number>();
          fallbackPhotoIds.forEach((photoId) => byPhoto.set(photoId, (byPhoto.get(photoId) || 0) + 1));
          return Array.from(byPhoto.entries()).map(([photo_id, quantity]) => ({
            photo_id,
            format: parsed.print_size as string,
            quantity,
          }));
        }
      }
    } catch {
      // ignore invalid payload
    }
  }

  if (fallbackPhotoIds.length === 0) return [];
  const byPhoto = new Map<number, number>();
  fallbackPhotoIds.forEach((photoId) => byPhoto.set(photoId, (byPhoto.get(photoId) || 0) + 1));
  return Array.from(byPhoto.entries()).map(([photo_id, quantity]) => ({
    photo_id,
    format: '10x15',
    quantity,
  }));
}

function normalizeDisplayName(input: string | null | undefined): string {
  const safe = (input || 'Klient')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return safe || 'Klient';
}

function getSafeImageExtension(fileUrl: string): string {
  try {
    const cleanUrl = fileUrl.split('?')[0] || '';
    const ext = (cleanUrl.split('.').pop() || '').toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg') return 'jpg';
    if (ext === 'png') return 'png';
    if (ext === 'webp') return 'webp';
    if (ext === 'tif' || ext === 'tiff') return 'tif';
    if (ext === 'heic') return 'heic';
    return 'jpg';
  } catch {
    return 'jpg';
  }
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
  return withAuthWithQueryToken(request, async () => {
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
              photo: { select: { id: true, file_url: true, download_source_url: true } },
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
      if (participant.selection_status !== 'SUBMITTED' && participant.selections.length > 0) {
        const canAdminConfirm = ['DRAFT', 'LEGACY_REVIEW_REQUIRED'].includes(participant.selection_status);
        return NextResponse.json(
          {
            error: 'Wybór rodzica nie jest zatwierdzonym manifestem i nie może trafić do druku.',
            selection_status: participant.selection_status,
            selection_version: participant.selection_version,
            selections_count: participant.selections.length,
            max_selections: participant.max_selections,
            can_admin_confirm_selection: canAdminConfirm,
            gallery_id: galleryId,
            participant_id: participant.id,
          },
          { status: 409 },
        );
      }

      const hasStandard = participant.selections.length > 0;
      const hasPaid = paidOrders.length > 0;

      if (!hasStandard && !hasPaid) {
        return NextResponse.json({ error: 'Rodzic nie wybrał żadnych zdjęć' }, { status: 404 });
      }

      const displayName = normalizeDisplayName(participant.parent_name);
      const zipName = `${normalizeZipFilename(displayName)}-wybrane-zdjecia.zip`;

      const paidItems: Array<{ id: number; format: string }> = [];
      paidOrders.forEach((order) => {
        const entries = parsePaidPrintEntries(order.photo_ids, order.product_ids);
        entries.forEach((entry) => {
          for (let i = 0; i < entry.quantity; i++) {
            paidItems.push({ id: entry.photo_id, format: entry.format });
          }
        });
      });

      const paidPhotoIds = Array.from(new Set(paidItems.map((item) => item.id)));

      const paidPhotos = paidPhotoIds.length
        ? await prisma.galleryPhoto.findMany({
            where: {
              id: { in: paidPhotoIds },
              gallery_id: galleryId,
            },
            select: { id: true, file_url: true, download_source_url: true },
          })
        : [];

      const paidPhotoUrlById = new Map(
        paidPhotos.map((photo) => [photo.id, photo.download_source_url])
      );

      const missingHqIds = new Set<number>();
      participant.selections.forEach(selection => {
        if (!selection.photo.download_source_url) missingHqIds.add(selection.photo.id);
      });
      paidPhotoIds.forEach(photoId => {
        if (!paidPhotoUrlById.get(photoId)) missingHqIds.add(photoId);
      });
      if (missingHqIds.size > 0) {
        return NextResponse.json({
          error: `Eksport zablokowany: ${missingHqIds.size} zdjęć nie ma zweryfikowanego JPG HQ.`,
          missing_hq_photo_ids: [...missingHqIds],
        }, { status: 409 });
      }

      const standardItems = participant.selections.map((selection) => ({
        id: selection.photo.id,
        file_url: selection.photo.download_source_url!,
        source: 'STANDARD' as const,
        format: DEFAULT_STANDARD_PRINT_FORMAT,
      }));

      const paidPrintItems = paidItems
        .map((item) => ({
          id: item.id,
          file_url: paidPhotoUrlById.get(item.id)!,
          source: 'PLATNE' as const,
          format: item.format || '10x15',
        }));

      const mergedItems: Array<{ id: number; file_url: string; source: 'STANDARD' | 'PLATNE'; format: string }> = [
        ...standardItems,
        ...paidPrintItems,
      ];

      const s3Key = `temp-zips/admin-participant-${galleryId}-${pId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${zipName}`;
      const archive = archiver('zip', { store: true, forceZip64: true });
      archive.on('warning', (err) => console.warn('archiver warning:', err));
      archive.on('error', (err) => console.error('Archiver error:', err));

      const passthrough = new PassThrough();
      archive.pipe(passthrough);
      const uploadPromise = uploadStreamToS3(
        passthrough,
        s3Key,
        'application/zip',
        `attachment; filename="${zipName}"`,
      );

      let appended = 0;
      let skipped = 0;
      for (let i = 0; i < mergedItems.length; i++) {
        const item = mergedItems[i];
        try {
          const response = await fetch(item.file_url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const sourceBuffer = Buffer.from(await response.arrayBuffer());
          const ext = getSafeImageExtension(item.file_url);
          const idxStr = String(i + 1);

          if (ext === 'jpg') {
            const name = `${displayName} ${idxStr} [${item.format}] [${item.source}].jpg`;
            archive.append(sourceBuffer, { name });
            appended += 1;
          } else {
            try {
              const jpgBuffer = await sharp(sourceBuffer)
                .pipelineColorspace('srgb')
                .toColorspace('srgb')
                .withMetadata({ icc: 'srgb' })
                .jpeg({ quality: 95, chromaSubsampling: '4:4:4', mozjpeg: true })
                .toBuffer();

              const name = `${displayName} ${idxStr} [${item.format}] [${item.source}].jpg`;
              archive.append(jpgBuffer, { name });
              appended += 1;
            } catch (jpgErr) {
              const name = `${displayName} ${idxStr} [${item.format}] [${item.source}].${ext}`;
              archive.append(sourceBuffer, { name });
              appended += 1;
              console.warn(`JPG conversion failed for photo ${item.id}; appended original as .${ext}`, jpgErr);
            }
          }
        } catch (err) {
          skipped += 1;
          console.error(`Failed to add photo ${item.id}:`, err);
        }
      }

      await archive.finalize();
      const downloadUrl = await uploadPromise;

      if (skipped > 0 || appended !== mergedItems.length) {
        await deleteFromS3(s3Key).catch(() => false);
        return NextResponse.json(
          { error: `Eksport przerwany: nie udało się bezbłędnie przygotować ${skipped} plików.` },
          { status: 502 },
        );
      }

      return NextResponse.json({
        success: true,
        downloadUrl,
        fileName: zipName,
        photoCount: appended,
        skippedCount: skipped,
      });
    } catch (error) {
      console.error('Admin participant download-all error:', error);
      return NextResponse.json({ error: 'Błąd generowania ZIP' }, { status: 500 });
    }
  });
}
