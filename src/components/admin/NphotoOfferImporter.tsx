'use client';

import { useEffect, useState } from 'react';
import GalleryProductPreview from '@/components/galleries/GalleryProductPreview';
import { nphotoOfferDescription, type NphotoOfferDraft } from '@/lib/nphoto/offer-import';

type OfferDraft = NphotoOfferDraft;
type Props = { disabled?: boolean; onImported: () => Promise<void>; onDirtyChange?: (dirty: boolean) => void; onBusyChange?: (busy: boolean) => void };
const input = 'mt-2 min-h-12 w-full min-w-0 rounded-xl border border-white/15 bg-zinc-950 px-3.5 py-3 text-base text-white focus:border-amber-200/60 focus:outline-none focus:ring-2 focus:ring-amber-200/20';
const secondary = 'min-h-11 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-medium text-zinc-100 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-200 disabled:cursor-not-allowed disabled:opacity-40';
const primary = 'min-h-12 rounded-xl bg-[#ead5ad] px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-[#f4e4c7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:cursor-not-allowed disabled:opacity-40';

export default function NphotoOfferImporter({ disabled = false, onImported, onDirtyChange, onBusyChange }: Props) {
  const [url, setUrl] = useState('');
  const [draft, setDraft] = useState<OfferDraft | null>(null);
  const [price, setPrice] = useState('');
  const [format, setFormat] = useState('');
  const [pageCount, setPageCount] = useState('');
  const [pageUnit, setPageUnit] = useState<'pages' | 'spreads'>('spreads');
  const [minPhotos, setMinPhotos] = useState('1');
  const [maxPhotos, setMaxPhotos] = useState('50');
  const [mediaConfirmed, setMediaConfirmed] = useState(false);
  const [busy, setBusy] = useState<'analyze' | 'save' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => { onDirtyChange?.(!!draft && !saved); }, [draft, saved, onDirtyChange]);
  const edit = (patch: Partial<OfferDraft>) => { setDraft(current => current ? { ...current, ...patch } : current); setSaved(false); setNotice(''); };
  const lock = disabled || !!busy;
  const amount = price.trim() ? Math.round(Number(price.replace(',', '.')) * 100) : 0;
  const productDescription = draft ? nphotoOfferDescription({ draft, format, pageCount: pageCount ? Number(pageCount) : null, pageUnit, minPhotos: Number(minPhotos), maxPhotos: Number(maxPhotos) }) : '';

  async function request(path: string, body: unknown) {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`/api/admin/gallery-shop/${path}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok || result.success !== true) throw new Error(result.error || 'Nie udało się przetworzyć oferty. Spróbuj ponownie.');
    return result;
  }

  async function analyze() {
    if (lock) return;
    try { const target = new URL(url); if (target.protocol !== 'https:' || !['nphoto.com', 'www.nphoto.com'].includes(target.hostname)) throw new Error(); }
    catch { setError('Wklej pełny adres produktu z https://nphoto.com/.'); return; }
    if (draft && !saved && !window.confirm('Odczytać nowy produkt? Niezapisany szkic zostanie zastąpiony.')) return;
    setBusy('analyze'); onBusyChange?.(true); setError(''); setNotice('');
    try {
      const result = await request('nphoto-preview', { url });
      setDraft(result.draft); setPrice(''); setFormat(''); setPageCount(''); setPageUnit('spreads'); setMinPhotos('1'); setMaxPhotos('50'); setMediaConfirmed(false); setSaved(false);
      setNotice('Odczytano materiały. Sprawdź opis, wybierz zdjęcia i zdefiniuj jeden wariant swojej oferty.');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Nie udało się odczytać produktu.'); }
    finally { setBusy(null); onBusyChange?.(false); }
  }

  async function save() {
    if (!draft || lock || saved) return;
    if (!draft.title.trim() || draft.title.length > 160 || draft.description.length > 4500 || !Number.isSafeInteger(amount) || amount < 0 || amount > 10000000) { setError('Uzupełnij nazwę (do 160 znaków), opis (do 4500 znaków) i poprawną cenę do 100 000 zł. Cenę możesz pozostawić pustą w szkicu.'); return; }
    if (pageCount && (!Number.isSafeInteger(Number(pageCount)) || Number(pageCount) < 1 || Number(pageCount) > 500)) { setError('Podaj całkowitą liczbę stron lub rozkładówek od 1 do 500.'); return; }
    if (![minPhotos, maxPhotos].every(value => /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 500) || Number(maxPhotos) < Number(minPhotos)) { setError('Ustal zakres od 1 do 500 zdjęć. Maksimum nie może być mniejsze od minimum.'); return; }
    if (!mediaConfirmed) { setError('Potwierdź uprawnienie do wykorzystania wybranych tekstów i zdjęć.'); return; }
    setBusy('save'); onBusyChange?.(true); setError(''); setNotice('');
    try {
      const result = await request('nphoto-drafts', { draft, price: amount, pageCount: pageCount ? Number(pageCount) : null, pageUnit, format: format.trim(), minPhotos: Number(minPhotos), maxPhotos: Number(maxPhotos), mediaConfirmed });
      setSaved(true);
      setNotice(result.existing ? `Ten produkt jest już w katalogu (#${result.id}). Zachowano istniejące ceny i treści — edytuj jego kartę poniżej.` : `Zapisano szkic #${result.id}. Nie jest widoczny dla klientów. Sprawdź kartę poniżej, a następnie osobno włącz widoczność.`);
      try { await onImported(); } catch { setError('Szkic zapisano, ale nie udało się odświeżyć katalogu. Odśwież stronę — nie zapisuj ponownie.'); }
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Nie udało się zapisać szkicu.'); }
    finally { setBusy(null); onBusyChange?.(false); }
  }

  return <section aria-label="Pracownia oferty nPhoto" className="space-y-5 rounded-3xl border border-amber-200/20 bg-gradient-to-br from-zinc-900 to-[#191818] p-4 sm:p-7">
    <header className="flex flex-wrap items-start justify-between gap-4"><div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/80">Od produktu do Twojej oferty</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Pracownia oferty nPhoto</h2><p className="mt-3 text-sm leading-relaxed text-zinc-300">Wklej wybrany produkt producenta. Odczytamy dostępne teksty, zdjęcia i parametry do sprawdzenia. Ty ustalasz cenę i gotowy wariant; klient wybiera zdjęcia i liczbę egzemplarzy.</p></div><span className="rounded-full border border-white/15 px-3 py-2 text-xs text-zinc-400">Zawsze najpierw szkic</span></header>
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-400"><span className="text-amber-100">01 · Odczyt produktu</span><span>02 · Twoja oferta i podgląd</span><span>03 · Zapis szkicu</span></div>
    {disabled && !busy && <p className="rounded-xl bg-amber-200/10 p-3 text-sm text-amber-100">Zapisz zmiany ustawień i produktów przed importem. Twój szkic pozostaje zachowany.</p>}
    <form onSubmit={event => { event.preventDefault(); void analyze(); }} className="flex flex-wrap items-end gap-3"><label className="min-w-0 flex-1 basis-72 text-sm text-zinc-200">Adres produktu nPhoto<input className={input} type="url" required placeholder="https://nphoto.com/pl/…" value={url} disabled={lock} onChange={event => setUrl(event.target.value)} /></label><button type="submit" disabled={lock || !url.trim()} className={primary}>{busy === 'analyze' ? 'Odczytywanie produktu…' : 'Odczytaj produkt'}</button></form>
    {error && <p role="alert" className="rounded-xl border border-red-300/20 bg-red-950/40 p-4 text-sm text-red-200">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-emerald-200/20 bg-emerald-950/30 p-4 text-sm text-emerald-200">{notice}</p>}
    {draft && <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5"><a href={draft.sourceUrl} target="_blank" rel="noopener noreferrer" className="min-h-11 py-3 text-sm text-amber-200 underline underline-offset-4">Sprawdź źródło u producenta ↗</a><span className="text-xs text-zinc-400">Odczyt: {new Date(draft.fetchedAt).toLocaleString('pl-PL')}</span></div>
      <details className="rounded-xl border border-white/10 p-4"><summary className="min-h-11 cursor-pointer text-sm font-medium text-zinc-100">Materiały źródłowe i ograniczenia ({draft.specifications.length} parametrów)</summary><p className="mb-3 text-xs leading-relaxed text-zinc-400">To informacje źródłowe, nie automatycznie zatwierdzone opcje sprzedaży. Sprawdź zgodność wybranego formatu, oprawy i liczby stron u producenta.</p>{draft.specifications.length > 0 && <dl className="grid gap-3 sm:grid-cols-2">{draft.specifications.map((spec, index) => <div key={`${spec.label}-${index}`}><dt className="text-xs text-zinc-400">{spec.label}</dt><dd className="mt-1 whitespace-pre-line text-sm text-zinc-200">{spec.value}</dd></div>)}</dl>}{draft.warnings.length > 0 && <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-amber-200">{draft.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>}</details>
      <fieldset disabled={lock || saved} className="min-w-0 space-y-5">
        <legend className="mb-4 text-lg font-semibold text-white">Twoja gotowa wersja produktu</legend>
        <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Nazwa w Twojej ofercie<input className={input} value={draft.title} maxLength={160} onChange={event => edit({ title: event.target.value })} /></label><label className="text-sm">Twoja cena (zł)<input className={input} inputMode="decimal" type="number" min="0" max="100000" step="0.01" placeholder="Ustalisz samodzielnie" value={price} onChange={event => setPrice(event.target.value)} /></label></div>
        <label className="block text-sm">Opis dla klienta<textarea className={input} rows={5} value={draft.description} maxLength={4500} onChange={event => edit({ description: event.target.value })} /></label>
        <div className="grid gap-4 sm:grid-cols-3"><label className="text-sm">Format Twojego wariantu<input className={input} value={format} maxLength={120} placeholder="Wpisz wybrany format" onChange={event => setFormat(event.target.value)} /></label><label className="text-sm">Liczba stron / rozkładówek<input className={input} type="number" min="1" max="500" step="1" value={pageCount} placeholder="Jeśli dotyczy" onChange={event => setPageCount(event.target.value)} /></label><label className="text-sm">Jednostka<select className={input} value={pageUnit} onChange={event => setPageUnit(event.target.value as 'pages' | 'spreads')}><option value="spreads">Rozkładówki (2 strony)</option><option value="pages">Strony</option></select></label></div>
        <p className="text-xs leading-relaxed text-zinc-400">Jedna rozkładówka to dwie sąsiadujące strony. Podana liczba określa Twój wariant — nie oznacza sprawdzenia dostępności produkcji. Jeśli produkt nie ma stron, pozostaw to pole puste.</p>
        <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Minimum zdjęć wybieranych przez klienta<input className={input} type="number" min="1" max="500" step="1" value={minPhotos} onChange={event => setMinPhotos(event.target.value)} /></label><label className="text-sm">Maksimum zdjęć wybieranych przez klienta<input className={input} type="number" min="1" max="500" step="1" value={maxPhotos} onChange={event => setMaxPhotos(event.target.value)} /></label></div>
        <p className="text-xs leading-relaxed text-zinc-400">Liczba zdjęć nie wynika automatycznie z liczby stron. Ustal zakres dla projektu, który przygotujesz.</p>
        <div><h3 className="text-sm font-semibold text-white">Zdjęcia produktu · pierwsze jest okładką oferty</h3><p className="mt-2 text-xs leading-relaxed text-zinc-400">Usuń zdjęcia niepasujące do wybranego wariantu. Pokazujemy fotografie produktu, nie wizualizację gotowego projektu ze zdjęciami klienta.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{draft.images.map((image, index) => <div key={image.url} className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950"><div className="aspect-square bg-[#efede8] p-3"><img src={image.url} alt={image.alt || draft.title} loading="lazy" className="h-full w-full object-contain" /></div><div className="space-y-2 p-3"><span className="block text-xs text-zinc-400">{index === 0 ? 'Zdjęcie główne' : `Ujęcie ${index + 1}`}</span><div className="flex flex-wrap gap-2"><button type="button" className={secondary} disabled={index === 0} aria-label={`Przenieś zdjęcie produktu ${index + 1} wcześniej`} onClick={() => { const images = [...draft.images]; [images[index - 1], images[index]] = [images[index], images[index - 1]]; edit({ images }); }}>←</button><button type="button" className={secondary} aria-label={`Usuń zdjęcie produktu ${index + 1} z oferty`} onClick={() => edit({ images: draft.images.filter((_, current) => current !== index) })}>Usuń</button></div></div></div>)}</div>{!draft.images.length && <p className="mt-3 rounded-xl border border-dashed border-white/15 p-4 text-sm text-zinc-400">Brak wybranych zdjęć. Szkic można zapisać; własne zdjęcie dodasz w karcie produktu przed publikacją.</p>}</div>
      </fieldset>
      <div className="space-y-3"><div className="flex flex-wrap justify-between gap-2"><h3 className="text-lg font-semibold text-white">Tak klient zobaczy Twój produkt</h3><span className="text-xs text-zinc-400">Podgląd przed publikacją</span></div><GalleryProductPreview product={{ title: draft.title, description: productDescription, price: amount, image_url: draft.images[0]?.url, preview_images: draft.images.map(image => image.url), minPhotos: Number(minPhotos), maxPhotos: Number(maxPhotos) }} /></div>
      <label className="flex min-h-12 items-start gap-3 rounded-xl border border-white/10 p-4 text-sm leading-relaxed text-zinc-300"><input className="mt-1 h-5 w-5 shrink-0 accent-amber-200" type="checkbox" checked={mediaConfirmed} disabled={lock || saved} onChange={event => setMediaConfirmed(event.target.checked)} />Mam uprawnienie do wykorzystania wybranych zdjęć i tekstów w mojej ofercie oraz sprawdziłem ich zgodność z wybranym wariantem produktu.</label>
      <div className="flex flex-wrap items-center gap-4"><button type="button" className={primary} disabled={lock || saved || !mediaConfirmed} onClick={() => void save()}>{busy === 'save' ? 'Zapisywanie szkicu…' : saved ? 'Szkic zapisany' : 'Zapisz szkic do wspólnej oferty'}</button><p className="max-w-lg text-xs leading-relaxed text-zinc-400">Zapis nie publikuje produktu, nie zmienia innych cen i nie składa zamówienia w nPhoto. Widoczność włączysz osobno w karcie produktu.</p></div>
    </>}
  </section>;
}
