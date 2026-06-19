// API Route: GET /api/admin/galleries/[id]/participants/[participantId]/download/[photoId]?index=N
// Admin: pobiera pojedyncze zdjęcie wybrane przez rodzica w pełnej rozdzielczości
// Nazwa pliku: {IDENTIFIKATOR}_{Imie-Nazwisko}_{NN}.jpg

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

function normalizeDisplayName(input: string | null | undefined): string {
  const safe = (input || 'Klient')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return safe || 'Klient';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string; photoId: string }> }
) {
  return withAuth(request, async () => {
    try {
      const { id, participantId, photoId } = await params;
      const galleryId = Number(id);
      const pId = Number(participantId);
      const phId = Number(photoId);
      const url = new URL(request.url);
      const indexParam = url.searchParams.get('index');
      const index = indexParam ? Number(indexParam) : null;

      if (isNaN(galleryId) || isNaN(pId) || isNaN(phId)) {
        return NextResponse.json({ error: 'Nieprawidłowe ID' }, { status: 400 });
      }

      const participant = await prisma.galleryParticipant.findFirst({
        where: { id: pId, gallery_id: galleryId },
        select: { parent_identifier: true, parent_name: true },
      });

      if (!participant) {
        return NextResponse.json({ error: 'Uczestnik nie istnieje' }, { status: 404 });
      }

      const photo = await prisma.galleryPhoto.findFirst({
        where: { id: phId, gallery_id: galleryId },
        select: { id: true, file_url: true },
      });

      if (!photo) {
        return NextResponse.json({ error: 'Zdjęcie nie istnieje' }, { status: 404 });
      }

      const s3Response = await fetch(photo.file_url);
      if (!s3Response.ok) {
        return NextResponse.json({ error: 'Nie udało się pobrać pliku' }, { status: 502 });
      }

      const sourceBuffer = Buffer.from(await s3Response.arrayBuffer());
      const jpgBuffer = await sharp(sourceBuffer)
        .pipelineColorspace('srgb')
        .toColorspace('srgb')
        .withMetadata({ icc: 'srgb' })
        .jpeg({ quality: 95, chromaSubsampling: '4:4:4', mozjpeg: true })
        .toBuffer();

      const displayName = normalizeDisplayName(participant.parent_name);
      const idxPart = index !== null && !isNaN(index)
        ? String(index)
        : String(phId);
      const filename = `${displayName} ${idxPart}.jpg`;

      return new NextResponse(jpgBuffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': String(jpgBuffer.length),
          'Cache-Control': 'no-cache',
        },
      });
    } catch (error) {
      console.error('Admin participant download photo error:', error);
      return NextResponse.json({ error: 'Błąd pobierania zdjęcia' }, { status: 500 });
    }
  });
}
