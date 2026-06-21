// API Route: GET /api/admin/galleries/[id]/participants/download-all
// Admin: pobiera jeden ZIP z wybranymi zdjęciami wszystkich rodziców.
// Struktura ZIP: folder per rodzic + pliki "Imie Nazwisko N.jpg"

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import archiver from 'archiver';
import { PassThrough } from 'stream';
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
              photo: { select: { id: true, file_url: true } },
            },
            orderBy: { selected_at: 'asc' },
          },
        },
        orderBy: { created_at: 'asc' },
      });

      if (participants.length === 0) {
        return NextResponse.json({ error: 'Brak wyborów do pobrania' }, { status: 404 });
      }

      const zipName = isNphotoFlatLayout
        ? `galeria-${galleryId}-nphoto-pelny-rozmiar.zip`
        : `galeria-${galleryId}-rodzice-wybory.zip`;
      const passthrough = new PassThrough();
      const archive = archiver('zip', {
        zlib: { level: 9 },
        forceZip64: true,
      });

      archive.on('error', (err) => {
        console.error('Archiver error:', err);
        passthrough.end();
      });

      archive.pipe(passthrough);

      (async () => {
        try {
          const usedNames = new Set<string>();

          for (const participant of participants) {
            const displayName = normalizeDisplayName(participant.parent_name || participant.parent_identifier || `Rodzic ${participant.id}`);
            const folderName = `${String(participant.id).padStart(3, '0')}-${normalizeFolderName(displayName)}`;
            const fileNameBase = normalizeFilePart(displayName);

            for (let i = 0; i < participant.selections.length; i++) {
              const sel = participant.selections[i];
              try {
                const response = await fetch(sel.photo.file_url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const sourceBuffer = Buffer.from(await response.arrayBuffer());
                const ext = getSafeImageExtension(sel.photo.file_url);

                const ordinal = String(i + 1).padStart(3, '0');
                if (isNphotoFlatLayout) {
                  const baseName = `${fileNameBase}_${ordinal}`;
                  let uniqueName = `${baseName}.${ext}`;
                  let dedupeCounter = 2;
                  while (usedNames.has(uniqueName)) {
                    uniqueName = `${baseName}_${dedupeCounter}.${ext}`;
                    dedupeCounter += 1;
                  }
                  usedNames.add(uniqueName);
                  archive.append(sourceBuffer, { name: uniqueName });
                } else {
                  const photoName = `${displayName} ${i + 1}.${ext}`;
                  archive.append(sourceBuffer, { name: `${folderName}/${photoName}` });
                }
              } catch (err) {
                console.error(`Failed to add photo ${sel.photo.id} for participant ${participant.id}:`, err);
              }
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
      console.error('Admin participants bulk download error:', error);
      return NextResponse.json({ error: 'Błąd generowania ZIP' }, { status: 500 });
    }
  });
}
