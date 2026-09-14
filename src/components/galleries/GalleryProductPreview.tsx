'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type GalleryProductPresentation = {
  title: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  preview_images?: string[];
  video_url?: string | null;
  sample_pages?: string[];
  minPhotos?: number;
  maxPhotos?: number;
};

const control = 'min-h-11 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 transition hover:border-stone-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-700';
const money = (value: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value / 100);

/** The same presentation is used in the authoring preview and the client shop. */
export default function GalleryProductPreview({ product, onChoose, compact = false }: { product: GalleryProductPresentation; onChoose?: () => void; compact?: boolean }) {
  const [mode, setMode] = useState<'photos' | 'video' | 'pages'>('photos');
  const [videoFailed, setVideoFailed] = useState(false);
  const [page, setPage] = useState(0);
  const touchStart = useRef<{x:number;y:number} | null>(null);
  const pages = product.sample_pages || [];
  useEffect(() => { setMode('photos'); setSelected(0); setPage(0); setVideoFailed(false); }, [product.title, product.video_url]);
  const images = [...new Set([product.image_url, ...(product.preview_images || [])].filter((url): url is string => !!url))];
  const [selected, setSelected] = useState(0);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const activeImage = images[Math.min(selected, Math.max(0, images.length - 1))];
  const photoCount = product.minPhotos && product.maxPhotos
    ? product.minPhotos === product.maxPhotos ? `${product.minPhotos}` : `${product.minPhotos}–${product.maxPhotos}`
    : null;

  return <article className="overflow-hidden rounded-3xl border border-stone-200 bg-[#faf9f6] text-stone-900 [color-scheme:light]">
    <div className={`grid min-w-0 ${compact ? '' : 'lg:grid-cols-[1.1fr_1fr]'}`}>
      <div className="min-w-0 bg-[#eeece7] p-4 sm:p-7">
        {(product.video_url || pages.length > 0) && <div className="mb-4 flex flex-wrap gap-2" aria-label="Materiały produktu">
          <button type="button" className={control} aria-pressed={mode === 'photos'} onClick={() => setMode('photos')}>Zdjęcia</button>
          {product.video_url && <button type="button" className={control} aria-pressed={mode === 'video'} onClick={() => setMode('video')}>Obejrzyj film</button>}
          {pages.length > 0 && <button type="button" className={control} aria-pressed={mode === 'pages'} onClick={() => setMode('pages')}>Zajrzyj do środka</button>}
        </div>}
        {mode === 'video' && product.video_url ? <div className="flex aspect-[5/4] items-center justify-center overflow-hidden rounded-2xl bg-stone-950">
          {videoFailed ? <p role="status" className="p-6 text-sm text-white">Film jest chwilowo niedostępny. Możesz nadal obejrzeć zdjęcia produktu.</p> : <video key={product.video_url} src={product.video_url} controls playsInline preload="none" poster={product.image_url || undefined} aria-label={`Film prezentujący ${product.title}`} className="max-h-full w-full" onError={() => setVideoFailed(true)} />}
        </div> : mode === 'pages' && pages.length ? <div>
          <div className="flex aspect-[5/4] items-center justify-center rounded-2xl bg-white p-3" style={{touchAction:'pan-y pinch-zoom'}} onTouchStart={event => { if (event.touches.length !== 1) { touchStart.current = null; return; } const t = event.touches[0]; touchStart.current = {x:t.clientX,y:t.clientY}; }} onTouchEnd={event => { const t = event.changedTouches[0]; const start = touchStart.current; touchStart.current = null; if (!start) return; const dx = t.clientX - start.x; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(t.clientY - start.y)) setPage(current => Math.max(0, Math.min(pages.length - 1, current + (dx < 0 ? 1 : -1)))); }}>
            <img key={pages[page]} src={pages[page]} alt={`${product.title} — przykładowa rozkładówka ${page + 1}`} className="h-full w-full object-contain" />
          </div>
          <div className="mt-4 flex items-center justify-between gap-2"><button type="button" className={control} disabled={page === 0} onClick={() => setPage(page - 1)}>Poprzednia</button><span aria-live="polite" className="text-sm">{page + 1} / {pages.length}</span><button type="button" className={control} disabled={page === pages.length - 1} onClick={() => setPage(page + 1)}>Następna</button></div>
          <p className="mt-3 text-xs leading-relaxed text-stone-600">Przykładowa realizacja. Twój projekt powstanie z fotografii wybranych w galerii.</p>
        </div> : <>

        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-white/70 p-4 sm:aspect-[5/4] sm:p-6">
          {activeImage && failedImage !== activeImage
            ? <img src={activeImage} alt={`${product.title || 'Produkt'} — ujęcie ${Math.min(selected + 1, images.length)}`} className="h-full w-full object-contain" onError={() => setFailedImage(activeImage)} />
            : <div className="px-6 text-center text-sm leading-relaxed text-stone-500"><svg className="mx-auto mb-4 h-14 w-14" viewBox="0 0 48 48" fill="none" stroke="currentColor" aria-hidden="true"><rect x="8" y="6" width="32" height="36" rx="3" /><path d="M15 6v36M22 17h11M22 23h8M22 32h11" /></svg>{activeImage ? 'Zdjęcie produktu jest chwilowo niedostępne.' : 'Zdjęcia produktu zostaną dodane do oferty.'}</div>}
        </div>
        {images.length > 1 && <div className="mt-4 flex gap-2 overflow-x-auto pb-2" aria-label="Zdjęcia produktu">{images.map((url, index) => <button type="button" key={url} aria-label={`Pokaż ujęcie produktu ${index + 1}`} aria-pressed={activeImage === url} onClick={() => setSelected(index)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-700 ${activeImage === url ? 'border-stone-800' : 'border-transparent'}`}><img src={url} alt="" loading="lazy" className="h-full w-full object-contain" /></button>)}</div>}
        </>}
      </div>
      <div className="flex min-w-0 flex-col p-5 sm:p-8">
        <h3 className="break-words font-serif text-3xl font-medium leading-tight tracking-tight sm:text-4xl">{product.title || 'Nazwa Twojego produktu'}</h3>
        {product.description && <p className="mt-5 whitespace-pre-line break-words text-sm leading-7 text-stone-600">{product.description}</p>}
        {photoCount && <div className="mt-6 border-y border-stone-200 py-4 text-sm leading-relaxed"><span className="font-medium">Zdjęcia do produktu: {photoCount}</span><p className="mt-1 text-stone-500">Wybierzesz je ze swojej galerii po wybraniu produktu. Projekt przygotuje fotograf.</p></div>}
        <div className="mt-auto pt-7"><p className="text-xs uppercase tracking-widest text-stone-500">Cena produktu</p><p className="mt-2 text-3xl font-medium tracking-tight">{Number.isFinite(product.price) && product.price > 0 ? money(product.price) : 'Cena do ustalenia'}</p><p className="mt-2 text-xs text-stone-500">Koszt dostawy zobaczysz w koszyku.</p>{onChoose && <button type="button" onClick={onChoose} className="mt-6 min-h-12 w-full rounded-xl bg-stone-900 px-5 py-3 font-medium text-white transition hover:bg-stone-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-800">Wybierz produkt i zdjęcia</button>}</div>
      </div>
    </div>
  </article>;
}

export function GalleryProductPreviewDialog({ product, onClose, onChoose, adminPreview = false }: { product: GalleryProductPresentation; onClose: () => void; onChoose?: () => void; adminPreview?: boolean }) {
  const [mobilePreview, setMobilePreview] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    close.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onCloseRef.current(); }
      if (event.key === 'Tab') {
        const focusable = dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), video[controls], [tabindex="0"]');
        if (!focusable?.length) return;
        const first = focusable[0]; const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || !dialog.current?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !dialog.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKey, true);
    return () => { document.removeEventListener('keydown', handleKey, true); document.body.style.overflow = previousOverflow; if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true }); };
  }, []);

  return createPortal(<div className="fixed inset-0 z-[230] overflow-y-auto overscroll-contain bg-stone-950/70 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-sm sm:p-8" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className="mx-auto max-w-6xl rounded-3xl bg-[#faf9f6] p-3 text-stone-900 shadow-2xl sm:p-5">
      <header className="mb-3 flex items-center justify-between gap-3 px-2"><h2 id={titleId} className="text-sm font-medium">Szczegóły produktu</h2><button ref={close} type="button" className={control} onClick={onClose}>Zamknij szczegóły</button></header>
      {adminPreview && <div className="mb-4 flex flex-wrap gap-2" aria-label="Szerokość podglądu"><button type="button" className={control} aria-pressed={!mobilePreview} onClick={() => setMobilePreview(false)}>Komputer</button><button type="button" className={control} aria-pressed={mobilePreview} onClick={() => setMobilePreview(true)}>Telefon · 390 px</button></div>}
      <div className={mobilePreview ? 'mx-auto w-full max-w-[390px]' : ''}><GalleryProductPreview product={product} onChoose={onChoose} compact={mobilePreview} /></div>
    </div>
  </div>, document.body);
}
