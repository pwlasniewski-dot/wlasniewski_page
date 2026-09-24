'use client';
import { useEffect, useRef, useState } from 'react';
import type { SandboxProduct, SandboxQuote } from '@/lib/fulfillment/prodigi-sandbox';
import { isProdigiPilotSku } from '@/lib/fulfillment/prodigi-pilot';

export default function ProdigiSandboxPanel() {
  const [open, setOpen] = useState(false);
  return <details className="min-w-0 rounded-xl border border-zinc-700" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="min-h-11 cursor-pointer p-4 text-sm font-semibold text-zinc-200">Prodigi — test piaskownicy</summary>
    {open && <ProdigiSandboxDiagnostics/>}
  </details>;
}

export function ProdigiSandboxDiagnostics() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [sku, setSku] = useState('GLOBAL-CAN-10X10');
  const [product, setProduct] = useState<SandboxProduct | null>(null);
  const [variant, setVariant] = useState('0'); const [copies, setCopies] = useState('1');
  const [quotes, setQuotes] = useState<SandboxQuote[]>([]);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [checkedAt, setCheckedAt] = useState('');
  const lock = useRef(false);
  const activeRequest = useRef<AbortController | null>(null);
  useEffect(() => () => activeRequest.current?.abort(), []);
  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    const timeout = setTimeout(() => controller.abort(), 20_000);
    fetch('/api/admin/gallery-shop/prodigi', { credentials: 'include', cache: 'no-store', signal: controller.signal })
      .then(async response => { if (!response.ok) throw Error(); const data = await response.json(); if (typeof data.configured !== 'boolean') throw Error(); if (!disposed) setConfigured(data.configured); })
      .catch(() => { if (!disposed) setError('Nie udało się odczytać konfiguracji. Odśwież stronę.'); })
      .finally(() => clearTimeout(timeout));
    return () => { disposed = true; clearTimeout(timeout); controller.abort(); };
  }, []);
  const variants = product?.variants.filter(item => item.shipsTo.includes('PL')) ?? [];
  async function inspect(action: 'product' | 'quote') {
    if (lock.current) return;
    const selected = variants[Number(variant)]; const count = Number(copies);
    if (action === 'quote' && (!product || !selected || !Number.isInteger(count) || count < 1 || count > 100)) { setError('Wybierz wariant i całkowitą ilość od 1 do 100.'); return; }
    const areas = product ? Object.keys(product.printAreas).filter(area => product.printAreas[area].required) : [];
    if (action === 'quote' && (areas.length === 0 || areas.some(area => !selected?.printAreaSizes[area]))) { setError('Brak kompletu wymaganych pól druku. Ten produkt wymaga osobnej kwalifikacji.'); return; }
    lock.current = true; setBusy(true); setError(''); setQuotes([]); setCheckedAt('');
    if (action === 'product') { setProduct(null); setVariant('0'); }
    const controller = new AbortController(); activeRequest.current = controller;
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const body = action === 'product' ? { action, sku } : { action, items: [{ sku: product!.sku, copies: count, attributes: selected.attributes, assets: areas.map(printArea => ({ printArea })) }] };
      const response = await fetch('/api/admin/gallery-shop/prodigi', { method: 'POST', credentials: 'include', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
      const data = await response.json();
      if (!response.ok || !data.success) throw Error(data.error || 'Nie udało się sprawdzić Prodigi.');
      if (action === 'product') setProduct(data.product); else setQuotes(data.quotes);
      setCheckedAt(data.checkedAt);
    } catch (failure) { setError(controller.signal.aborted ? 'Przekroczono czas połączenia. Spróbuj ponownie.' : failure instanceof Error ? failure.message : 'Nie udało się sprawdzić Prodigi.'); }
    finally { clearTimeout(timeout); activeRequest.current = null; lock.current = false; setBusy(false); }
  }
  const field = 'min-h-11 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base';
  return <section aria-label="Piaskownica Prodigi" className="min-w-0 space-y-4 rounded-xl border border-amber-700/50 bg-black/15 p-4">
    <div><h5 className="font-semibold text-white">Prodigi — sprawdzenie wariantów i kosztów</h5><p className="mt-1 text-sm text-amber-200">Piaskownica · etap przygotowania</p></div>
    <p className="text-sm text-zinc-300">Sprawdź produkt i wycenę dostawy do Polski. Wynik testowy może różnić się od ceny rzeczywistej. Ten panel nie składa zamówień, nie pobiera zdjęć ani danych klientów.</p>
    <p className="text-sm text-zinc-400">Wycena w pierwszym etapie: GLOBAL-CAN-10X10 i GLOBAL-FAP-10X10, jedno pole druku, bez dodatków i wkładek. Inne SKU można sprawdzić informacyjnie; wymagają osobnej kwalifikacji.</p>
    {configured === null && !error && <p role="status" className="text-sm text-zinc-400">Sprawdzam konfigurację…</p>}
    {configured === false && <p role="status" className="break-words text-sm text-amber-200 [overflow-wrap:anywhere]">Dodaj klucz PRODIGI_SANDBOX_API_KEY w ustawieniach serwera i odśwież stronę. Nie wklejaj go do przeglądarki ani treści sklepu.</p>}
    <div className="grid min-w-0 gap-3 lg:grid-cols-[1fr_auto]"><label className="text-sm text-zinc-300">SKU z katalogu Prodigi<input className={field} value={sku} maxLength={100} disabled={busy} onChange={event => { setSku(event.target.value); setProduct(null); setQuotes([]); setCheckedAt(''); }} /></label><button type="button" disabled={busy || configured !== true || !sku.trim()} onClick={() => void inspect('product')} className="min-h-11 self-end rounded-lg border border-zinc-600 px-4 disabled:opacity-50">{busy ? 'Sprawdzam…' : 'Sprawdź produkt'}</button></div>
    {product && <div className="space-y-3"><p className="break-words text-sm text-zinc-200">{product.sku} · {product.description}</p>
      {variants.length === 0 ? <p className="text-sm text-amber-200">API nie wykazało wariantu wysyłanego do Polski.</p> : <>
        <div className="grid min-w-0 gap-3 lg:grid-cols-[1fr_120px]"><label className="min-w-0 text-sm text-zinc-300">Wariant<select className={field} disabled={busy} value={variant} onChange={event => { setVariant(event.target.value); setQuotes([]); setCheckedAt(''); }}>{variants.map((item, index) => <option key={index} value={index}>{Object.entries(item.attributes).map(([key, value]) => `${key}: ${value}`).join(', ') || 'Podstawowy'}</option>)}</select></label><label className="text-sm text-zinc-300">Ilość<input type="number" min="1" max="100" step="1" disabled={busy} value={copies} className={field} onChange={event => { setCopies(event.target.value); setQuotes([]); setCheckedAt(''); }} /></label></div>
        <button type="button" disabled={busy || !isProdigiPilotSku(product.sku)} onClick={() => void inspect('quote')} className="min-h-11 rounded-lg bg-emerald-700 px-4 font-medium text-white disabled:opacity-50">Pobierz wycenę testową</button>
      </>}
    </div>}
    {error && <p role="alert" className="text-sm text-red-200">{error}</p>}
    {quotes.length > 0 && <div role="status" className="space-y-3">{quotes.map((quote, index) => <div key={index} className="rounded-lg border border-zinc-700 p-3 text-sm"><h6 className="font-semibold text-white">{quote.shipmentMethod}</h6><p className="mt-1 text-zinc-200">Produkty: {quote.costSummary.items.amount} PLN · dostawa: {quote.costSummary.shipping.amount} PLN</p>{quote.shipments.map((shipment, i) => <p key={i} className="mt-1 break-words text-zinc-400">Paczka {i + 1}: {shipment.carrier.name} / {shipment.carrier.service} · kraj produkcji: {shipment.fulfillmentLocation.countryCode}</p>)}</div>)}<p className="text-sm text-amber-200">To kwoty API, a nie potwierdzony pełny koszt ani cena dla klienta. Podatki, import, przewalutowanie i warunki śledzenia wymagają osobnego sprawdzenia. Przewoźnik z wyceny jest przewidywany; Paczkomaty nie są tu zakwalifikowane.</p></div>}
    {checkedAt && <p className="text-xs text-zinc-400">Odczyt: {new Date(checkedAt).toLocaleString('pl-PL')}</p>}
    <p className="text-xs text-zinc-400">Następny etap: kwalifikacja kosztów i próbek. Zamówienia będą obsługiwane w Rezerwacje → Zamówienia, z buforem oczekującym na sesję i akceptację zdjęcia.</p>
  </section>;
}
