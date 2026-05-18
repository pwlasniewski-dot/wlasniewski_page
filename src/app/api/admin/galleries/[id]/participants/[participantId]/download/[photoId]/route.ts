// API Route: GET /api/admin/galleries/[id]/participants/[participantId]/download/[photoId]?index=N
// Admin: pobiera pojedyncze zdjęcie wybrane przez rodzica w pełnej rozdzielczości
// Nazwa pliku: {IDENTIFIKATOR}_{Imie-Nazwisko}_{NN}.jpg

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

function sanitize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
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
      if (!s3Response.ok || !s3Response.body) {
        return NextResponse.json({ error: 'Nie udało się pobrać pliku' }, { status: 502 });
      }

      const ext = (photo.file_url.split('.').pop() || 'jpg').split('?')[0].toLowerCase();
      const idPart = sanitize(participant.parent_identifier || `id-${pId}`);
      const namePart = sanitize(participant.parent_name || 'rodzic');
      const idxPart = index !== null && !isNaN(index)
        ? String(index).padStart(2, '0')
        : `photo-${phId}`;
      const filename = `${idPart}_${namePart}_${idxPart}.${ext}`;

      return new Response(s3Response.body, {
        headers: {
          'Content-Type': s3Response.headers.get('Content-Type') || 'image/jpeg',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache',
        },
      });
    } catch (error) {
      console.error('Admin participant download photo error:', error);
      return NextResponse.json({ error: 'Błąd pobierania zdjęcia' }, { status: 500 });
    }
  });
}
