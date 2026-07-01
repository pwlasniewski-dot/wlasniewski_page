// API Route: POST /api/admin/galleries/[id]/jpg-map/upload
// Ręczne dogranie właściwego pliku JPG dla konkretnego zdjęcia (webp),
// gdy automatyczne dopasowanie jest błędne. Plik ląduje na S3 i staje się
// źródłem pobierania (download_source_url) dla tego zdjęcia.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { uploadToS3 } from '@/lib/storage/s3';

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async () => {
    const { id } = await params;
    const galleryId = Number(id);
    if (isNaN(galleryId)) {
      return NextResponse.json({ error: 'Nieprawidłowe ID galerii' }, { status: 400 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: 'Oczekiwano multipart/form-data' }, { status: 400 });
    }

    const webpId = Number(formData.get('webp_id'));
    const file = formData.get('file');

    if (!Number.isInteger(webpId) || webpId <= 0) {
      return NextResponse.json({ error: 'Brak/nieprawidłowe webp_id' }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Brak pliku' }, { status: 400 });
    }

    // Walidacja typu: tylko JPEG.
    const isJpeg =
      file.type === 'image/jpeg' ||
      file.type === 'image/jpg' ||
      /\.jpe?g$/i.test(file.name);
    if (!isJpeg) {
      return NextResponse.json({ error: 'Dozwolone tylko pliki JPG' }, { status: 400 });
    }

    // Limit rozmiaru (30 MB).
    if (file.size > 30 * 1024 * 1024) {
      return NextResponse.json({ error: 'Plik za duży (max 30 MB)' }, { status: 400 });
    }

    // Zdjęcie musi należeć do tej galerii.
    const photo = await prisma.galleryPhoto.findFirst({
      where: { id: webpId, gallery_id: galleryId },
      select: { id: true },
    });
    if (!photo) {
      return NextResponse.json({ error: 'Zdjęcie nie należy do tej galerii' }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60);
    const key = `gallery-jpg-sources/gallery-${galleryId}/manual-${webpId}-${Date.now()}-${safeName}`;

    let url: string;
    try {
      url = await uploadToS3(buffer, key, 'image/jpeg');
    } catch (e) {
      return NextResponse.json(
        { error: `Błąd wysyłki na S3: ${e instanceof Error ? e.message : 'nieznany'}` },
        { status: 500 }
      );
    }

    // Ustaw jako źródło pobierania.
    await prisma.galleryPhoto.update({
      where: { id: webpId },
      data: { download_source_url: url },
    });

    // Zaktualizuj manifest, aby strona pokazywała nowy plik jako zmapowany.
    const row = await prisma.setting.findUnique({
      where: { setting_key: `jpg_mapping_${galleryId}` },
      select: { setting_value: true },
    });
    if (row?.setting_value) {
      try {
        const manifest = JSON.parse(row.setting_value);
        const item = (manifest.items || []).find((i: any) => i.webp_id === webpId);
        if (item) {
          item.jpg_url = url;
          item.jpg_name = safeName;
          item.dist = 0;
          item.margin = 0;
          item.manual = true;
          await prisma.setting.update({
            where: { setting_key: `jpg_mapping_${galleryId}` },
            data: { setting_value: JSON.stringify(manifest) },
          });
        }
      } catch {
        // manifest opcjonalny — brak nie blokuje operacji
      }
    }

    return NextResponse.json({ success: true, webp_id: webpId, url });
  });
}
