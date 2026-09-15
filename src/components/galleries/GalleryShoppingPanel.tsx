'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import InPostPointPicker from './InPostPointPicker';
import { GalleryProductPreviewDialog } from './GalleryProductPreview';
import type { ShopCatalog, ShopLine, ShopDelivery } from '@/lib/galleries/merchandise';
import {printUnitAmount, printQuantities} from '@/lib/galleries/merchandise';
import PrintPriceTiers from './PrintPriceTiers';
import { parseShopIntent, replaceShopIntent, trackShopIntent } from '@/lib/galleries/shop-intent';
import { availableShopDelivery } from '@/lib/galleries/shop-delivery';

type Photo = { id: number; file_url: string; thumbnail_url?: string | null; width?: number | null; height?: number | null };
type Props = { endpoint: string; headers?: Record<string, string>; photos: Photo[]; onAvailabilityChange?: (enabled: boolean) => void };
type CartLine = ShopLine;
const money = (value: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value / 100);
const button = 'min-h-11 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 transition-colors hover:border-stone-500 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-600 disabled:opacity-40 disabled:cursor-not-allowed';
const primary = 'min-h-11 rounded-xl border border-stone-900 bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-600 disabled:opacity-40 disabled:cursor-not-allowed';
const input = 'mt-1 min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-base text-stone-900 outline-none focus:border-stone-600 focus:ring-2 focus:ring-stone-200';
const newId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
const photoCountLabel = (count: number) => {
  const lastTwo = count % 100;
  const last = count % 10;
  return count === 1 ? 'zdjęcie' : last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? 'zdjęcia' : 'zdjęć';
};

export default function GalleryShoppingPanel({ endpoint, headers = {}, photos, onAvailabilityChange }: Props) {
  const [catalog, setCatalog] = useState<ShopCatalog | null>(null);
  const [catalogLoadedEndpoint, setCatalogLoadedEndpoint] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState('');
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const intentHandledEndpoint = useRef<string | null>(null);
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
  const [productPreviewId, setProductPreviewId] = useState<number | null>(null);
  const productPreviewRef = useRef<number | null>(null);
  productPreviewRef.current = productPreviewId;
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<{ id: number; lines: CartLine[]; key: string } | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [pendingPaymentUrl, setPendingPaymentUrl] = useState<string | null>(null);
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
  const availableDelivery = catalog ? availableShopDelivery(catalog, lines) : null;
  const activeEndpoint = useRef(endpoint);
  activeEndpoint.current = endpoint;
  const clearIdempotency = () => {
    idempotency.current = null;
    try { sessionStorage.removeItem(`gallery-shop-request:${endpoint}`); } catch {}
  };

  const clearPaymentReturn = () => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('shopOrder')) {
      url.searchParams.delete('shopOrder');
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    }
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
      setPendingPaymentUrl(typeof result.order.paymentUrl === 'string' && /^https:\/\//i.test(result.order.paymentUrl) ? result.order.paymentUrl : null);
      if (['PAID', 'COMPLETED'].includes(status)) {
        setLines(previous => previous.filter(line => !pending.lines.some(paid => JSON.stringify(paid) === JSON.stringify(line))));
        setNotice(`Zamówienie ${pending.id} opłacone. Dziękujemy!`);
        setPendingOrder(null); setPendingPaymentUrl(null); clearIdempotency();
        clearPaymentReturn();
        try { sessionStorage.removeItem(`gallery-shop-pending:${endpoint}`); } catch {}
      } else if (['CANCELED', 'CANCELLED', 'FAILED', 'REJECTED'].includes(status)) {
        setNotice('Płatność nie została zakończona. Koszyk zachowany — możesz go zmienić i ponownie zamówić.');
        setPendingOrder(null); setPendingPaymentUrl(null); clearIdempotency();
        clearPaymentReturn();
        try { sessionStorage.removeItem(`gallery-shop-pending:${endpoint}`); } catch {}
      } else { setPendingOrder(pending); setNotice(`Zamówienie ${pending.id} oczekuje na potwierdzenie płatności. Sprawdź status przed kolejnym zamówieniem.`); }
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Nie udało się sprawdzić płatności.'); }
    finally { setCheckingPayment(false); }
  };


  useEffect(() => { if (productId) productConfigRef.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' }); }, [productId, editingProduct]);

  useEffect(() => { addInFlight.current = false; }, [selected, productPhotos]);
  useEffect(() => {
    setHydratedEndpoint(null); setCatalog(null); setCatalogLoadedEndpoint(null); setCatalogError(''); intentHandledEndpoint.current = null; setFormat(''); onAvailabilityChange?.(false);
    setProductPreviewId(null);
    setLines([]); setRemoved([]); setCheckedLines([]); setSelected([]); setProductId(null); setProductPhotos([]); setProductQuantity(1); setQuantity(1); setEditingProduct(null); productDrafts.current = {}; setPendingOrder(null); setPendingPaymentUrl(null); setOpen(false); setTab('gallery'); setCheckout(false); setNotice(''); setError(''); idempotency.current = null;
    setDelivery({ method: 'locker', recipientName: '', email: '', phone: '', pointCode: '', address: { street: '', postalCode: '', city: '' } });
    try {
      const saved = JSON.parse(sessionStorage.getItem(`gallery-shop:${endpoint}`) || 'null');
      if (Array.isArray(saved)) setLines(saved.filter((line: CartLine) => line && typeof line.id === 'string' && ((line.kind === 'print' && Number.isInteger(line.photoId) && typeof line.formatId === 'string') || (line.kind === 'product' && Array.isArray(line.photoIds) && line.photoIds.length > 0 && line.photoIds.every(id => Number.isSafeInteger(id) && id > 0) && Number.isInteger(line.coverPhotoId) && line.photoIds.includes(line.coverPhotoId) && Number.isInteger(line.productId))) && Number.isInteger(line.quantity) && line.quantity > 0 && line.quantity <= 99));
    } catch { /* Session storage is optional. */ }
    try {
      const saved = JSON.parse(sessionStorage.getItem(`gallery-shop-drafts:${endpoint}`) || 'null');
      const validIds = (value: unknown): value is number[] => Array.isArray(value) && value.length <= 500 && value.every(id => Number.isSafeInteger(id) && id > 0) && new Set(value).size === value.length;
      if (saved?.products && typeof saved.products === 'object') {
        for (const [id, draft] of Object.entries(saved.products) as [string, { photos: number[]; quantity: number }][]) {
          if (/^\d+$/.test(id) && draft && validIds(draft.photos) && Number.isInteger(draft.quantity) && draft.quantity >= 1 && draft.quantity <= 99) productDrafts.current[Number(id)] = draft;
        }
      }
      if (Number.isSafeInteger(saved?.activeProduct) && productDrafts.current[saved.activeProduct]) {
        setProductId(saved.activeProduct);
        setProductPhotos(productDrafts.current[saved.activeProduct].photos);
        setProductQuantity(productDrafts.current[saved.activeProduct].quantity);
      }
      if (validIds(saved?.selected)) setSelected(saved.selected);
      const d = saved?.delivery;
      if (d && ['locker', 'courier', 'pickup'].includes(d.method) && ['recipientName', 'email', 'phone'].every(key => typeof d[key] === 'string' && d[key].length <= 300)) {
        setDelivery({ method: d.method, recipientName: d.recipientName, email: d.email, phone: d.phone, pointCode: typeof d.pointCode === 'string' ? d.pointCode.slice(0, 30) : '', address: { street: typeof d.address?.street === 'string' ? d.address.street.slice(0, 200) : '', postalCode: typeof d.address?.postalCode === 'string' ? d.address.postalCode.slice(0, 20) : '', city: typeof d.address?.city === 'string' ? d.address.city.slice(0, 100) : '' } });
      }
    } catch { /* An incomplete selection never prevents opening the gallery. */ }
    setHydratedEndpoint(endpoint);
  }, [endpoint]);
  useEffect(() => {
    let pending: { id: number; lines: CartLine[]; key: string } | null = null;
    try { pending = JSON.parse(sessionStorage.getItem(`gallery-shop-pending:${endpoint}`) || 'null'); } catch {}
    const returnedId = Number(new URLSearchParams(window.location.search).get('shopOrder'));
    if (returnedId > 0 && !pending) pending = { id: returnedId, lines: [], key: '' };
    if (pending?.id) { setPendingOrder(pending); setOpen(true); setTab('cart'); void checkPayment(pending); }
  }, [endpoint, headersKey]);

  useEffect(() => {
    if (hydratedEndpoint !== endpoint) return;
    try { sessionStorage.setItem(`gallery-shop:${endpoint}`, JSON.stringify(lines)); } catch { /* Browsing remains available without storage. */ }
  }, [lines, endpoint, hydratedEndpoint]);

  useEffect(() => {
    if (hydratedEndpoint !== endpoint) return;
    const drafts = { ...productDrafts.current };
    // Cart product edits stay in the cart until explicitly saved. Only new drafts
    // are resumed after refresh, so an edit can never become a duplicate purchase.
    if (productId && !editingProduct) drafts[productId] = { photos: productPhotos, quantity: productQuantity };
    try { sessionStorage.setItem(`gallery-shop-drafts:${endpoint}`, JSON.stringify({ products: drafts, activeProduct: editingProduct ? null : productId, selected, delivery })); } catch {}
  }, [endpoint, hydratedEndpoint, productId, productPhotos, productQuantity, editingProduct, selected, delivery]);

  useEffect(() => {
    let active = true;
    setCatalogError('');
    fetch(endpoint, { headers: JSON.parse(headersKey) }).then(async response => {
      const result = await response.json();
      if (!active) return;
      if (!response.ok || !result.success) throw new Error('Nie udało się odczytać oferty.');
      const value = result.catalog;
      setCatalog(value);
      setCatalogLoadedEndpoint(endpoint);
      onAvailabilityChange?.(!!value?.enabled);
      if (value?.formats?.length) setFormat(value.formats[0].id);
      if (value?.delivery) setDelivery(previous => ({ ...previous, method: value.delivery[previous.method]?.enabled ? previous.method : value.delivery.locker.enabled ? 'locker' : value.delivery.courier.enabled ? 'courier' : 'pickup' }));
    }).catch(() => { if (active) { onAvailabilityChange?.(false); if (parseShopIntent(window.location.search)) setCatalogError('Nie udało się odczytać oferty dla wybranego produktu. Twój wybór jest zachowany.'); } });
    return () => { active = false; };
  }, [endpoint, headersKey, onAvailabilityChange, catalogAttempt]);

  useEffect(() => {
    if (catalogLoadedEndpoint !== endpoint || hydratedEndpoint !== endpoint || intentHandledEndpoint.current === endpoint) return;
    // A payment return always wins. A public product link can never replace that state.
    if (pendingOrder || checkingPayment || new URLSearchParams(window.location.search).has('shopOrder')) return;
    const intent = parseShopIntent(window.location.search);
    if (!intent) return;
    intentHandledEndpoint.current = endpoint;
    const offered = catalog?.enabled && (intent.kind === 'product'
      ? catalog.products.find(item => item.id === intent.productId)
      : catalog.formats.find(item => item.id === intent.formatId && item.active));
    if (!offered) {
      setNotice('Wybrany produkt nie jest dostępny w tej galerii. Możesz wybrać inną pozycję z oferty lub skontaktować się z fotografem.');
      if (catalog?.enabled) { setOpen(true); setTab(intent.kind === 'product' ? 'products' : 'gallery'); }
      replaceShopIntent(null);
      return;
    }
    setOpen(true); setCheckout(false); setError('');
    if (intent.kind === 'product') {
      if (productId && !editingProduct) productDrafts.current[productId] = { photos: productPhotos, quantity: productQuantity };
      const saved = productDrafts.current[intent.productId];
      setEditingProduct(null); setProductId(intent.productId); setProductPhotos(saved?.photos || []); setProductQuantity(saved?.quantity || 1); setTab('products');
    } else { setFormat(intent.formatId); setTab('gallery'); }
    setNotice('Produkt wybrany. Sprawdź cenę w tej galerii i zaznacz zdjęcia. Nic nie zostało jeszcze dodane do koszyka.');
    replaceShopIntent(null);
    trackShopIntent('selection_opened', intent);
  }, [catalog, catalogLoadedEndpoint, hydratedEndpoint, endpoint, pendingOrder, checkingPayment]);

  useEffect(() => {
    if (!availableDelivery || availableDelivery[delivery.method]?.enabled) return;
    const next = availableDelivery.locker.enabled ? 'locker' : availableDelivery.courier.enabled ? 'courier' : availableDelivery.pickup?.enabled ? 'pickup' : null;
    if (next) {
      setDelivery(previous => ({ ...previous, method: next }));
      if (lines.length) setNotice(next === 'courier' ? 'Wybrano dostawę kurierem. Koszt dostawy został zaktualizowany w podsumowaniu.' : 'Dostawa została dopasowana do produktów w koszyku.');
    }
  }, [availableDelivery?.locker.enabled, availableDelivery?.courier.enabled, availableDelivery?.pickup?.enabled, delivery.method]);

  useEffect(() => {
    if (!open || !catalog?.enabled) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (productPreviewRef.current || event.defaultPrevented) return;
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

  if (!catalog?.enabled) return catalogError ? <div role="alert" className="mb-8 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900"><p>{catalogError}</p><button type="button" className={`${button} mt-3`} onClick={() => setCatalogAttempt(value => value + 1)}>Wczytaj ofertę ponownie</button></div> : notice ? <p role="status" className="mb-8 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">{notice}</p> : null;
  const remaining = Math.max(0, 500 - lines.length);
  const currentFormat = catalog.formats.find(item => item.id === format);
  const product = catalog.products.find(item => item.id === productId);
  const previewProduct = catalog.products.find(item => item.id === productPreviewId);
  const chooseProduct = (id: number) => {
    if (productId !== id) {
      if (productId && !editingProduct) productDrafts.current[productId] = { photos: productPhotos, quantity: productQuantity };
      setEditingProduct(null); setProductId(id); setProductPhotos(productDrafts.current[id]?.photos || []); setProductQuantity(productDrafts.current[id]?.quantity || 1);
    }
  };
  const photoById = (id: number) => photos.find(photo => photo.id === id);
  const productMissingPhotos = product ? Math.max(0, product.minPhotos - productPhotos.length) : 0;
  const productExcessPhotos = product ? Math.max(0, productPhotos.length - product.maxPhotos) : 0;
  const productHasUnavailablePhotos = productPhotos.some(id => !photoById(id));
  const productCartFull = !editingProduct && remaining === 0;
  const productSelectionValid = !!product && !productCartFull && !productHasUnavailablePhotos && productMissingPhotos === 0 && productExcessPhotos === 0;
  const productSelectionMessage = productCartFull
    ? 'Koszyk jest pełny. Usuń pozycję z koszyka, aby dodać ten produkt.'
    : productHasUnavailablePhotos
      ? 'Jedno z wybranych zdjęć jest już niedostępne. Usuń je z wyboru.'
      : productMissingPhotos > 0
        ? `Wybierz jeszcze ${productMissingPhotos} ${photoCountLabel(productMissingPhotos)}.`
        : productExcessPhotos > 0
          ? `Usuń ${productExcessPhotos} ${photoCountLabel(productExcessPhotos)} z wyboru.`
          : 'Wybór gotowy. Możesz dodać produkt do koszyka.';
  const productCtaLabel = productMissingPhotos > 0
    ? `Wybierz jeszcze ${productMissingPhotos} ${photoCountLabel(productMissingPhotos)}`
    : productExcessPhotos > 0
      ? `Usuń ${productExcessPhotos} ${photoCountLabel(productExcessPhotos)}`
      : editingProduct ? 'Zapisz zmiany produktu' : 'Dodaj produkt do koszyka';
  const quantities = printQuantities(lines);
  const selectedPrintPrice = printUnitAmount(currentFormat,(quantities[format] || 0)+selected.length*quantity);
  const linePrice = (line: CartLine) => line.kind === 'print' ? printUnitAmount(catalog.formats.find(item => item.id === line.formatId),quantities[line.formatId]) : catalog.products.find(item => item.id === line.productId)?.price || 0;
  const invalidLines = lines.length > 500 || lines.some(line => line.kind === 'print' ? !catalog.formats.some(item => item.id === line.formatId && item.active) || !photos.some(photo => photo.id === line.photoId) : !catalog.products.some(item => item.id === line.productId && line.photoIds.length >= item.minPhotos && line.photoIds.length <= item.maxPhotos) || line.photoIds.some(id => !photos.some(photo => photo.id === id)));
  const subtotal = lines.reduce((sum, line) => sum + linePrice(line) * line.quantity, 0);
  const deliveryPrice = availableDelivery?.[delivery.method]?.amount || 0;
  const total = subtotal + deliveryPrice;
  const navigate = (value: typeof tab) => { setTab(value); setCheckout(false); setError(''); mainRef.current?.scrollTo?.({ top: 0 }); };
  const togglePhoto = (id: number, isProduct: boolean) => {
    const change = (ids: number[]) => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id];
    if (isProduct) setProductPhotos(ids => product?.maxPhotos === 1 ? ids.includes(id) ? [] : [id] : change(ids)); else setSelected(change);
  };
  const addPrints = () => {
    if (!selected.length || selected.length > remaining || !currentFormat || selected.some(id => !photoById(id)) || busy || addInFlight.current) return;
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
    if (!product || productPhotos.some(id => !photoById(id)) || (!editingProduct && remaining === 0) || productPhotos.length < product.minPhotos || productPhotos.length > product.maxPhotos || addInFlight.current) return;
    addInFlight.current = true;
    setLines(previous => [...previous.filter(line => line.id !== editingProduct), { id: editingProduct || newId(), kind: 'product', productId: product.id, photoIds: productPhotos, coverPhotoId: productPhotos[0], quantity: productQuantity }]);
    delete productDrafts.current[product.id]; setEditingProduct(null);
    setProductId(null); setProductPhotos([]); setProductQuantity(1); navigate('cart'); setNotice('Produkt dodany do koszyka.');
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || pendingOrder || !lines.length || invalidLines || !availableDelivery?.[delivery.method]?.enabled) return;
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
      setPendingPaymentUrl(result.paymentUrl);
      window.location.assign(result.paymentUrl);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Błąd połączenia. Spróbuj ponownie.'); }
    finally { setBusy(false); }
  };
  const renderPhotos = (isProduct: boolean) => {
    const ids = isProduct ? productPhotos : selected;
    return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {photos.map(photo => <article key={photo.id} className={`overflow-hidden rounded-2xl border p-2 transition-colors ${ids.includes(photo.id) ? 'border-stone-700 bg-stone-100 ring-1 ring-stone-700' : 'border-stone-200 bg-white'}`}>
        <button type="button" className="w-full" aria-label={`Podejrzyj zdjęcie ${photo.id}`} onClick={() => setPreview(photo)}><span className="flex aspect-square w-full items-center justify-center rounded-lg bg-stone-100 p-2"><span className="relative block max-h-full w-full bg-white" style={{ aspectRatio: isProduct || !currentFormat ? '1' : (photo.width || 1) >= (photo.height || 1) ? Math.max(currentFormat.widthMm, currentFormat.heightMm) / Math.min(currentFormat.widthMm, currentFormat.heightMm) : Math.min(currentFormat.widthMm, currentFormat.heightMm) / Math.max(currentFormat.widthMm, currentFormat.heightMm) }}><img loading="lazy" src={photo.thumbnail_url || photo.file_url} alt={`Zdjęcie ${photo.id}`} className="absolute inset-0 h-full w-full object-contain" /></span></span></button>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 px-1 text-sm text-stone-700"><input type="checkbox" aria-label={`Zaznacz zdjęcie ${photo.id}`} checked={ids.includes(photo.id)} onChange={() => togglePhoto(photo.id, isProduct)} className="h-5 w-5 shrink-0 accent-stone-800" /> Zdjęcie {photo.id}</label>
      </article>)}
    </div>;
  };

  return <>
    <div className="gallery-shop-invitation mb-8 flex flex-wrap items-center justify-between gap-5 rounded-3xl border border-stone-200 bg-[#f7f5f0] p-6 text-stone-900 sm:p-8">
      <div><h2 className="text-xl font-semibold">{catalog.title}</h2><p className="mt-1 text-stone-600">{catalog.introduction}</p></div>
      <button ref={entryRef} type="button" className={primary} onClick={() => setOpen(true)}>{catalog.buttonLabel || 'Zamów odbitki i produkty'}{lines.length ? ` · Koszyk (${lines.length})` : ''}</button>
    </div>
    {open && createPortal(<div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Zakupy w galerii" tabIndex={-1} className="fixed inset-0 z-[200] flex flex-col bg-[#faf9f6] text-stone-900 [color-scheme:light]">
      <header className="shrink-0 border-b border-stone-200 bg-white px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-8">
        <div className="flex items-center justify-between gap-3"><h2 className="min-w-0 flex-1 truncate text-lg font-medium tracking-tight sm:text-xl" title={catalog.title}>{catalog.title}</h2><button type="button" className={button} onClick={() => setOpen(false)}>Wróć do oglądania</button></div>
        <nav aria-label="Nawigacja zakupów" className="mx-auto mt-4 grid max-w-2xl grid-cols-3 gap-1 rounded-2xl bg-stone-100 p-1">{(['gallery', 'products', 'cart'] as const).map(value => <button key={value} type="button" className={`min-h-11 rounded-xl px-2 py-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-600 ${tab === value ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-500 hover:text-stone-900'}`} aria-current={tab === value ? 'page' : undefined} onClick={() => navigate(value)}>{value === 'gallery' ? 'Galeria' : value === 'products' ? 'Produkty' : `Koszyk (${lines.length})`}</button>)}</nav>
      </header>
      <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 sm:px-8 sm:pt-10">
        <div className="mx-auto w-full max-w-[1280px]">
        <p role="status" className={notice ? "mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" : "sr-only"}>{notice}</p>
        {pendingOrder && <div className="mb-4 rounded-xl border border-amber-300 p-4"><p>Płatność zamówienia {pendingOrder.id} jest w trakcie weryfikacji. Koszyk jest zachowany.</p><button className={button} disabled={checkingPayment} onClick={() => void checkPayment(pendingOrder)}>{checkingPayment ? 'Sprawdzam płatność…' : 'Sprawdź status płatności'}</button>{pendingPaymentUrl && <a className={`${primary} mt-3 inline-flex items-center sm:ml-3`} href={pendingPaymentUrl}>Wróć do płatności</a>}</div>}
        {invalidLines && <p role="alert" className="mb-4 rounded-lg bg-amber-50 text-amber-900 p-3">Część pozycji jest już niedostępna. Zmień format lub usuń niedostępne pozycje przed płatnością.</p>}
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}
        {tab === 'gallery' && <section aria-label="Wybierz odbitki">
          <h3 className="mb-2 font-serif text-3xl font-medium tracking-tight sm:text-4xl">Wybierz zdjęcia do odbitek</h3>
          <p className="mb-4 text-stone-600">Zaznacz kilka zdjęć. Format i ilość poniżej dotyczą każdego zaznaczonego zdjęcia. Cały kadr zostanie zachowany; przy innych proporcjach mogą pojawić się białe marginesy.</p>
          <div className="mb-4 flex flex-wrap gap-3"><button type="button" className={button} disabled={!remaining} onClick={() => setSelected(photos.slice(0, remaining).map(photo => photo.id))}>{photos.length > remaining ? `Zaznacz pierwsze ${remaining}` : 'Zaznacz wszystkie'}</button><button type="button" className={button} disabled={!selected.length} onClick={() => setSelected([])}>Odznacz wszystkie</button><span className="py-3">Wybrano: {selected.length}</span></div>
          <div className="mb-6 grid grid-cols-2 items-end gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:sticky sm:top-0 sm:z-10 sm:grid-cols-3 sm:p-5">
            <label>Format dla zaznaczonych<select aria-label="Format dla zaznaczonych" className={input} value={format} onChange={event => setFormat(event.target.value)}>{!catalog.formats.length && <option value="">Brak dostępnych formatów</option>}{catalog.formats.map(item => <option key={item.id} value={item.id}>{item.label} — {money(printUnitAmount(item,(quantities[item.id] || 0)+selected.length*quantity))}/szt.</option>)}</select></label>
            <label>Ilość na każde zdjęcie<input aria-label="Ilość na każde zdjęcie" className={input} type="number" inputMode="numeric" min="1" max="99" value={quantity} onChange={event => setQuantity(Math.max(1, Math.min(99, Math.floor(Number(event.target.value)) || 1)))} /></label>
            <div className="col-span-2 sm:col-span-1"><p className="mb-2 text-sm text-stone-600">{selected.length} zdjęć × {quantity} szt. = {money(selected.length * quantity * selectedPrintPrice)}</p><button type="button" className={primary} disabled={!selected.length || selected.length > remaining || selected.some(id => !photoById(id)) || !currentFormat} onClick={addPrints}>Dodaj zaznaczone do koszyka</button></div>
          </div>
          {currentFormat && <div className="mb-5 max-w-xl"><PrintPriceTiers format={currentFormat} /></div>}
          {selected.length > remaining && <p role="alert" className="mb-4 text-amber-800">Koszyk mieści 500 pozycji. Możesz teraz dodać najwyżej {remaining} zdjęć. Odznacz nadmiarowe zdjęcia.</p>}
          {!photos.length && <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">W tej galerii nie ma jeszcze zdjęć do zamówienia.</p>}
          {renderPhotos(false)}
        </section>}
        {tab === 'products' && <section aria-label="Produkty fotograficzne">
          <div className="mb-4 flex flex-wrap justify-between gap-3"><h3 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">Produkty</h3><div className="flex gap-2 sm:hidden"><button className={button} aria-label="Poprzednie produkty" onClick={() => carouselRef.current?.scrollBy({ left: -340, behavior: 'smooth' })}>←</button><button className={button} aria-label="Następne produkty" onClick={() => carouselRef.current?.scrollBy({ left: 340, behavior: 'smooth' })}>→</button></div></div>
          <div ref={carouselRef} className="gallery-shop-invitation rounded-3xl mb-8 flex snap-x snap-proximity gap-4 overflow-x-auto pb-4 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">{catalog.products.map(item => <article key={item.id} className={`flex w-[85%] shrink-0 snap-start flex-col overflow-hidden rounded-3xl border bg-white sm:w-auto ${productId === item.id ? "border-stone-700 ring-1 ring-stone-700" : "border-stone-200"}`}>
            {item.image_url ? <button type="button" aria-label={`Zobacz zdjęcia produktu: ${item.title}`} className="aspect-[4/3] bg-stone-100 p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-700" onClick={() => setProductPreviewId(item.id)}><img src={item.image_url} alt={item.title} className="h-full w-full object-contain" loading="lazy" /></button> : <div className="flex aspect-[4/3] items-center justify-center bg-stone-100" aria-hidden="true"><svg width="76" height="76" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1" className="text-stone-400"><rect x="12" y="8" width="40" height="48" rx="3"/><path d="M19 8v48M26 22h18M26 28h13M26 42h18"/></svg></div>}<div className="flex flex-1 flex-col p-5"><h4 className="text-xl font-semibold">{item.title}</h4><p className="mb-5 mt-2 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-stone-600">{item.description}</p><p className="mb-4 mt-auto text-xl font-medium">{money(item.price)}</p><button type="button" className="mb-3 min-h-11 text-left text-sm font-medium text-stone-600 underline decoration-stone-300 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-700" aria-label={`Zobacz szczegóły produktu: ${item.title}`} onClick={() => setProductPreviewId(item.id)}>Zobacz szczegóły</button><button className={button} onClick={() => chooseProduct(item.id)}>Wybierz produkt: {item.title}</button></div>
          </article>)}</div>
          {!catalog.products.length && <p className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center text-stone-500">Fotograf nie udostępnił jeszcze produktów w tej galerii.</p>}
          {product && <div ref={productConfigRef} className="scroll-mt-6 rounded-3xl border border-stone-200 bg-white p-4 sm:p-7">
            <h4 className="text-xl font-semibold">{product.title} — wybór zdjęć</h4><p className="my-3">{product.maxPhotos === 1 ? 'Wybierz jedno zdjęcie produktu. Możesz je zmienić, wskazując inne zdjęcie.' : `Wybierz ${product.minPhotos === product.maxPhotos ? product.minPhotos : `${product.minPhotos}–${product.maxPhotos}`} zdjęć. Pierwsze zdjęcie jest zdjęciem głównym do projektu. Projekt i układ przygotuje fotograf zgodnie z opisem produktu.`} Wybrano: {productPhotos.length}.</p>
            <div className="mb-4 flex flex-wrap gap-2">{product.minPhotos === product.maxPhotos && product.maxPhotos > 1 && <button type="button" className={button} onClick={() => setProductPhotos(photos.slice(0, product.maxPhotos).map(photo => photo.id))}>Zaznacz pierwsze {product.maxPhotos} zdjęć</button>}{productPhotos.length > 0 && <button type="button" className={button} onClick={() => setProductPhotos([])}>Wyczyść wybór</button>}</div>
            <p id="product-selection-status" role="status" aria-live="polite" className={`mb-3 rounded-xl px-4 py-3 text-sm font-medium ${productSelectionValid ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>{productSelectionMessage}</p>
            <div className="mb-4 flex flex-wrap items-end gap-3"><label>Ilość produktów<input aria-label="Ilość produktów" className={input} type="number" inputMode="numeric" min="1" max="99" value={productQuantity} onChange={event => setProductQuantity(Math.max(1, Math.min(99, Math.floor(Number(event.target.value)) || 1)))} /></label><button type="button" className={primary} aria-describedby="product-selection-status" disabled={!productSelectionValid} onClick={addProduct}>{productCtaLabel} · {money(product.price * productQuantity)}</button><button type="button" className={button} onClick={() => { setProductId(null); setProductPhotos([]); setEditingProduct(null); delete productDrafts.current[product.id]; }}>Anuluj wybór produktu</button></div>
            {productPhotos.length > 0 && <ol className="mb-5 flex flex-wrap gap-3" aria-label={product.maxPhotos === 1 ? 'Zdjęcie produktu' : 'Kolejność zdjęć produktu'}>{productPhotos.map((id, index) => <li key={id} className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 p-2">{photoById(id) && <img src={photoById(id)!.thumbnail_url || photoById(id)!.file_url} alt="" className="h-12 w-12 rounded-lg object-cover" loading="lazy" />}<span className="text-sm">{product.maxPhotos === 1 ? `Zdjęcie produktu: ${id}` : `${index + 1}. Zdjęcie ${id}${index === 0 ? ' · Zdjęcie główne' : ''}`}</span>{product.maxPhotos > 1 && <button className={button} disabled={index === 0} aria-label={`Przesuń zdjęcie ${id} wcześniej`} onClick={() => setProductPhotos(ids => { const next = [...ids]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; })}>←</button>}<button className={button} aria-label={`Usuń zdjęcie ${id} z produktu`} onClick={() => togglePhoto(id, true)}>Usuń</button></li>)}</ol>}
            {renderPhotos(true)}
          </div>}
        </section>}
        {tab === 'cart' && <section aria-label="Twój koszyk">
          <h3 className="mb-4 font-serif text-3xl font-medium tracking-tight sm:text-4xl">Twój koszyk</h3>
          <div className="mb-5 flex flex-wrap gap-3"><button className={button} onClick={() => navigate('gallery')}>Dodaj odbitki z galerii</button><button className={button} onClick={() => navigate('products')}>{product ? 'Kontynuuj wybór produktu' : 'Dodaj produkt'}</button>{checkedLines.length > 0 && <button className={button} onClick={() => removeLines(checkedLines)}>Usuń zaznaczone ({checkedLines.length})</button>}{removed.length > 0 && <button className={button} disabled={lines.length + removed.length > 500} title={lines.length + removed.length > 500 ? 'Najpierw zwolnij miejsce w koszyku (limit 500 pozycji)' : undefined} onClick={() => { setLines(previous => [...previous, ...removed]); setRemoved([]); setNotice('Przywrócono usunięte pozycje.'); }}>Cofnij usunięcie</button>}</div>
          {!lines.length && <p className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center text-stone-500">Koszyk jest pusty. Wybierz zdjęcia lub produkt.</p>}
          <div className="space-y-4">{lines.map((line, index) => { const photo = photoById(line.kind === 'print' ? line.photoId : line.photoIds[0]); const item = line.kind === 'product' ? catalog.products.find(value => value.id === line.productId) : null; return <article key={line.id} aria-label={`Pozycja ${index + 1}`} className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:gap-5 sm:p-5">
            <input type="checkbox" className="h-5 w-5 shrink-0 accent-stone-800" aria-label={`Zaznacz pozycję ${index + 1}`} checked={checkedLines.includes(line.id)} onChange={() => setCheckedLines(ids => ids.includes(line.id) ? ids.filter(id => id !== line.id) : [...ids, line.id])} />
            {photo && <button aria-label={`Podgląd pozycji ${index + 1}`} onClick={() => setPreview(photo)}><img src={photo.thumbnail_url || photo.file_url} alt={`Zdjęcie ${photo.id}`} className="h-24 w-24 object-contain" /></button>}
            <div className="min-w-40 flex-1"><h4 className="font-semibold">{line.kind === 'print' ? `Odbitka · zdjęcie ${line.photoId}` : item?.title || 'Produkt niedostępny'}</h4>{line.kind === 'print' ? <select className={input} aria-label={`Format pozycji ${index + 1}`} value={line.formatId} onChange={event => setLines(previous => previous.map(value => value.id === line.id ? { ...value, formatId: event.target.value } : value))}>{catalog.formats.map(value => <option key={value.id} value={value.id}>{value.label} — {money(printUnitAmount(value,(quantities[value.id] || 0)+(value.id===line.formatId?0:line.quantity)))}/szt.</option>)}</select> : <><p>{item?.maxPhotos === 1 ? `Zdjęcie produktu: ${line.coverPhotoId}` : `${line.photoIds.length} zdjęć · Zdjęcie główne: ${line.coverPhotoId}`}</p><button className={button} aria-label={`Edytuj zdjęcia pozycji ${index + 1}`} onClick={() => { if (productId && !editingProduct) productDrafts.current[productId] = { photos: productPhotos, quantity: productQuantity }; setEditingProduct(line.id); setProductId(line.productId); setProductPhotos([...line.photoIds]); setProductQuantity(line.quantity); navigate('products'); }}>{item?.maxPhotos === 1 ? 'Zmień zdjęcie produktu' : 'Edytuj zdjęcia i kolejność'}</button></>}</div>
            <label className="w-24">Ilość<input className={input} type="number" inputMode="numeric" min="1" max="99" aria-label={`Ilość pozycji ${index + 1}`} value={line.quantity} onChange={event => setLines(previous => previous.map(value => value.id === line.id ? { ...value, quantity: Math.max(1, Math.min(99, Math.floor(Number(event.target.value)) || 1)) } : value))} /></label>
            <div className="text-right"><strong>{money(linePrice(line) * line.quantity)}</strong>{line.kind === 'print' && <p className="mt-1 text-xs text-stone-500">{money(linePrice(line))}/szt.</p>}</div><button className={button} aria-label={`Usuń pozycję ${index + 1}`} onClick={() => removeLines([line.id])}>Usuń</button>
          </article>; })}</div>
          {!!lines.length && <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-5 sm:p-8"><p className="mb-3 text-xl font-semibold">Produkty: {money(subtotal)}</p>{!checkout && <button className={primary} onClick={() => setCheckout(true)}>Dostawa i podsumowanie</button>}
            {checkout && <form onSubmit={submit} className="space-y-4">
              {!availableDelivery?.locker.enabled && !availableDelivery?.courier.enabled && !availableDelivery?.pickup?.enabled && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Brak wspólnego sposobu dostawy dla produktów w koszyku. Zmień koszyk lub skontaktuj się z fotografem przed zamówieniem.</p>}
              <label className="block">Sposób dostawy<select className={input} aria-label="Sposób dostawy" value={delivery.method} onChange={event => setDelivery(previous => ({ ...previous, method: event.target.value as ShopDelivery['method'] }))}>{Object.entries(availableDelivery || {}).filter(([, value]) => value.enabled).map(([key, value]) => <option value={key} key={key}>{key === 'locker' ? 'InPost Paczkomat' : key === 'pickup' ? 'Odbiór osobisty' : 'Kurier'} · {money(value.amount)}</option>)}</select></label>
              <div className="grid gap-4 sm:grid-cols-2">{(['recipientName', 'email', 'phone'] as const).map(field => <label key={field}>{field === 'recipientName' ? 'Imię i nazwisko' : field === 'email' ? 'E-mail' : 'Telefon'}<input className={input} required autoComplete={field === 'recipientName' ? 'name' : field === 'email' ? 'email' : 'tel'} type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'} value={delivery[field]} onChange={event => setDelivery(previous => ({ ...previous, [field]: event.target.value }))} /></label>)}</div>
              {delivery.method === 'locker' ? <InPostPointPicker value={delivery.pointCode || ''} onChange={pointCode => setDelivery(previous => ({ ...previous, pointCode }))} /> : delivery.method === 'courier' ? <div className="grid gap-4 sm:grid-cols-3">{(['street', 'postalCode', 'city'] as const).map(field => <label key={field}>{field === 'street' ? 'Ulica, numer domu i lokalu' : field === 'postalCode' ? 'Kod pocztowy' : 'Miejscowość'}<input className={input} required value={delivery.address?.[field] || ''} onChange={event => setDelivery(previous => ({ ...previous, address: { street: '', postalCode: '', city: '', ...previous.address, [field]: event.target.value } }))} /></label>)}</div> : <p className="whitespace-pre-line rounded-xl bg-stone-100 p-4 text-sm text-stone-700">{availableDelivery?.pickup?.instructions}</p>}
              <p>Dostawa: {money(deliveryPrice)} · Razem: <strong>{money(total)}</strong></p><button className={primary} disabled={busy || !!pendingOrder || invalidLines || !availableDelivery?.[delivery.method]?.enabled} type="submit">{busy ? 'Przygotowuję płatność…' : `Zamawiam i płacę ${money(total)}`}</button><button className={`${button} sm:ml-3`} type="button" onClick={() => setCheckout(false)}>Wróć do koszyka</button>
            </form>}
          </div>}
        </section>}
        </div>
      </main>
      {tab === 'gallery' && selected.length > 0 && <footer className="shrink-0 border-t border-stone-200 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:hidden">
        <div className="flex items-center justify-between gap-3"><button type="button" className="min-h-11 text-left text-sm text-stone-600 underline decoration-stone-300 underline-offset-4" onClick={() => mainRef.current?.scrollTo?.({ top: 0 })}>Format i ilość<br /><span className="font-medium text-stone-900">{selected.length} zdjęć × {quantity} szt. · {currentFormat?.label}</span></button><button type="button" className={primary} disabled={selected.length > remaining || selected.some(id => !photoById(id)) || !currentFormat} onClick={addPrints}>Dodaj · {money(selected.length * quantity * selectedPrintPrice)}</button></div>
      </footer>}
      {preview && <div data-shop-preview className="absolute inset-0 z-10 flex flex-col bg-black p-4 text-white" role="dialog" aria-label="Podgląd zdjęcia"><div className="flex justify-end gap-3"><button className={button} onClick={() => { setPreview(null); navigate('cart'); }}>Koszyk ({lines.length})</button><button autoFocus className={button} onClick={() => setPreview(null)}>Zamknij podgląd</button></div><img src={preview.file_url} alt={`Zdjęcie ${preview.id}`} className="min-h-0 flex-1 object-contain" /></div>}
    </div>, document.body)}
    {open && previewProduct && <GalleryProductPreviewDialog product={previewProduct} onClose={() => setProductPreviewId(null)} onChoose={() => { chooseProduct(previewProduct.id); setProductPreviewId(null); }} />}
  </>;
}
