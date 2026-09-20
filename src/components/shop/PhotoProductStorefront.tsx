'use client';

import { hasShopDelivery } from '@/lib/galleries/shop-delivery';
import { useEffect, useId, useRef, useState } from 'react';
import { GalleryProductPreviewDialog } from '@/components/galleries/GalleryProductPreview';
import { parseShopIntent, replaceShopIntent, shopAccountHref, shopGalleryHref, trackShopIntent, type ShopIntent } from '@/lib/galleries/shop-intent';
import type { PublicShopCatalog } from '@/lib/galleries/public-offer';
import type { ShopProduct } from '@/lib/galleries/merchandise';
import PrintPriceTiers from '@/components/galleries/PrintPriceTiers';

type ClientGallery = { id: number; access_code: string; client_name: string; photo_count: number; created_at: string; gallery_mode?: string };
type Props = { mode?: 'public' | 'account'; token?: string; className?: string; onAvailabilityChange?: (available: boolean, label: string) => void; onAction?: (action: 'offer_open' | 'gallery_open') => void };
const money = (value: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value / 100);
const action = 'inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#d8c7a7] bg-[#d8c7a7] px-5 py-3 text-center text-sm font-semibold text-stone-950 transition-colors hover:bg-[#ecddc3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8c7a7]';
const secondary = 'min-h-11 rounded-xl border border-stone-600 px-4 py-2 text-sm text-stone-200 transition-colors hover:border-stone-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-300';

export function storefrontStructuredData(catalog: PublicShopCatalog) {
  const entries = [
    ...catalog.formats.filter(format => format.active && format.unitAmount > 0).map(format => ({ name: format.label, description: `${format.paper} · ${format.widthMm} × ${format.heightMm} mm`, price: format.unitAmount, image: catalog.offer.printImageUrl, anchor: `format-${format.id}` })),
    ...catalog.products.filter(product => product.price > 0 && hasShopDelivery(catalog.delivery, product)).map(product => ({ name: product.title, description: product.description || '', price: product.price, image: product.image_url, anchor: `produkt-${product.id}` })),
  ];
  return { '@context': 'https://schema.org', '@type': 'ItemList', name: catalog.offer.title, itemListElement: entries.map((entry, index) => ({ '@type': 'ListItem', position: index + 1, item: { '@type': 'Product', name: entry.name, description: entry.description, ...(entry.image ? { image: entry.image } : {}), url: `https://wlasniewski.pl/karta-podarunkowa#${entry.anchor}`, offers: { '@type': 'Offer', priceCurrency: 'PLN', price: (entry.price / 100).toFixed(2), url: `https://wlasniewski.pl/karta-podarunkowa#${entry.anchor}` } } })) };
}

function ProductImage({ src, alt }: { src?: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#eae7e0] p-5 sm:p-7">
    {src && !failed ? <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-contain" /> : <svg className="h-16 w-16 text-stone-400" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true"><rect x="9" y="11" width="46" height="42" rx="3"/><path d="m13 45 14-15 10 10 7-8 7 10"/><circle cx="42" cy="23" r="4"/></svg>}
  </div>;
}

/** One presentation of the shared catalog, with the existing gallery as the only checkout. */
export default function PhotoProductStorefront({ mode = 'public', token, className = '', onAction, onAvailabilityChange }: Props) {
  const headingId = useId();
  const [catalog, setCatalog] = useState<PublicShopCatalog | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [intent, setIntent] = useState<ShopIntent | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [preview, setPreview] = useState<ShopProduct | null>(null);
  const [galleries, setGalleries] = useState<ClientGallery[] | null>(null);
  const [galleryError, setGalleryError] = useState('');
  const [galleryAttempt, setGalleryAttempt] = useState(0);
  const chooser = useRef<HTMLDivElement>(null);
  const intentKey = intent ? JSON.stringify(intent) : '';

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoaded(false); setLoadError(false);
    fetch('/api/shop/catalog', { cache: 'no-store', signal: controller.signal }).then(async response => {
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error('Oferta niedostępna.');
      if (active) { setCatalog(result.catalog || null); setLoaded(true); }
    }).catch(() => { if (active) { setCatalog(null); setLoadError(true); setLoaded(true); } });
    return () => { active = false; controller.abort(); };
  }, [attempt]);

  useEffect(() => {
    const available = !!catalog?.offer.enabled && (catalog.formats.some(format => format.active && format.unitAmount > 0) || catalog.products.some(product => product.price > 0 && hasShopDelivery(catalog.delivery, product)));
    onAvailabilityChange?.(available, catalog?.offer.buttonLabel || '');
  }, [catalog, onAvailabilityChange]);

  useEffect(() => { if (mode === 'account') setIntent(parseShopIntent(window.location.search)); }, [mode]);
  useEffect(() => { if (mode === 'account' && intent) setExpanded(true); }, [mode, intentKey]);
  useEffect(() => {
    if (intent && loaded && (mode === 'public' || expanded)) {
      chooser.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
      chooser.current?.focus({ preventScroll: true });
    }
  }, [intentKey, loaded, expanded, mode]);
  useEffect(() => {
    if (mode !== 'account' || !token || !intent) return;
    let active = true;
    const controller = new AbortController();
    setGalleries(null); setGalleryError('');
    fetch('/api/galleries/client', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: controller.signal }).then(async response => {
      const result = await response.json();
      if (!response.ok || !Array.isArray(result.galleries)) throw new Error(result.error || 'Nie udało się odczytać Twoich galerii.');
      // Group galleries use their own participant flow and cannot enter the
      // individual gallery merchandise checkout from the account storefront.
      if (active) setGalleries(result.galleries.filter((gallery: ClientGallery) => gallery && gallery.gallery_mode !== 'GROUP' && Number.isSafeInteger(gallery.id) && gallery.id > 0 && typeof gallery.access_code === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(gallery.access_code)));
    }).catch(failure => { if (active) setGalleryError(failure instanceof Error ? failure.message : 'Nie udało się odczytać Twoich galerii.'); });
    return () => { active = false; controller.abort(); };
  }, [mode, token, intentKey, galleryAttempt]);

  if (!loaded) return null;
  if (loadError) return mode === 'account' ? <div role="status" className={`rounded-2xl border border-stone-700 p-5 text-stone-300 ${className}`}>Oferta produktów jest chwilowo niedostępna. Twoje galerie i pozostałe części panelu nadal działają.<button type="button" className={`${secondary} mt-3 block`} onClick={() => setAttempt(value => value + 1)}>Wczytaj ofertę ponownie</button></div> : null;
  // An unpublished shop is not an invitation to purchase drafts or zero-price items.
  if (!catalog?.offer.enabled) return intent && mode === 'account' ? <div role="status" className={`rounded-2xl border border-stone-700 p-5 text-stone-300 ${className}`}>Ta oferta nie jest obecnie dostępna. Możesz nadal przeglądać swoje galerie.<button type="button" className={`${secondary} mt-3 block`} onClick={() => { setIntent(null); replaceShopIntent(null); }}>Zamknij wybór produktu</button></div> : null;
  const formats = catalog.formats.filter(format => format.active && format.unitAmount > 0);
  const products = catalog.products.filter(product => product.price > 0 && hasShopDelivery(catalog.delivery, product));
  const chosen = intent?.kind === 'product' ? products.find(product => product.id === intent.productId) : intent?.kind === 'print' ? formats.find(format => format.id === intent.formatId) : null;
  const chosenTitle = chosen && ('title' in chosen ? chosen.title : chosen.label);
  const choose = (selection: ShopIntent) => {
    trackShopIntent('offer_selected', selection);
    setPreview(null);
    if (mode === 'account') { onAction?.('offer_open'); setIntent(selection); replaceShopIntent(selection); }
    else window.location.assign(shopAccountHref(selection));
  };
  const renderAction = (selection: ShopIntent) => mode === 'public'
    ? <a className={action} href={shopAccountHref(selection)} data-analytics={`shop-offer-${selection.kind}`} onClick={() => trackShopIntent('offer_selected', selection)}>{catalog.offer.buttonLabel}<span aria-hidden="true">→</span></a>
    : <button type="button" className={action} onClick={() => choose(selection)}>{catalog.offer.buttonLabel}<span aria-hidden="true">→</span></button>;

  const content = <section id="produkty-fotograficzne" aria-labelledby={headingId} className={`scroll-mt-28 border-t border-stone-700/60 text-stone-100 ${mode === 'public' ? `py-12 sm:py-16 ${className}` : 'px-4 py-7 sm:px-6'}`}>
    {mode === 'public' && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storefrontStructuredData(catalog)).replace(/</g, '\\u003c') }} />}
    <header className="mb-8 max-w-3xl sm:mb-10"><h2 id={headingId} className="font-serif text-3xl font-normal leading-tight tracking-tight sm:text-5xl">{catalog.offer.title}</h2>{catalog.offer.introduction && <p className="mt-5 whitespace-pre-line text-base leading-7 text-stone-400">{catalog.offer.introduction}</p>}</header>
    {intent && mode === 'account' && <div ref={chooser} tabIndex={-1} className="mb-8 scroll-mt-8 rounded-2xl border border-[#d8c7a7]/50 bg-[#d8c7a7]/5 p-5 sm:p-7" aria-label="Wybór galerii do produktu">
      {chosen ? <><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-[#d8c7a7]">Wybrany produkt</p><h3 className="mt-2 text-2xl font-medium">{chosenTitle}</h3></div><button type="button" className={secondary} onClick={() => { setIntent(null); replaceShopIntent(null); }}>Anuluj wybór</button></div><p className="mb-5 mt-4 max-w-2xl text-sm leading-6 text-stone-300">Wybierz swoją galerię, a następnie zdjęcia do tego produktu. Dostępność i ostateczną cenę sprawdzisz w galerii przed dodaniem do koszyka.</p>
      {galleryError ? <div role="alert"><p className="text-amber-200">{galleryError}</p><button type="button" className={`${secondary} mt-3`} onClick={() => setGalleryAttempt(value => value + 1)}>Wczytaj galerie ponownie</button></div> : galleries === null ? <p role="status" className="text-sm text-stone-400">Wczytuję Twoje galerie…</p> : !galleries.length ? <p role="status" className="rounded-xl border border-stone-700 p-4 text-sm leading-6 text-stone-300">{catalog.offer.emptyMessage}</p> : <div className="grid gap-3 sm:grid-cols-2">{galleries.map(gallery => <a key={gallery.id} href={shopGalleryHref(gallery.access_code, intent)} onClick={() => { onAction?.('gallery_open'); trackShopIntent('gallery_selected', intent); }} className="flex min-h-20 items-center justify-between gap-4 rounded-xl border border-stone-600 bg-stone-900 p-4 transition-colors hover:border-[#d8c7a7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8c7a7]"><span><span className="block font-medium">{gallery.client_name || `Galeria ${gallery.id}`}</span><span className="mt-1 block text-xs text-stone-400">{gallery.photo_count} zdjęć{gallery.created_at && Number.isFinite(Date.parse(gallery.created_at)) ? ` · ${new Date(gallery.created_at).toLocaleDateString('pl-PL')}` : ''}</span></span><span className="shrink-0 text-sm text-[#d8c7a7]">Wybierz zdjęcia <span aria-hidden="true">→</span></span></a>)}</div>}</> : <div role="status"><p>Wybrany produkt nie jest już dostępny w ofercie. Wybierz inny produkt poniżej.</p><button type="button" className={`${secondary} mt-3`} onClick={() => { setIntent(null); replaceShopIntent(null); }}>Zamknij poprzedni wybór</button></div>}
    </div>}
    {!formats.length && !products.length ? <p className="rounded-2xl border border-dashed border-stone-700 p-8 text-center text-stone-400">{catalog.offer.emptyMessage}</p> : <div className={`grid gap-5 sm:grid-cols-2 ${catalog.offer.layout === 'editorial' ? 'xl:grid-cols-2' : 'xl:grid-cols-3'}`}>
      {formats.map(format => <article id={`format-${format.id}`} key={`print-${format.id}`} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-stone-700 bg-[#141413]">
        <ProductImage src={catalog.offer.printImageUrl} alt={catalog.offer.printImageAlt || format.label} />
        <div className="flex flex-1 flex-col p-5 sm:p-6"><h3 className="text-xl font-medium leading-snug">{format.label}</h3><p className="mt-3 text-sm leading-6 text-stone-400">{format.paper} · {format.widthMm} × {format.heightMm} mm</p><p className="mb-6 mt-auto pt-6 text-2xl font-medium tracking-tight">{money(format.unitAmount)} <span className="text-sm font-normal text-stone-400">/ szt.</span></p><div className="mb-5"><PrintPriceTiers format={format} dark /></div>{renderAction({ kind: 'print', formatId: format.id })}</div>
      </article>)}
      {products.map(product => <article id={`produkt-${product.id}`} key={product.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-stone-700 bg-[#141413]">
        <button type="button" aria-label={`Zobacz produkt: ${product.title}`} className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-stone-700" onClick={() => setPreview(product)}><ProductImage src={product.image_url} alt={product.title} /></button>
        <div className="flex flex-1 flex-col p-5 sm:p-6"><h3 className="text-xl font-medium leading-snug">{product.title}</h3>{product.description && <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm leading-6 text-stone-400">{product.description}</p>}<p className="mt-4 text-xs text-stone-500">Zdjęcia do produktu: {product.minPhotos === product.maxPhotos ? product.minPhotos : `${product.minPhotos}–${product.maxPhotos}`}</p><p className="mt-auto pt-6 text-2xl font-medium tracking-tight">{money(product.price)}</p><button type="button" className="my-3 min-h-11 text-left text-sm text-stone-300 underline decoration-stone-600 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-300" aria-label={`Szczegóły produktu: ${product.title}`} onClick={() => setPreview(product)}>Szczegóły i zdjęcia</button>{renderAction({ kind: 'product', productId: product.id })}</div>
      </article>)}
    </div>}
    {preview && <GalleryProductPreviewDialog product={preview} onClose={() => setPreview(null)} onChoose={() => choose({ kind: 'product', productId: preview.id })} />}
  </section>;
  return mode === 'public' ? content : <details open={expanded} onToggle={event => setExpanded(event.currentTarget.open)} className={`rounded-2xl border border-stone-700/70 bg-stone-900/25 ${className}`}>
    <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 text-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8c7a7] [&::-webkit-details-marker]:hidden">
      <span className="line-clamp-2 text-base font-medium leading-6">{catalog.offer.title}</span><span aria-hidden="true" className="text-2xl font-light text-[#d8c7a7]">{expanded ? '−' : '+'}</span>
    </summary>
    {content}
  </details>;
}
