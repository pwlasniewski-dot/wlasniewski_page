import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { extractTokenFromHeader, verifyParentToken } from '@/lib/auth/parent-jwt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> },
) {
  const galleryId = Number((await params).galleryId);
  if (!Number.isInteger(galleryId)) {
    return NextResponse.json({ error: 'Nieprawidłowe ID galerii' }, { status: 400 });
  }

  const token = extractTokenFromHeader(request.headers.get('authorization'));
  const payload = token ? await verifyParentToken(token) : null;
  if (!payload) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
  if (payload.gallery_id !== galleryId || payload.participant_id <= 0) {
    return NextResponse.json({ error: 'Brak dostępu' }, { status: 403 });
  }

  const [participant, gallery] = await Promise.all([
    prisma.galleryParticipant.findFirst({
      where: { id: payload.participant_id, gallery_id: galleryId },
      select: { id: true },
    }),
    prisma.clientGallery.findFirst({
      where: { id: galleryId, gallery_mode: 'GROUP', is_active: true },
      select: { id: true, expires_at: true, external_download_url: true },
    }),
  ]);

  if (!participant || !gallery || (gallery.expires_at && gallery.expires_at < new Date())) {
    return NextResponse.json({ error: 'Galeria niedostępna' }, { status: 403 });
  }
  if (!gallery.external_download_url) {
    return NextResponse.json({ error: 'Brak zewnętrznego linku pobierania' }, { status: 404 });
  }

  let destinationHost: string;
  try {
    const destination = new URL(gallery.external_download_url);
    if (!['https:', 'http:'].includes(destination.protocol)) throw new Error('Unsupported protocol');
    destinationHost = destination.host;
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowy zewnętrzny link pobierania' }, { status: 409 });
  }

  await prisma.groupGalleryActivity.create({
    data: {
      gallery_id: galleryId,
      participant_id: participant.id,
      action: 'DOWNLOAD_EXTERNAL_LINK_ISSUED',
      result: 'SUCCESS',
      correlation_id: randomUUID(),
      details: { provider_host: destinationHost },
    },
  });

  // Celowo nie nazywamy tego „pobraniem”. Serwer potwierdza tylko wydanie
  // uwierzytelnionemu rodzicowi linku do zewnętrznego dostawcy.
  return NextResponse.json({ issued: true });
}
