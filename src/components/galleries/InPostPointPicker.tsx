'use client';

import { useEffect, useId, useRef, useState } from 'react';

type Point = { name: string; address: string; description: string; openingHours: string };
type Props = { value: string; onChange: (code: string) => void };
const field = 'mt-1 min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-base text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300';
const button = 'min-h-11 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-50';

export default function InPostPointPicker({ value, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [points, setPoints] = useState<Point[]>([]);
  const [page, setPage] = useState(1);
  const [lastQuery, setLastQuery] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const searchRequest = useRef<AbortController | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const callback = `inpostGalleryPoint${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/shipping/inpost/config', { signal: controller.signal }).then(response => response.json()).then(config => {
      if (typeof config.token === 'string' && config.token) setToken(config.token);
    }).catch(() => { /* The point search remains available without the map. */ });
    return () => { controller.abort(); searchRequest.current?.abort(); };
  }, []);

  useEffect(() => {
    if (!mapOpen || !token || !mapContainer.current) return;
    const container = mapContainer.current;
    const globalCallbacks = window as unknown as Record<string, unknown>;
    globalCallbacks[callback] = (point: { name?: string; address?: { line1?: string; line2?: string } }) => {
      if (typeof point?.name !== 'string' || !/^[A-Z0-9_-]{3,30}$/.test(point.name)) return;
      onChangeRef.current(point.name);
      setSelectedPoint({ name: point.name, address: [point.address?.line1, point.address?.line2].filter(Boolean).join(', '), description: '', openingHours: '' });
      setMapOpen(false);
    };
    // Official v5 integration: https://dokumentacja-inpost.atlassian.net/wiki/spaces/PL/pages/50069505
    const widget = document.createElement('inpost-geowidget');
    widget.setAttribute('token', token);
    widget.setAttribute('language', 'pl');
    widget.setAttribute('config', 'parcelCollect');
    widget.setAttribute('onpoint', callback);
    widget.style.cssText = 'display:block;width:100%;height:100%';
    const loaded = () => setMapLoading(false);
    widget.addEventListener('inpost.geowidget.init', loaded);
    container.appendChild(widget);
    setMapLoading(true);
    const failed = () => { setMapLoading(false); setError('Mapa nie jest teraz dostępna. Skorzystaj z wyszukiwarki punktów poniżej.'); };
    let script = document.querySelector<HTMLScriptElement>('script[data-inpost-geowidget]');
    if (!script) {
      const css = document.createElement('link');
      css.rel = 'stylesheet'; css.href = 'https://geowidget.inpost.pl/inpost-geowidget.css';
      document.head.appendChild(css);
      script = document.createElement('script');
      script.src = 'https://geowidget.inpost.pl/inpost-geowidget.js';
      script.async = true; script.dataset.inpostGeowidget = 'true';
      document.head.appendChild(script);
    }
    script.addEventListener('error', failed);
    const timeout = window.setTimeout(failed, 15000);
    widget.addEventListener('inpost.geowidget.init', () => window.clearTimeout(timeout), { once: true });
    return () => { window.clearTimeout(timeout); script?.removeEventListener('error', failed); widget.removeEventListener('inpost.geowidget.init', loaded); widget.remove(); delete globalCallbacks[callback]; };
  }, [mapOpen, token, callback]);

  const search = async (nextPage = 1) => {
    const nextQuery = nextPage === 1 ? query.trim() : lastQuery;
    if (nextQuery.length < 2) { setError('Wpisz przynajmniej 2 znaki.'); return; }
    searchRequest.current?.abort();
    const controller = new AbortController(); searchRequest.current = controller;
    setBusy(true); setError(''); setSearched(false); setPoints([]); setHasMore(false);
    try {
      const response = await fetch(`/api/shipping/inpost/points?q=${encodeURIComponent(nextQuery)}&page=${nextPage}`, { signal: controller.signal });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Nie udało się wyszukać punktów.');
      if (controller.signal.aborted) return;
      setPoints(result.points); setPage(nextPage); setLastQuery(nextQuery); setHasMore(result.hasMore === true); setSearched(true);
    } catch (failure) { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Spróbuj wyszukać punkt ponownie.'); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  };

  return <fieldset className="space-y-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:p-5">
    <legend className="px-2 font-medium">Punkt odbioru InPost</legend>
    {value && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"><strong>Wybrany punkt: {value}</strong>{selectedPoint?.name === value && selectedPoint.address && <p className="mt-1">{selectedPoint.address}</p>}</div>}
    {token && <button type="button" className={button} aria-expanded={mapOpen} onClick={() => { setMapOpen(!mapOpen); setError(''); }}>{mapOpen ? 'Zamknij mapę' : 'Wybierz punkt na mapie'}</button>}
    {mapOpen && <div><p className="mb-2 text-sm text-stone-600" role="status">{mapLoading ? 'Ładowanie mapy InPost…' : 'Wybierz punkt odbioru na mapie.'}</p><div ref={mapContainer} className="h-[min(65vh,520px)] min-h-80 overflow-hidden rounded-xl bg-white" aria-label="Mapa punktów InPost" /></div>}
    <div className="flex flex-wrap items-end gap-2"><label className="min-w-48 flex-1 text-sm">Miejscowość, kod pocztowy lub kod punktu<input className={field} value={query} maxLength={80} placeholder="np. Toruń lub 87-100" onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void search(); } }} /></label><button type="button" className={button} disabled={busy || query.trim().length < 2} onClick={() => void search()}>{busy ? 'Szukam…' : 'Szukaj punktu'}</button></div>
    {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
    {searched && !points.length && <p role="status" className="text-sm text-stone-600">Nie znaleziono dostępnych punktów. Sprawdź pełną nazwę miejscowości lub wyszukaj po kodzie pocztowym.</p>}
    {!!points.length && <ul aria-label="Znalezione punkty InPost" className="max-h-80 space-y-2 overflow-y-auto">{points.map(point => <li key={point.name}><button type="button" aria-pressed={value === point.name} className={`w-full rounded-xl border p-3 text-left text-sm ${value === point.name ? 'border-stone-700 bg-white ring-1 ring-stone-700' : 'border-stone-200 bg-white hover:border-stone-500'}`} onClick={() => { onChange(point.name); setSelectedPoint(point); }}><strong>{point.name}</strong><span className="mt-1 block">{point.address}</span>{point.description && <span className="mt-1 block text-stone-500">{point.description}</span>}{point.openingHours && <span className="mt-1 block text-stone-500">{point.openingHours}</span>}</button></li>)}</ul>}
    {searched && (page > 1 || hasMore) && <div className="flex items-center justify-between gap-2"><button type="button" className={button} disabled={busy || page <= 1} onClick={() => void search(page - 1)}>Poprzednie punkty</button><span className="text-sm">{page}</span><button type="button" className={button} disabled={busy || !hasMore} onClick={() => void search(page + 1)}>Kolejne punkty</button></div>}
    <details className="text-sm text-stone-600"><summary className="min-h-11 cursor-pointer py-3">Znasz kod swojego punktu?</summary><label>Kod Paczkomatu<input aria-label="Kod Paczkomatu" className={field} value={value} maxLength={30} placeholder="np. TOR01M" autoCapitalize="characters" onChange={event => { onChange(event.target.value.toUpperCase().replace(/\s/g, '')); setSelectedPoint(null); }} /></label></details>
  </fieldset>;
}
