// API Route: /api/admin/galleries/[id]/jpg-map
// Panel porządkowania mapy JPG <-> webp dla galerii grupowej.
// GET   - zwraca manifest dopasowania (z Setting) + aktualny stan zmapowania.
// POST  - action: 'map' | 'delete' na wskazanych webp_ids.
//   map    -> ustawia download_source_url = jpg_url (klient pobiera JPG).
//   delete -> usuwa nadmiarowe zdjęcia (ZABLOKOWANE, jeśli rodzic je wybrał).

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

interface ManifestItem {
  webp_id: number;
  order_index: number;
  webp_thumb: string | null;
  webp_full: string | null;
  jpg_name: string;
  jpg_url: string | null;
  dist: number;
  margin: number;
  category: 'correct' | 'disputed' | 'excess';
}

interface Manifest {
  generated_at: string;
  gallery_id: number;
  jpg_dir: string;
  jpg_count: number;
  webp_count: number;
  summary: { correct: number; disputed: number; excess: number };
  all_jpg_urls: Record<string, string>;
  items: ManifestItem[];
}

async function loadManifest(galleryId: number): Promise<Manifest | null> {
  const row = await prisma.setting.findUnique({
    where: { setting_key: `jpg_mapping_${galleryId}` },
    select: { setting_value: true },
  });
  if (!row?.setting_value) return null;
  try {
    return JSON.parse(row.setting_value) as Manifest;
  } catch {
    return null;
  }
}

async function saveManifest(galleryId: number, manifest: Manifest): Promise<void> {
  await prisma.setting.update({
    where: { setting_key: `jpg_mapping_${galleryId}` },
    data: { setting_value: JSON.stringify(manifest) },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async () => {
    const { id } = await params;
    const galleryId = Number(id);
    if (isNaN(galleryId)) {
      return NextResponse.json({ error: 'Nieprawidłowe ID galerii' }, { status: 400 });
    }

    const manifest = await loadManifest(galleryId);
    if (!manifest) {
      return NextResponse.json(
        { error: `Brak mapy dla galerii ${galleryId}. Uruchom skrypt upload_jpg_sources.mjs.` },
        { status: 404 }
      );
    }

    // Aktualny stan: które webp mają już ustawiony download_source_url + czy są wybrane.
    const ids = manifest.items.map((i) => i.webp_id);
    const [photos, selections] = await Promise.all([
      prisma.galleryPhoto.findMany({
        where: { id: { in: ids } },
        select: { id: true, download_source_url: true },
      }),
      prisma.photoSelection.groupBy({
        by: ['photo_id'],
        where: { photo_id: { in: ids } },
        _count: { photo_id: true },
      }),
    ]);
    const mappedById = new Map(photos.map((p) => [p.id, p.download_source_url]));
    const selectedById = new Map(selections.map((s) => [s.photo_id, s._count.photo_id]));

    const items = manifest.items.map((it) => ({
      ...it,
      mapped: Boolean(mappedById.get(it.webp_id)),
      current_source: mappedById.get(it.webp_id) || null,
      selected_count: selectedById.get(it.webp_id) || 0,
    }));

    return NextResponse.json({
      success: true,
      gallery_id: galleryId,
      generated_at: manifest.generated_at,
      summary: manifest.summary,
      jpg_count: manifest.jpg_count,
      webp_count: manifest.webp_count,
      items,
    });
  });
}

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

    const body = await request.json().catch(() => ({}));
    const action = body?.action as string;
    const webpIds = Array.isArray(body?.webp_ids)
      ? body.webp_ids.map((n: unknown) => Number(n)).filter((n: number) => Number.isInteger(n) && n > 0)
      : [];

    if (!['map', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'Nieznana akcja' }, { status: 400 });
    }
    if (webpIds.length === 0) {
      return NextResponse.json({ error: 'Brak webp_ids' }, { status: 400 });
    }

    const manifest = await loadManifest(galleryId);
    if (!manifest) {
      return NextResponse.json({ error: 'Brak mapy dla galerii' }, { status: 404 });
    }
    const itemById = new Map(manifest.items.map((i) => [i.webp_id, i]));

    // Bezpieczeństwo: tylko webp należące do tej galerii.
    const galleryPhotoIds = new Set(
      (await prisma.galleryPhoto.findMany({
        where: { id: { in: webpIds }, gallery_id: galleryId },
        select: { id: true },
      })).map((p) => p.id)
    );
    const validIds = webpIds.filter((wid: number) => galleryPhotoIds.has(wid));
    if (validIds.length === 0) {
      return NextResponse.json({ error: 'Żadne ID nie należy do tej galerii' }, { status: 400 });
    }

    if (action === 'map') {
      let mapped = 0;
      const skipped: number[] = [];
      for (const wid of validIds) {
        const item = itemById.get(wid);
        if (!item?.jpg_url) { skipped.push(wid); continue; }
        await prisma.galleryPhoto.update({
          where: { id: wid },
          data: { download_source_url: item.jpg_url },
        });
        mapped += 1;
      }
      return NextResponse.json({ success: true, action: 'map', mapped, skipped });
    }

    // action === 'delete'
    // ZABEZPIECZENIE: nie kasuj zdjęć wybranych przez rodzica.
    const selected = await prisma.photoSelection.findMany({
      where: { photo_id: { in: validIds } },
      select: { photo_id: true },
    });
    const selectedIds = Array.from(new Set(selected.map((s) => s.photo_id)));
    if (selectedIds.length > 0) {
      return NextResponse.json(
        {
          error: 'Odmowa: część zdjęć jest wybrana przez rodziców i nie może zostać usunięta.',
          blocked_selected: selectedIds,
        },
        { status: 409 }
      );
    }

    const result = await prisma.galleryPhoto.deleteMany({
      where: { id: { in: validIds }, gallery_id: galleryId },
    });

    // Usuń z manifestu i zapisz.
    manifest.items = manifest.items.filter((i) => !validIds.includes(i.webp_id));
    manifest.summary = {
      correct: manifest.items.filter((i) => i.category === 'correct').length,
      disputed: manifest.items.filter((i) => i.category === 'disputed').length,
      excess: manifest.items.filter((i) => i.category === 'excess').length,
    };
    await saveManifest(galleryId, manifest);

    return NextResponse.json({ success: true, action: 'delete', deleted: result.count });
  });
}
