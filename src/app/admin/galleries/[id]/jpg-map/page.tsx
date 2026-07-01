'use client';

import React, { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface MapItem {
  webp_id: number;
  order_index: number;
  webp_thumb: string | null;
  webp_full: string | null;
  jpg_name: string;
  jpg_url: string | null;
  dist: number;
  margin: number;
  category: 'correct' | 'disputed' | 'excess';
  mapped: boolean;
  current_source: string | null;
  selected_count: number;
}

interface MapData {
  gallery_id: number;
  generated_at: string;
  summary: { correct: number; disputed: number; excess: number };
  jpg_count: number;
  webp_count: number;
  items: MapItem[];
}

const CATEGORY_LABEL: Record<string, string> = {
  correct: 'Prawidłowe',
  disputed: 'Sporne',
  excess: 'Nadmiarowe',
};

const CATEGORY_COLOR: Record<string, string> = {
  correct: 'text-emerald-400 border-emerald-800',
  disputed: 'text-amber-400 border-amber-800',
  excess: 'text-rose-400 border-rose-800',
};

export default function JpgMapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const galleryId = Number(id);
  const router = useRouter();

  const [data, setData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const authHeaders = useCallback((): HeadersInit => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/galleries/${galleryId}/jpg-map`, {
        headers: authHeaders(),
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Błąd pobierania mapy');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Błąd');
    } finally {
      setLoading(false);
    }
  }, [galleryId, authHeaders]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = useCallback(
    async (action: 'map' | 'delete', webpIds: number[]) => {
      if (webpIds.length === 0) return;
      if (action === 'delete') {
        const ok = window.confirm(`Usunąć ${webpIds.length} zdjęć z galerii? Tej operacji nie można cofnąć.`);
        if (!ok) return;
      }
      setBusy(true);
      setMsg(null);
      try {
        const res = await fetch(`/api/admin/galleries/${galleryId}/jpg-map`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ action, webp_ids: webpIds }),
        });
        const json = await res.json();
        if (!res.ok) {
          if (json.blocked_selected) {
            throw new Error(
              `Zablokowano: ${json.blocked_selected.length} zdjęć jest wybranych przez rodziców (ID: ${json.blocked_selected.join(', ')}).`
            );
          }
          throw new Error(json.error || 'Błąd operacji');
        }
        if (action === 'map') setMsg(`Zmapowano: ${json.mapped}, pominięto: ${json.skipped?.length || 0}.`);
        else setMsg(`Usunięto: ${json.deleted}.`);
        await load();
      } catch (e) {
        setMsg(e instanceof Error ? e.message : 'Błąd');
      } finally {
        setBusy(false);
      }
    },
    [galleryId, authHeaders, load]
  );

  const idsByCategory = (cat: string) => (data?.items || []).filter((i) => i.category === cat).map((i) => i.webp_id);
  const unmappedIdsByCategory = (cat: string) =>
    (data?.items || []).filter((i) => i.category === cat && !i.mapped && i.jpg_url).map((i) => i.webp_id);

  const uploadJpg = useCallback(
    async (webpId: number, file: File) => {
      setBusy(true);
      setMsg(null);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        const fd = new FormData();
        fd.append('webp_id', String(webpId));
        fd.append('file', file);
        const res = await fetch(`/api/admin/galleries/${galleryId}/jpg-map/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Błąd wysyłki pliku');
        setMsg(`Wgrano własny JPG dla zdjęcia #${webpId}.`);
        await load();
      } catch (e) {
        setMsg(e instanceof Error ? e.message : 'Błąd');
      } finally {
        setBusy(false);
      }
    },
    [galleryId, load]
  );

  const renderItem = (it: MapItem) => (
    <div key={it.webp_id} className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
      <div className="w-10 shrink-0 text-center text-xs text-zinc-500">#{it.order_index}</div>
      <div className="flex items-center gap-3">
        <div className="text-center">
          {it.webp_thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <a href={it.webp_full || it.webp_thumb} target="_blank" rel="noreferrer">
              <img src={it.webp_thumb} alt="webp" className="h-48 w-48 cursor-zoom-in rounded object-cover transition hover:ring-2 hover:ring-emerald-500" />
            </a>
          ) : (
            <div className="h-48 w-48 rounded bg-zinc-800" />
          )}
          <div className="mt-1 text-[11px] text-zinc-500">webp #{it.webp_id}</div>
        </div>
        <div className="text-2xl text-zinc-600">→</div>
        <div className="text-center">
          {it.jpg_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <a href={it.jpg_url} target="_blank" rel="noreferrer">
              <img src={it.jpg_url} alt="jpg" className="h-48 w-48 cursor-zoom-in rounded object-cover transition hover:ring-2 hover:ring-emerald-500" />
            </a>
          ) : (
            <div className="h-48 w-48 rounded bg-zinc-800" />
          )}
          <div className="mt-1 max-w-[192px] truncate text-[11px] text-zinc-500" title={it.jpg_name}>
            {it.jpg_name}
          </div>
        </div>
      </div>
      <div className="flex-1 text-xs text-zinc-400">
        <div>
          dyst. <span className="text-zinc-200">{it.dist}</span> · margines{' '}
          <span className="text-zinc-200">{it.margin}</span>
        </div>
        {it.selected_count > 0 && (
          <div className="mt-1 inline-block rounded bg-sky-900/60 px-1.5 py-0.5 text-[10px] text-sky-300">
            wybrane przez rodzica ×{it.selected_count}
          </div>
        )}
        {it.mapped && (
          <div className="mt-1 inline-block rounded bg-emerald-900/60 px-1.5 py-0.5 text-[10px] text-emerald-300">
            ✓ zmapowane na JPG
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-col gap-1">
        {it.jpg_url && !it.mapped && (
          <button
            onClick={() => runAction('map', [it.webp_id])}
            disabled={busy}
            className="rounded bg-emerald-700 px-2 py-1 text-xs text-white hover:bg-emerald-600 disabled:opacity-40"
          >
            Zmapuj
          </button>
        )}
        <label
          className={`cursor-pointer rounded bg-sky-700 px-2 py-1 text-center text-xs text-white hover:bg-sky-600 ${busy ? 'pointer-events-none opacity-40' : ''}`}
        >
          Wgraj własny JPG
          <input
            type="file"
            accept="image/jpeg,.jpg,.jpeg"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadJpg(it.webp_id, f);
              e.target.value = '';
            }}
          />
        </label>
        {it.category === 'excess' && (
          <button
            onClick={() => runAction('delete', [it.webp_id])}
            disabled={busy || it.selected_count > 0}
            title={it.selected_count > 0 ? 'Nie można usunąć — wybrane przez rodzica' : ''}
            className="rounded bg-rose-800 px-2 py-1 text-xs text-white hover:bg-rose-700 disabled:opacity-40"
          >
            Usuń
          </button>
        )}
      </div>
    </div>
  );

  const renderSection = (cat: 'correct' | 'disputed' | 'excess') => {
    const items = (data?.items || []).filter((i) => i.category === cat);
    if (items.length === 0) return null;
    return (
      <section className="mb-8">
        <div className={`mb-3 flex items-center justify-between border-b pb-2 ${CATEGORY_COLOR[cat]}`}>
          <h2 className="text-lg font-semibold">
            {CATEGORY_LABEL[cat]} <span className="text-zinc-500">({items.length})</span>
          </h2>
          <div className="flex gap-2">
            {cat !== 'excess' && (
              <button
                onClick={() => runAction('map', unmappedIdsByCategory(cat))}
                disabled={busy || unmappedIdsByCategory(cat).length === 0}
                className="rounded bg-emerald-700 px-3 py-1.5 text-sm text-white hover:bg-emerald-600 disabled:opacity-40"
              >
                Zmapuj wszystkie ({unmappedIdsByCategory(cat).length})
              </button>
            )}
            {cat === 'excess' && (
              <button
                onClick={() => runAction('delete', idsByCategory(cat))}
                disabled={busy || idsByCategory(cat).length === 0}
                className="rounded bg-rose-800 px-3 py-1.5 text-sm text-white hover:bg-rose-700 disabled:opacity-40"
              >
                Usuń wszystkie nadmiarowe ({idsByCategory(cat).length})
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3">{items.map(renderItem)}</div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button onClick={() => router.back()} className="mb-2 text-sm text-zinc-400 hover:text-white">
              ← Wróć
            </button>
            <h1 className="text-2xl font-bold">Porządkowanie JPG — galeria #{galleryId}</h1>
            {data && (
              <p className="mt-1 text-sm text-zinc-400">
                webp: {data.webp_count} · JPG: {data.jpg_count} · mapa z{' '}
                {new Date(data.generated_at).toLocaleString('pl-PL')}
              </p>
            )}
          </div>
          <button
            onClick={load}
            disabled={busy || loading}
            className="rounded bg-zinc-800 px-3 py-1.5 text-sm hover:bg-zinc-700 disabled:opacity-40"
          >
            Odśwież
          </button>
        </div>

        {data && (
          <div className="mb-6 flex gap-4 text-sm">
            <span className="rounded border border-emerald-800 px-3 py-1 text-emerald-400">
              Prawidłowe: {data.summary.correct}
            </span>
            <span className="rounded border border-amber-800 px-3 py-1 text-amber-400">
              Sporne: {data.summary.disputed}
            </span>
            <span className="rounded border border-rose-800 px-3 py-1 text-rose-400">
              Nadmiarowe: {data.summary.excess}
            </span>
          </div>
        )}

        {msg && <div className="mb-4 rounded bg-zinc-800 px-4 py-2 text-sm text-zinc-200">{msg}</div>}
        {loading && <div className="text-zinc-400">Ładowanie...</div>}
        {error && (
          <div className="rounded border border-rose-800 bg-rose-950/40 px-4 py-3 text-rose-300">{error}</div>
        )}

        {data && (
          <>
            {renderSection('disputed')}
            {renderSection('excess')}
            {renderSection('correct')}
          </>
        )}
      </div>
    </div>
  );
}
