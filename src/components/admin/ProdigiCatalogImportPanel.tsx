'use client';
import { useRef, useState } from 'react';
import { calculateProdigiPrice, decimalCents, formatCents } from '@/lib/fulfillment/prodigi-pricing';
import type { SandboxProduct, SandboxQuote } from '@/lib/fulfillment/prodigi-sandbox';
import type { ProdigiFxRate } from '@/lib/fulfillment/prodigi-fx';

type Estimate = { quote: SandboxQuote; fx: ProdigiFxRate; pln: { amount: string }; plnCosts?: Record<string, { amount: string } | null>; checkedAt: string };
const field = 'mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3';
export default function ProdigiCatalogImportPanel({ onImported, disabled = false, onBusyChange, customerDeliveryAmount = 0, onDeliveryChange, hasUnsavedChanges = false }: { onImported: () => Promise<void>; disabled?: boolean; onBusyChange?: (busy: boolean) => void; customerDeliveryAmount?: number; onDeliveryChange?: (amount: number) => void; hasUnsavedChanges?: boolean }) {
  const [sku, setSku] = useState('GLOBAL-FAP-10X10');
  const [product, setProduct] = useState<SandboxProduct | null>(null);
  const [variant, setVariant] = useState(0); const [title, setTitle] = useState('');
  const [copies, setCopies] = useState(1); const [method, setMethod] = useState('Budget');
  const [price, setPrice] = useState(''); const delivery = formatCents(BigInt(customerDeliveryAmount)); const [margin, setMargin] = useState('');
  const [bankFeePercent, setBankFeePercent] = useState('0'); const [bankFeeFixed, setBankFeeFixed] = useState('0');
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState(''); const lock = useRef(false);
  const variants = product?.variants.filter(value => value.shipsTo.includes('PL') && value.printAreaSizes.default) || [];
  const validMoney = (value: string) => /^\d+(?:\.\d{1,2})?$/.test(value) && Number.isFinite(Number(value));
  let suggested: string | null = null; let pricingError = '';
  if (estimate && margin) { try { suggested = calculateProdigiPrice({ supplierTotal: estimate.pln.amount, customerShipping: delivery, copies, marginPercent: margin, bankFeePercent, bankFeeFixed }).unitPrice; } catch (e) { pricingError = e instanceof Error ? e.message : 'Sprawdź kalkulację.'; } }
  const revenue = validMoney(price) && validMoney(delivery) ? Number(price) * copies + Number(delivery) : null;
  async function run(action: 'product' | 'quote' | 'import') {
    if (lock.current || disabled) return;
    if (action === 'import' && hasUnsavedChanges) { setError('Najpierw zapisz ustawienia sklepu, w tym opłatę za dostawę.'); return; }
    if (action !== 'product' && !variants[variant]) { setError('Wybierz wariant.'); return; }
    if (action === 'import' && (!validMoney(price) || Number(price) <= 0 || title.trim().length < 3)) { setError('Podaj nazwę oraz dodatnią cenę sprzedaży PLN.'); return; }
    lock.current = true; setBusy(true); onBusyChange?.(true); setError(''); setMessage('');
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 45_000);
    try {
      const token = localStorage.getItem('admin_token');
      const input = action === 'product' ? { action: 'product', sku } : { sku: product!.sku, attributes: variants[variant].attributes, title: title.trim() || product!.sku, price: action === 'import' ? Math.round(Number(price) * 100) : 1, copies, shipmentMethod: method };
      const response = await fetch('/api/admin/gallery-shop/prodigi-import', { method: 'POST', credentials: 'include', cache: 'no-store', signal: controller.signal, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ action, input }) });
      const data = await response.json(); if (!response.ok || !data.success) throw Error(data.error || 'Nie potwierdzono wyniku.');
      if (action === 'product') { setProduct(data.product); setVariant(0); setEstimate(null); }
      if (action === 'quote') setEstimate(data);
      if (action === 'import') { setMessage(data.existing ? `Produkt #${data.id} już istnieje. Zachowano jego cenę, treści, zdjęcia i archiwum.` : `Zapisano szkic #${data.id}. Uzupełnij zdjęcia i opis w edytorze produktów poniżej. Sandbox nie jest publikowany klientom.`); await onImported(); }
    } catch (e) { setError(controller.signal.aborted ? 'Nie potwierdzono wyniku. Odśwież ofertę przed ponowieniem importu.' : e instanceof Error ? e.message : 'Nie udało się obsłużyć produktu.'); }
    finally { clearTimeout(timeout); lock.current = false; setBusy(false); onBusyChange?.(false); }
  }
  return <details className="rounded-xl border border-zinc-700 p-4"><summary className="min-h-11 cursor-pointer font-semibold">Prodigi — produkty, ceny PLN i import</summary><div className="space-y-4 pt-3">
    <p className="text-sm text-amber-200">Przygotowanie oferty w sandbox. Jeden wariant to jeden edytowalny produkt. Import tworzy ukryty szkic; sprzedaż wymaga osobnej kwalifikacji produkcyjnej.</p>
    <fieldset disabled={busy || disabled} className="space-y-3 disabled:opacity-60">
      <label className="block text-sm">SKU Prodigi<input className={field} value={sku} onChange={e => { setSku(e.target.value); setProduct(null); setEstimate(null); }} /></label>
      <button type="button" className="min-h-11 rounded-lg border px-4" onClick={() => void run('product')}>Odczytaj produkt z API</button>
      {product && <><p className="text-sm">{product.description}</p><label className="block text-sm">Wariant do Polski<select className={field} value={variant} onChange={e => { setVariant(Number(e.target.value)); setEstimate(null); }}>{variants.map((value, index) => <option key={index} value={index}>{Object.entries(value.attributes).map(([k, v]) => `${k}: ${v}`).join(', ') || 'Podstawowy'}</option>)}</select></label>
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Ilość w kalkulacji<input type="number" min="1" max="100" step="1" className={field} value={copies} onChange={e => { setCopies(Number(e.target.value)); setEstimate(null); }} /></label><label className="text-sm">Dostawa Prodigi<select className={field} value={method} onChange={e => { setMethod(e.target.value); setEstimate(null); }}>{['Budget', 'Standard', 'StandardPlus', 'Express', 'Overnight'].map(value => <option key={value}>{value}</option>)}</select></label></div>
      <button type="button" className="min-h-11 rounded-lg border px-4" onClick={() => void run('quote')}>Przelicz koszt i dostawę</button>
      {estimate && <div className="space-y-2 rounded-lg border border-emerald-900 p-3 text-sm">{Object.entries(estimate.quote.costSummary).map(([name, cost]) => cost && <p key={name}>{({ items: 'Produkty', shipping: 'Dostawa', totalTax: 'Podatek', totalCost: 'Razem', branding: 'Branding' } as Record<string,string>)[name]}: {cost.amount} {cost.currency}{estimate.plnCosts?.[name] ? ` · ${estimate.plnCosts[name]?.amount} PLN` : ''}</p>)}<p>Koszt całego koszyka: {estimate.pln.amount} PLN. NBP {estimate.fx.mid}, {estimate.fx.effectiveDate}, tabela {estimate.fx.tableNo}.</p></div>}
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Dostawa płatna przez klienta za koszyk (PLN)<input className={field} inputMode="decimal" type="number" min="0" step="0.01" value={customerDeliveryAmount / 100} onChange={e => { const value = e.target.value.replace(',', '.'); try { onDeliveryChange?.(Number(decimalCents(value || '0'))); } catch { /* wait for a valid monetary input */ } }} /></label><label className="text-sm">Docelowa marża całego koszyka (%)<input className={field} inputMode="decimal" value={margin} onChange={e => setMargin(e.target.value.replace(',', '.'))} /></label></div>
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Prowizja płatności / przewalutowania (%)<input className={field} inputMode="decimal" value={bankFeePercent} onChange={e => setBankFeePercent(e.target.value.replace(',', '.'))} /></label><label className="text-sm">Dodatkowa opłata za koszyk (PLN)<input className={field} inputMode="decimal" value={bankFeeFixed} onChange={e => setBankFeeFixed(e.target.value.replace(',', '.'))} /></label></div>
      {copies !== 1 && <p className="text-sm text-amber-200">Kalkulacja zestawu służy analizie koszyka. Standardowa cena produktu wymaga wyceny jednej sztuki; sklep nie ma progów ilościowych cen produktów.</p>}
      {pricingError && <p role="alert" className="text-sm text-amber-200">{pricingError}</p>}
      {suggested !== null && <p className="text-sm text-emerald-200">Minimalna cena produktu przy tych założeniach: {suggested} PLN/szt. <button type="button" disabled={copies !== 1} className="min-h-11 underline disabled:opacity-40" onClick={() => setPrice(suggested)}>Wstaw do ceny</button></p>}
      <p className="text-xs text-zinc-400">Obniżona opłata za dostawę jest pokrywana ceną produktów. Dostawa klienta liczona raz na koszyk. Marża = (przychód produktów i dostawy − koszt Prodigi) / cały przychód. Uwzględnia wpisane opłaty; pozostałe koszty firmy rozlicz osobno. Opłata klienta pochodzi ze wspólnego cennika kuriera. Zmiana tutaj aktualizuje ten sam formularz ustawień sklepu — zapisz go przed importem.</p>
      <label className="block text-sm">Nazwa produktu w sklepie<input className={field} value={title} maxLength={200} onChange={e => setTitle(e.target.value)} /></label><label className="block text-sm">Cena sprzedaży jednej sztuki (PLN)<input className={field} inputMode="decimal" value={price} onChange={e => setPrice(e.target.value.replace(',', '.'))} /></label>
      {estimate && revenue !== null && revenue > 0 && <p className="text-sm">Nadwyżka koszyka przed prowizjami i pozostałymi kosztami: {(revenue - Number(estimate.pln.amount)).toFixed(2)} PLN · marża {((revenue - Number(estimate.pln.amount)) / revenue * 100).toFixed(1)}%.</p>}
      <button type="button" disabled={!estimate || hasUnsavedChanges || copies !== 1} className="min-h-11 rounded-lg bg-emerald-700 px-4 disabled:opacity-50" onClick={() => void run('import')}>Zapisz produkt jako szkic sandbox</button></>}
    </fieldset>
    {hasUnsavedChanges && <p className="text-sm text-amber-200">Zapisz zmiany przyciskiem „Zapisz ustawienia sklepu” poniżej, aby odblokować import.</p>}
    {busy && <p role="status">Sprawdzam i zapisuję…</p>}{message && <p role="status" className="text-sm text-emerald-200">{message}</p>}{error && <p role="alert" className="text-sm text-red-200">{error}</p>}
  </div></details>;
}
