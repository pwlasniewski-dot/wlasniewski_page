// API Route: GET /api/admin/galleries/[id]/participants/download-all
// Admin: pobiera jeden ZIP z kompletem zdjęć do druku wszystkich rodziców
// (zarówno wybory standardowe, jak i opłacone dodatkowe).
// Struktura ZIP: folder per rodzic + pliki "Imie Nazwisko N [STANDARD|PLATNE].jpg"

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

function normalizeFolderName(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'klient';
}

function normalizeFilePart(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'Klient';
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async () => {
    try {
      const { id } = await params;
      const galleryId = Number(id);
      const url = new URL(request.url);
      const layout = (url.searchParams.get('layout') || '').toLowerCase();
      const isNphotoFlatLayout = layout === 'nphoto';

      if (isNaN(galleryId)) {
        return NextResponse.json({ error: 'Nieprawidłowe ID galerii' }, { status: 400 });
      }

      const participants = await prisma.galleryParticipant.findMany({
        where: {
          gallery_id: galleryId,
          selections: {
            some: {},
          },
        },
        include: {
          selections: {
            include: {
              photo: { select: { id: true, file_url: true, download_source_url: true } },
            },
            orderBy: { selected_at: 'asc' },
          },
        },
        orderBy: { created_at: 'asc' },
      });

      const participantIds = participants.map((p) => p.id);

      const paidOrders = participantIds.length
        ? await prisma.photoOrder.findMany({
            where: {
              gallery_id: galleryId,
              participant_id: { in: participantIds },
              payment_status: { in: ['paid', 'completed'] },
            },
            select: {
              participant_id: true,
              photo_ids: true,
              product_ids: true,
              created_at: true,
            },
            orderBy: { created_at: 'asc' },
          })
        : [];

      const paidItemsByParticipant = new Map<number, Array<{ id: number; format: string }>>();
      const allPaidPhotoIds = new Set<number>();

      for (const order of paidOrders) {
        if (!order.participant_id) continue;
        const current = paidItemsByParticipant.get(order.participant_id) || [];
        const entries = parsePaidPrintEntries(order.photo_ids, order.product_ids as string | null | undefined);
        entries.forEach((entry) => {
          allPaidPhotoIds.add(entry.photo_id);
          for (let i = 0; i < entry.quantity; i++) {
            current.push({ id: entry.photo_id, format: entry.format });
          }
        });
        paidItemsByParticipant.set(order.participant_id, current);
      }

      const paidPhotos = allPaidPhotoIds.size
        ? await prisma.galleryPhoto.findMany({
            where: {
              id: { in: Array.from(allPaidPhotoIds) },
              gallery_id: galleryId,
            },
            select: { id: true, file_url: true, download_source_url: true },
          })
        : [];
      const paidPhotoUrlById = new Map(
        paidPhotos.map((p) => [p.id, p.download_source_url || p.file_url])
      );

      const hasAnyStandard = participants.some((p) => p.selections.length > 0);
      const hasAnyPaid = paidOrders.length > 0;

      if (!hasAnyStandard && !hasAnyPaid) {
        return NextResponse.json({ error: 'Brak wyborów do pobrania' }, { status: 404 });
      }

      const zipName = isNphotoFlatLayout
        ? `galeria-${galleryId}-nphoto-pelny-rozmiar-${Date.now()}.zip`
        : `galeria-${galleryId}-rodzice-wybory-${Date.now()}.zip`;
      const zipBuffer = await (async () => {
        const passthrough = new PassThrough();
        const archive = archiver('zip', {
          zlib: { level: 9 },
          forceZip64: true,
        });

        const chunks: Buffer[] = [];
        const zipDone = new Promise<Buffer>((resolve, reject) => {
          passthrough.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
          passthrough.on('end', () => resolve(Buffer.concat(chunks)));
          passthrough.on('error', reject);
          archive.on('error', reject);
        });

        archive.pipe(passthrough);

        const usedNames = new Set<string>();
        let appendedFiles = 0;
        const skippedPhotos: string[] = [];

        for (const participant of participants) {
          const displayName = normalizeDisplayName(participant.parent_name || participant.parent_identifier || `Rodzic ${participant.id}`);
          const folderName = `${String(participant.id).padStart(3, '0')}-${normalizeFolderName(displayName)}`;
          const fileNameBase = normalizeFilePart(displayName);

          const standardPhotos = participant.selections.map((sel) => ({
            id: sel.photo.id,
            file_url: sel.photo.download_source_url || sel.photo.file_url,
            source: 'STANDARD' as const,
            format: '15x21',
          }));

          const paidItems = paidItemsByParticipant.get(participant.id) || [];
          const paidPhotosForParticipant = paidItems
            .map((item) => ({ id: item.id, format: item.format, file_url: paidPhotoUrlById.get(item.id) || null }))
            .filter((p): p is { id: number; format: string; file_url: string } => Boolean(p.file_url))
            .map((p) => ({
              ...p,
              source: 'PLATNE' as const,
            }));

          const merged: Array<{ id: number; file_url: string; source: 'STANDARD' | 'PLATNE'; format: string }> = [
            ...standardPhotos,
            ...paidPhotosForParticipant,
          ];

          if (merged.length === 0) {
            continue;
          }

          for (let i = 0; i < merged.length; i++) {
            const item = merged[i];
            try {
              const response = await fetch(item.file_url);
              if (!response.ok) throw new Error(`HTTP ${response.status}`);

              const sourceBuffer = Buffer.from(await response.arrayBuffer());
              const ext = getSafeImageExtension(item.file_url);

              const ordinal = String(i + 1).padStart(3, '0');
              if (isNphotoFlatLayout) {
                const sourcePart = item.source === 'PLATNE' ? 'platne' : 'standard';
                const formatPart = item.format.replace(/[^0-9xX]/g, '').toLowerCase() || 'format';
                const baseName = `${fileNameBase}_${formatPart}_${sourcePart}_${ordinal}`;
                try {
                  const jpgBuffer = await sharp(sourceBuffer)
                    .pipelineColorspace('srgb')
                    .toColorspace('srgb')
                    .withMetadata({ icc: 'srgb' })
                    .jpeg({ quality: 95, chromaSubsampling: '4:4:4', mozjpeg: true })
                    .toBuffer();

                  let uniqueName = `${baseName}.jpg`;
                  let dedupeCounter = 2;
                  while (usedNames.has(uniqueName)) {
                    uniqueName = `${baseName}_${dedupeCounter}.jpg`;
                    dedupeCounter += 1;
                  }
                  usedNames.add(uniqueName);
                  archive.append(jpgBuffer, { name: uniqueName });
                  appendedFiles += 1;
                } catch (jpgErr) {
                  const fallbackExt = ext || 'bin';
                  let uniqueName = `${baseName}.${fallbackExt}`;
                  let dedupeCounter = 2;
                  while (usedNames.has(uniqueName)) {
                    uniqueName = `${baseName}_${dedupeCounter}.${fallbackExt}`;
                    dedupeCounter += 1;
                  }
                  usedNames.add(uniqueName);
                  archive.append(sourceBuffer, { name: uniqueName });
                  appendedFiles += 1;
                  console.warn(`JPG conversion failed for photo ${item.id}; appended original as .${fallbackExt}`, jpgErr);
                }
              } else {
                const photoName = `${displayName} ${i + 1} [${item.format}] [${item.source}].${ext}`;
                archive.append(sourceBuffer, { name: `${folderName}/${photoName}` });
                appendedFiles += 1;
              }
            } catch (err) {
              skippedPhotos.push(`participant=${participant.id}, photo=${item.id}, url=${item.file_url}`);
              console.error(`Failed to add photo ${item.id} for participant ${participant.id}:`, err);
            }
          }
        }

        if (appendedFiles === 0) {
          const details = skippedPhotos.length
            ? skippedPhotos.join('\n')
            : 'Brak plików do dodania (0 pozycji po filtrowaniu).';
          archive.append(
            `ZIP utworzony, ale nie dodano żadnego zdjęcia.\n\nSzczegóły:\n${details}\n`,
            { name: '_ZIP_ERROR_README.txt' }
          );
        }

        await archive.finalize();
        return zipDone;
      })();

      return new NextResponse(zipBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${zipName}"`,
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
        },
      });
    } catch (error) {
      console.error('Admin participants bulk download error:', error);
      return NextResponse.json({ error: 'Błąd generowania ZIP' }, { status: 500 });
    }
  });
}
