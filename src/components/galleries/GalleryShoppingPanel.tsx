'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ShopCatalog, ShopLine, ShopDelivery } from '@/lib/galleries/merchandise';

type Photo = { id: number; file_url: string; thumbnail_url?: string | null; width?: number | null; height?: number | null };
type Props = { endpoint: string; headers?: Record<string, string>; photos: Photo[]; onAvailabilityChange?: (enabled: boolean) => void };
type CartLine = ShopLine;
const money = (value: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value / 100);
const button = 'min-h-11 rounded-xl border border-zinc-600 px-4 py-2 font-medium hover:border-amber-400 disabled:opacity-40 disabled:cursor-not-allowed';
const primary = `${button} bg-amber-300 text-black border-amber-300`;
const input = 'min-h-11 w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-white';
const newId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;

export default function GalleryShoppingPanel({ endpoint, headers = {}, photos, onAvailabilityChange }: Props) {
  const [catalog, setCatalog] = useState<ShopCatalog | null>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'gallery' | 'products' | 'cart'>('gallery');
  const [selected, setSelected] = useState<number[]>([]);
  const [format, setFormat] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [removed, setRemoved] = useState<CartLine[]>([]);
  const [checkedLines, setCheckedLines] = useState<string[]>([]);
  const [productId, setProductId] = useState<number | null>(null);
  const [productPhotos, setProductPhotos] = useState<number[]>([]);
  const [productQuantity, setProductQuantity] = useState(1);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const productDrafts = useRef<Record<number, { photos: number[]; quantity: number }>>({});
  const [preview, setPreview] = useState<Photo | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<{ id: number; lines: CartLine[]; key: string } | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [delivery, setDelivery] = useState<ShopDelivery>({ method: 'locker', recipientName: '', email: '', phone: '', pointCode: '', address: { street: '', postalCode: '', city: '' } });
  const previewRef = useRef<Photo | null>(null);
  previewRef.current = preview;
  const addInFlight = useRef(false);
  const [hydratedEndpoint, setHydratedEndpoint] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const productConfigRef = useRef<HTMLDivElement>(null);
  const entryRef = useRef<HTMLButtonElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const idempotency = useRef<{ body: string; key: string } | null>(null);
  const headersKey = JSON.stringify(headers);
  const activeEndpoint = useRef(endpoint);
  activeEndpoint.current = endpoint;
  const clearIdempotency = () => {
    idempotency.current = null;
    try { sessionStorage.removeItem(`gallery-shop-request:${endpoint}`); } catch {}
  };

  const checkPayment = async (pending: { id: number; lines: CartLine[]; key: string }) => {
    if (!pending.key) { setError('Brak klucza tego zamówienia w tej przeglądarce. Wróć do przeglądarki, w której rozpoczęto płatność, lub skontaktuj się z fotografem.'); return; }
    setCheckingPayment(true);
    try {
      const response = await fetch(`${endpoint}/orders/${pending.id}`, { headers: { ...JSON.parse(headersKey), 'x-shop-order-key': pending.key } });
      const result = await response.json();
      if (activeEndpoint.current !== endpoint) return;
      if (!response.ok || !result.success) throw new Error(result.error || 'Nie udało się sprawdzić płatności.');
      const status = String(result.order.payment_status).toUpperCase();
      if (['PAID', 'COMPLETED'].includes(status)) {
        setLines(previous => previous.filter(line => !pending.lines.some(paid => JSON.stringify(paid) === JSON.stringify(line))));
        setNotice(`Zamówienie ${pending.id} opłacone. Dziękujemy!`);
        setPendingOrder(null); clearIdempotency();
        try { sessionStorage.removeItem(`gallery-shop-pending:${endpoint}`); } catch {}
      } else if (['CANCELED', 'CANCELLED', 'FAILED', 'REJECTED'].includes(status)) {
        setNotice('Płatność nie została zakończona. Koszyk zachowany — możesz go zmienić i ponownie zamówić.');
        setPendingOrder(null); clearIdempotency();
        try { sessionStorage.removeItem(`gallery-shop-pending:${endpoint}`); } catch {}
      } else { setPendingOrder(pending); setNotice(`Zamówienie ${pending.id} oczekuje na potwierdzenie płatności. Sprawdź status przed kolejnym zamówieniem.`); }
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Nie udało się sprawdzić płatności.'); }
    finally { setCheckingPayment(false); }
  };


  useEffect(() => { if (productId) productConfigRef.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' }); }, [productId, editingProduct]);

  useEffect(() => { addInFlight.current = false; }, [selected, productPhotos]);
  useEffect(() => {
    setHydratedEndpoint(null); setCatalog(null); setFormat(''); onAvailabilityChange?.(false);
    setLines([]); setRemoved([]); setCheckedLines([]); setSelected([]); setProductId(null); setProductPhotos([]); setProductQuantity(1); setQuantity(1); setEditingProduct(null); productDrafts.current = {}; setPendingOrder(null); setOpen(false); setTab('gallery'); setCheckout(false); setNotice(''); setError(''); idempotency.current = null;
    setDelivery({ method: 'locker', recipientName: '', email: '', phone: '', pointCode: '', address: { street: '', postalCode: '', city: '' } });
    try {
      const saved = JSON.parse(sessionStorage.getItem(`gallery-shop:${endpoint}`) || 'null');
      if (Array.isArray(saved)) setLines(saved.filter((line: CartLine) => line && typeof line.id === 'string' && ((line.kind === 'print' && Number.isInteger(line.photoId) && typeof line.formatId === 'string') || (line.kind === 'product' && Array.isArray(line.photoIds) && line.photoIds.length > 0 && line.photoIds.every(id => Number.isSafeInteger(id) && id > 0) && Number.isInteger(line.coverPhotoId) && line.photoIds.includes(line.coverPhotoId) && Number.isInteger(line.productId))) && Number.isInteger(line.quantity) && line.quantity > 0 && line.quantity <= 99));
    } catch { /* Session storage is optional. */ }
    setHydratedEndpoint(endpoint);
  }, [endpoint]);
  useEffect(() => {
    let pending: { id: number; lines: CartLine[]; key: string } | null = null;
    try { pending = JSON.parse(sessionStorage.getItem(`gallery-shop-pending:${endpoint}`) || 'null'); } catch {}
    const returnedId = Number(new URLSearchParams(window.location.search).get('shopOrder'));
    if (returnedId > 0 && (!pending || pending.id !== returnedId)) pending = { id: returnedId, lines: [], key: '' };
    if (pending?.id) { setPendingOrder(pending); setOpen(true); setTab('cart'); void checkPayment(pending); }
  }, [endpoint, headersKey]);

  useEffect(() => {
    if (hydratedEndpoint !== endpoint) return;
    try { sessionStorage.setItem(`gallery-shop:${endpoint}`, JSON.stringify(lines)); } catch { /* Browsing remains available without storage. */ }
  }, [lines, endpoint, hydratedEndpoint]);

  useEffect(() => {
    let active = true;
    fetch(endpoint, { headers: JSON.parse(headersKey) }).then(async response => {
      const result = await response.json();
      if (!active) return;
      const value = response.ok && result.success ? result.catalog : null;
      setCatalog(value);
      onAvailabilityChange?.(!!value?.enabled);
      if (value?.formats?.length) setFormat(value.formats[0].id);
      if (value?.delivery) setDelivery(previous => ({ ...previous, method: value.delivery.locker.enabled ? 'locker' : 'courier' }));
    }).catch(() => { if (active) onAvailabilityChange?.(false); });
    return () => { active = false; };
  }, [endpoint, headersKey, onAvailabilityChange]);

  useEffect(() => {
    if (!open || !catalog?.enabled) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { if (previewRef.current) setPreview(null); else setOpen(false); }
      if (event.key === 'Tab') {
        const focusScope = previewRef.current ? dialogRef.current?.querySelector<HTMLElement>('[data-shop-preview]') : dialogRef.current;
        const nodes = focusScope?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex="0"]');
        if (!nodes?.length) return;
        const first = nodes[0]; const last = nodes[nodes.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', onKey); entryRef.current?.focus(); };
  }, [open, catalog?.enabled]);

  if (!catalog?.enabled) return null;
  const remaining = Math.max(0, 500 - lines.length);
  const currentFormat = catalog.formats.find(item => item.id === format);
  const product = catalog.products.find(item => item.id === productId);
  const photoById = (id: number) => photos.find(photo => photo.id === id);
  const linePrice = (line: CartLine) => line.kind === 'print' ? catalog.formats.find(item => item.id === line.formatId)?.unitAmount || 0 : catalog.products.find(item => item.id === line.productId)?.price || 0;
  const invalidLines = lines.length > 500 || lines.some(line => line.kind === 'print' ? !catalog.formats.some(item => item.id === line.formatId && item.active) || !photos.some(photo => photo.id === line.photoId) : !catalog.products.some(item => item.id === line.productId && line.photoIds.length >= item.minPhotos && line.photoIds.length <= item.maxPhotos) || line.photoIds.some(id => !photos.some(photo => photo.id === id)));
  const subtotal = lines.reduce((sum, line) => sum + linePrice(line) * line.quantity, 0);
  const deliveryPrice = catalog.delivery[delivery.method]?.amount || 0;
  const total = subtotal + deliveryPrice;
  const navigate = (value: typeof tab) => { setTab(value); setCheckout(false); setError(''); mainRef.current?.scrollTo?.({ top: 0 }); };
  const togglePhoto = (id: number, isProduct: boolean) => {
    const change = (ids: number[]) => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id];
    if (isProduct) setProductPhotos(change); else setSelected(change);
  };
  const addPrints = () => {
    if (!selected.length || selected.length > remaining || !currentFormat || busy || addInFlight.current) return;
    addInFlight.current = true;
    setLines(previous => [...previous, ...selected.map(photoId => ({ id: newId(), kind: 'print' as const, photoId, formatId: format, quantity, crop: { mode: 'fit' as const, x: 50, y: 50, zoom: 1 }, confirmed: true }))]);
    setNotice(`Dodano ${selected.length} zdjęć, po ${quantity} szt. do koszyka.`);
    setSelected([]);
    navigate('cart');
  };
  const removeLines = (ids: string[]) => {
    setRemoved(lines.filter(line => ids.includes(line.id)));
    setLines(lines.filter(line => !ids.includes(line.id)));
    setCheckedLines([]);
    setNotice('Usunięto z koszyka. Możesz cofnąć usunięcie.');
  };
  const addProduct = () => {
    if (!product || (!editingProduct && remaining === 0) || productPhotos.length < product.minPhotos || productPhotos.length > product.maxPhotos || addInFlight.current) return;
    addInFlight.current = true;
    setLines(previous => [...previous.filter(line => line.id !== editingProduct), { id: editingProduct || newId(), kind: 'product', productId: product.id, photoIds: productPhotos, coverPhotoId: productPhotos[0], quantity: productQuantity }]);
    delete productDrafts.current[product.id]; setEditingProduct(null);
    setProductId(null); setProductPhotos([]); setProductQuantity(1); navigate('cart'); setNotice('Produkt dodany do koszyka.');
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || pendingOrder || !lines.length || invalidLines) return;
    setBusy(true); setError('');
    const body = JSON.stringify({ lines, delivery, expectedTotal: total });
    if (!idempotency.current) {
      try {
        const saved = JSON.parse(sessionStorage.getItem(`gallery-shop-request:${endpoint}`) || 'null');
        if (saved?.body === body && typeof saved.key === 'string') idempotency.current = saved;
      } catch {}
    }
    if (idempotency.current?.body !== body) idempotency.current = { body, key: newId() };
    try { sessionStorage.setItem(`gallery-shop-request:${endpoint}`, JSON.stringify(idempotency.current)); } catch {}
    try {
      const response = await fetch(`${endpoint}/orders`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json', 'Idempotency-Key': idempotency.current.key }, body });
      const result = await response.json();
      if (response.status === 409 && (result.code === 'PRICE_CHANGED' || result.catalog)) {
        const fresh = result.catalog ? { success: true, catalog: result.catalog } : await fetch(endpoint, { headers }).then(value => value.json());
        if (fresh.success && fresh.catalog) setCatalog(fresh.catalog);
        clearIdempotency();
        throw new Error('Oferta została zaktualizowana. Sprawdź nowe ceny i dostępność w koszyku przed ponowieniem płatności.');
      }
      if (!response.ok && ['PAYMENT_REVIEW', 'ORDER_IN_PROGRESS'].includes(result.code) && Number.isSafeInteger(result.orderId)) {
        const pending = { id: result.orderId, lines: [...lines], key: idempotency.current!.key };
        setPendingOrder(pending);
        try { sessionStorage.setItem(`gallery-shop-pending:${endpoint}`, JSON.stringify(pending)); } catch {}
      }
      if (!response.ok || !result.success) throw new Error(result.error || 'Nie udało się rozpocząć płatności. Koszyk został zachowany.');
      if (result.paid === true) {
        setLines(previous => previous.filter(line => !lines.some(paid => JSON.stringify(paid) === JSON.stringify(line))));
        setNotice(`Zamówienie ${result.orderId || ''} jest już opłacone.`);
        clearIdempotency();
        return;
      }
      if (!result.paymentUrl) throw new Error('Brak adresu płatności. Koszyk został zachowany.');
      if (!Number.isSafeInteger(result.orderId)) throw new Error('Brak identyfikatora zamówienia. Koszyk zachowany.');
      const pending = { id: result.orderId, lines: [...lines], key: idempotency.current!.key };
      setPendingOrder(pending);
      try { sessionStorage.setItem(`gallery-shop-pending:${endpoint}`, JSON.stringify(pending)); } catch {}
      window.location.assign(result.paymentUrl);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Błąd połączenia. Spróbuj ponownie.'); }
    finally { setBusy(false); }
  };
  const renderPhotos = (isProduct: boolean) => {
    const ids = isProduct ? productPhotos : selected;
    return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {photos.map(photo => <article key={photo.id} className={`rounded-xl border p-2 ${ids.includes(photo.id) ? 'border-amber-300 bg-amber-300/10' : 'border-zinc-700'}`}>
        <button type="button" className="w-full" aria-label={`Podejrzyj zdjęcie ${photo.id}`} onClick={() => setPreview(photo)}><span className="relative block w-full bg-white" style={{ aspectRatio: isProduct || !currentFormat ? '1' : (photo.width || 1) >= (photo.height || 1) ? Math.max(currentFormat.widthMm, currentFormat.heightMm) / Math.min(currentFormat.widthMm, currentFormat.heightMm) : Math.min(currentFormat.widthMm, currentFormat.heightMm) / Math.max(currentFormat.widthMm, currentFormat.heightMm) }}><img loading="lazy" src={photo.thumbnail_url || photo.file_url} alt={`Zdjęcie ${photo.id}`} className="absolute inset-0 h-full w-full object-contain" /></span></button>
        <label className="flex min-h-11 items-center gap-2"><input type="checkbox" aria-label={`Zaznacz zdjęcie ${photo.id}`} checked={ids.includes(photo.id)} onChange={() => togglePhoto(photo.id, isProduct)} className="h-5 w-5" /> Zdjęcie {photo.id}</label>
      </article>)}
    </div>;
  };

  return <>
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-300/30 bg-zinc-900 p-5 text-white">
      <div><h2 className="text-xl font-semibold">{catalog.title}</h2><p className="mt-1 text-zinc-300">{catalog.introduction}</p></div>
      <button ref={entryRef} type="button" className={primary} onClick={() => setOpen(true)}>{catalog.buttonLabel || 'Zamów odbitki i produkty'}{lines.length ? ` · Koszyk (${lines.length})` : ''}</button>
    </div>
    {open && createPortal(<div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Zakupy w galerii" tabIndex={-1} className="fixed inset-0 z-[200] flex flex-col bg-zinc-950 text-white">
      <header className="shrink-0 border-b border-zinc-700 bg-zinc-950 p-3 sm:px-6">
        <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{catalog.title}</h2><button type="button" className={button} onClick={() => setOpen(false)}>Wróć do oglądania</button></div>
        <nav aria-label="Nawigacja zakupów" className="mt-3 grid grid-cols-3 gap-2">{(['gallery', 'products', 'cart'] as const).map(value => <button key={value} type="button" className={tab === value ? primary : button} aria-current={tab === value ? 'page' : undefined} onClick={() => navigate(value)}>{value === 'gallery' ? 'Galeria' : value === 'products' ? 'Produkty' : `Koszyk (${lines.length})`}</button>)}</nav>
      </header>
      <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
        <div className="mx-auto w-full max-w-[1500px]">
        <p role="status" className="mb-3 text-emerald-300">{notice}</p>
        {pendingOrder && <div className="mb-4 rounded-xl border border-amber-300 p-4"><p>Płatność zamówienia {pendingOrder.id} jest w trakcie weryfikacji. Koszyk jest zachowany.</p><button className={button} disabled={checkingPayment} onClick={() => void checkPayment(pendingOrder)}>{checkingPayment ? 'Sprawdzam płatność…' : 'Sprawdź status płatności'}</button></div>}
        {invalidLines && <p role="alert" className="mb-4 rounded-lg bg-amber-950 p-3">Część pozycji jest już niedostępna. Zmień format lub usuń niedostępne pozycje przed płatnością.</p>}
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-950 p-3 text-red-200">{error}</p>}
        {tab === 'gallery' && <section aria-label="Wybierz odbitki">
          <h3 className="mb-2 text-2xl font-semibold">Wybierz zdjęcia do odbitek</h3>
          <p className="mb-4 text-zinc-300">Zaznacz kilka zdjęć. Format i ilość poniżej dotyczą każdego zaznaczonego zdjęcia. Cały kadr zostanie zachowany; przy innych proporcjach mogą pojawić się białe marginesy.</p>
          <div className="mb-4 flex flex-wrap gap-3"><button type="button" className={button} disabled={!remaining} onClick={() => setSelected(photos.slice(0, remaining).map(photo => photo.id))}>{photos.length > remaining ? `Zaznacz pierwsze ${remaining}` : 'Zaznacz wszystkie'}</button><button type="button" className={button} disabled={!selected.length} onClick={() => setSelected([])}>Odznacz wszystkie</button><span className="py-3">Wybrano: {selected.length}</span></div>
          <div className="sticky top-0 z-10 mb-5 grid gap-3 rounded-xl border border-zinc-700 bg-zinc-950 p-3 sm:grid-cols-3">
            <label>Format dla zaznaczonych<select aria-label="Format dla zaznaczonych" className={input} value={format} onChange={event => setFormat(event.target.value)}>{catalog.formats.map(item => <option key={item.id} value={item.id}>{item.label} — {money(item.unitAmount)}/szt.</option>)}</select></label>
            <label>Ilość na każde zdjęcie<input aria-label="Ilość na każde zdjęcie" className={input} type="number" min="1" max="99" value={quantity} onChange={event => setQuantity(Math.max(1, Math.min(99, Math.floor(Number(event.target.value)) || 1)))} /></label>
            <div><p className="mb-2">{selected.length} zdjęć × {quantity} szt. = {money(selected.length * quantity * (currentFormat?.unitAmount || 0))}</p><button type="button" className={primary} disabled={!selected.length || selected.length > remaining || !currentFormat} onClick={addPrints}>Dodaj zaznaczone do koszyka</button></div>
          </div>
          {selected.length > remaining && <p role="alert" className="mb-4 text-amber-300">Koszyk mieści 500 pozycji. Możesz teraz dodać najwyżej {remaining} zdjęć. Odznacz nadmiarowe zdjęcia.</p>}
          {renderPhotos(false)}
        </section>}
        {tab === 'products' && <section aria-label="Produkty fotograficzne">
          <div className="mb-4 flex flex-wrap justify-between gap-3"><h3 className="text-2xl font-semibold">Produkty</h3><div className="flex gap-2"><button className={button} aria-label="Poprzednie produkty" onClick={() => carouselRef.current?.scrollBy({ left: -340, behavior: 'smooth' })}>←</button><button className={button} aria-label="Następne produkty" onClick={() => carouselRef.current?.scrollBy({ left: 340, behavior: 'smooth' })}>→</button></div></div>
          <div ref={carouselRef} className="mb-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">{catalog.products.map(item => <article key={item.id} className="w-72 shrink-0 snap-start rounded-xl border border-zinc-700 bg-zinc-900 p-4">
            {item.image_url && <img src={item.image_url} alt={item.title} className="mb-4 h-44 w-full rounded-lg object-contain" loading="lazy" />}<h4 className="text-xl font-semibold">{item.title}</h4><p className="my-2 text-zinc-300">{item.description}</p><p className="mb-3 font-semibold">{money(item.price)}</p><button className={button} onClick={() => { if (productId !== item.id) { if (productId && !editingProduct) productDrafts.current[productId] = { photos: productPhotos, quantity: productQuantity }; setEditingProduct(null); setProductId(item.id); setProductPhotos(productDrafts.current[item.id]?.photos || []); setProductQuantity(productDrafts.current[item.id]?.quantity || 1); } }}>Wybierz produkt: {item.title}</button>
          </article>)}</div>
          {!catalog.products.length && <p>Fotograf nie udostępnił jeszcze produktów w tej galerii.</p>}
          {product && <div ref={productConfigRef} className="rounded-xl border border-amber-300/50 p-4">
            <h4 className="text-xl font-semibold">{product.title} — wybór zdjęć</h4><p className="my-3">Wybierz {product.minPhotos === product.maxPhotos ? product.minPhotos : `${product.minPhotos}–${product.maxPhotos}`} zdjęć. Wybrano: {productPhotos.length}. Pierwsze zdjęcie jest propozycją okładki. Projekt przygotuje fotograf.</p>
            <div className="mb-4 flex flex-wrap items-end gap-3"><label>Ilość produktów<input aria-label="Ilość produktów" className={input} type="number" min="1" max="99" value={productQuantity} onChange={event => setProductQuantity(Math.max(1, Math.min(99, Math.floor(Number(event.target.value)) || 1)))} /></label><button className={primary} disabled={(!editingProduct && !remaining) || productPhotos.length < product.minPhotos || productPhotos.length > product.maxPhotos} onClick={addProduct}>{editingProduct ? 'Zapisz zmiany produktu' : 'Dodaj produkt do koszyka'} · {money(product.price * productQuantity)}</button><button className={button} onClick={() => { setProductId(null); setProductPhotos([]); setEditingProduct(null); delete productDrafts.current[product.id]; }}>Anuluj wybór produktu</button></div>
            {productPhotos.length > 0 && <ol className="mb-5 flex flex-wrap gap-3" aria-label="Kolejność zdjęć produktu">{productPhotos.map((id, index) => <li key={id} className="rounded-lg border border-zinc-700 p-2"><span>{index + 1}. Zdjęcie {id}{index === 0 ? ' · Okładka' : ''}</span><button className={button} disabled={index === 0} aria-label={`Przesuń zdjęcie ${id} wcześniej`} onClick={() => setProductPhotos(ids => { const next = [...ids]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; })}>←</button><button className={button} aria-label={`Usuń zdjęcie ${id} z produktu`} onClick={() => togglePhoto(id, true)}>Usuń</button></li>)}</ol>}
            {renderPhotos(true)}
          </div>}
        </section>}
        {tab === 'cart' && <section aria-label="Twój koszyk">
          <h3 className="mb-4 text-2xl font-semibold">Twój koszyk</h3>
          <div className="mb-5 flex flex-wrap gap-3"><button className={button} onClick={() => navigate('gallery')}>Dodaj odbitki z galerii</button><button className={button} onClick={() => navigate('products')}>{product ? 'Kontynuuj wybór produktu' : 'Dodaj produkt'}</button>{checkedLines.length > 0 && <button className={button} onClick={() => removeLines(checkedLines)}>Usuń zaznaczone ({checkedLines.length})</button>}{removed.length > 0 && <button className={button} disabled={lines.length + removed.length > 500} title={lines.length + removed.length > 500 ? 'Najpierw zwolnij miejsce w koszyku (limit 500 pozycji)' : undefined} onClick={() => { setLines(previous => [...previous, ...removed]); setRemoved([]); setNotice('Przywrócono usunięte pozycje.'); }}>Cofnij usunięcie</button>}</div>
          {!lines.length && <p className="rounded-xl border border-zinc-700 p-6">Koszyk jest pusty. Wybierz zdjęcia lub produkt.</p>}
          <div className="space-y-4">{lines.map((line, index) => { const photo = photoById(line.kind === 'print' ? line.photoId : line.photoIds[0]); const item = line.kind === 'product' ? catalog.products.find(value => value.id === line.productId) : null; return <article key={line.id} aria-label={`Pozycja ${index + 1}`} className="flex flex-wrap items-center gap-4 rounded-xl border border-zinc-700 p-4">
            <input type="checkbox" className="h-5 w-5" aria-label={`Zaznacz pozycję ${index + 1}`} checked={checkedLines.includes(line.id)} onChange={() => setCheckedLines(ids => ids.includes(line.id) ? ids.filter(id => id !== line.id) : [...ids, line.id])} />
            {photo && <button aria-label={`Podgląd pozycji ${index + 1}`} onClick={() => setPreview(photo)}><img src={photo.thumbnail_url || photo.file_url} alt={`Zdjęcie ${photo.id}`} className="h-24 w-24 object-contain" /></button>}
            <div className="min-w-40 flex-1"><h4 className="font-semibold">{line.kind === 'print' ? `Odbitka · zdjęcie ${line.photoId}` : item?.title}</h4>{line.kind === 'print' ? <select className={input} aria-label={`Format pozycji ${index + 1}`} value={line.formatId} onChange={event => setLines(previous => previous.map(value => value.id === line.id ? { ...value, formatId: event.target.value } : value))}>{catalog.formats.map(value => <option key={value.id} value={value.id}>{value.label} — {money(value.unitAmount)}</option>)}</select> : <><p>{line.photoIds.length} zdjęć · Okładka: {line.coverPhotoId}</p><button className={button} aria-label={`Edytuj zdjęcia pozycji ${index + 1}`} onClick={() => { setEditingProduct(line.id); setProductId(line.productId); setProductPhotos([...line.photoIds]); setProductQuantity(line.quantity); navigate('products'); }}>Edytuj zdjęcia i okładkę</button></>}</div>
            <label className="w-24">Ilość<input className={input} type="number" min="1" max="99" aria-label={`Ilość pozycji ${index + 1}`} value={line.quantity} onChange={event => setLines(previous => previous.map(value => value.id === line.id ? { ...value, quantity: Math.max(1, Math.min(99, Math.floor(Number(event.target.value)) || 1)) } : value))} /></label>
            <strong>{money(linePrice(line) * line.quantity)}</strong><button className={button} aria-label={`Usuń pozycję ${index + 1}`} onClick={() => removeLines([line.id])}>Usuń</button>
          </article>; })}</div>
          {!!lines.length && <div className="mt-6 rounded-xl border border-zinc-700 p-4"><p className="mb-3 text-xl font-semibold">Produkty: {money(subtotal)}</p>{!checkout && <button className={primary} onClick={() => setCheckout(true)}>Dostawa i podsumowanie</button>}
            {checkout && <form onSubmit={submit} className="space-y-4">
              <label className="block">Sposób dostawy<select className={input} aria-label="Sposób dostawy" value={delivery.method} onChange={event => setDelivery(previous => ({ ...previous, method: event.target.value as ShopDelivery['method'] }))}>{Object.entries(catalog.delivery).filter(([, value]) => value.enabled).map(([key, value]) => <option value={key} key={key}>{key === 'locker' ? 'InPost Paczkomat' : 'Kurier'} · {money(value.amount)}</option>)}</select></label>
              <div className="grid gap-4 sm:grid-cols-2">{(['recipientName', 'email', 'phone'] as const).map(field => <label key={field}>{field === 'recipientName' ? 'Imię i nazwisko' : field === 'email' ? 'E-mail' : 'Telefon'}<input className={input} required type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'} value={delivery[field]} onChange={event => setDelivery(previous => ({ ...previous, [field]: event.target.value }))} /></label>)}</div>
              {delivery.method === 'locker' ? <label className="block">Kod Paczkomatu<input className={input} required placeholder="np. WAW01M" value={delivery.pointCode} onChange={event => setDelivery(previous => ({ ...previous, pointCode: event.target.value.toUpperCase() }))} /></label> : <div className="grid gap-4 sm:grid-cols-3">{(['street', 'postalCode', 'city'] as const).map(field => <label key={field}>{field === 'street' ? 'Ulica, numer domu i lokalu' : field === 'postalCode' ? 'Kod pocztowy' : 'Miejscowość'}<input className={input} required value={delivery.address?.[field] || ''} onChange={event => setDelivery(previous => ({ ...previous, address: { street: '', postalCode: '', city: '', ...previous.address, [field]: event.target.value } }))} /></label>)}</div>}
              <p>Dostawa: {money(deliveryPrice)} · Razem: <strong>{money(total)}</strong></p><button className={primary} disabled={busy || !!pendingOrder || invalidLines || !catalog.delivery[delivery.method]?.enabled} type="submit">{busy ? 'Przygotowuję płatność…' : `Zamawiam i płacę ${money(total)}`}</button><button className={`${button} ml-3`} type="button" onClick={() => setCheckout(false)}>Wróć do koszyka</button>
            </form>}
          </div>}
        </section>}
        </div>
      </main>
      {preview && <div data-shop-preview className="absolute inset-0 z-10 flex flex-col bg-black p-4" role="dialog" aria-label="Podgląd zdjęcia"><div className="flex justify-end gap-3"><button className={button} onClick={() => { setPreview(null); navigate('cart'); }}>Koszyk ({lines.length})</button><button autoFocus className={button} onClick={() => setPreview(null)}>Zamknij podgląd</button></div><img src={preview.file_url} alt={`Zdjęcie ${preview.id}`} className="min-h-0 flex-1 object-contain" /></div>}
    </div>, document.body)}
  </>;
}
