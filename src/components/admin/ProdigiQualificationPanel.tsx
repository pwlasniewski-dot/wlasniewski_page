'use client';
import { useRef, useState } from 'react';
type Product = { id: number; title: string; product_type?: string | null };
type Review = { qualified: boolean; reviewHash: string; review: { title: string; price: number; sku: string; shippingMethod: string; variant: { attributes: Record<string,string> }; pln: { amount: string }; fx: { mid: string; effectiveDate: string }; quote: { totalCost: { amount: string; currency: string } } } };
export default function ProdigiQualificationPanel({ products, disabled, onQualified }: { products: Product[]; disabled: boolean; onQualified: () => Promise<void> }) {
  const [id, setId] = useState(''); const [result, setResult] = useState<Review | null>(null); const [approved, setApproved] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const lock = useRef(false);
  const candidates = products.filter(product => ['prodigi_sandbox', 'prodigi_live'].includes(product.product_type || ''));
  async function qualify(approve: boolean) {
    if (lock.current || disabled || !id || (approve && (!approved || !result))) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 45_000);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/gallery-shop/prodigi-import', { method: 'POST', credentials: 'include', cache: 'no-store', signal: controller.signal, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ action: 'qualify', input: { productId: Number(id), approve, ...(approve ? { reviewHash: result!.reviewHash } : {}) } }) });
      const data = await response.json(); if (!response.ok || !data.success) throw Error(data.error || 'Nie potwierdzono kwalifikacji.');
      if (approve) { setNotice('Kwalifikacja live zapisana. Produkt pozostaje ukryty; publikację wykonaj w istniejącym edytorze oferty. Nie złożono zamówienia.'); setResult(null); setApproved(false); await onQualified(); }
      else { setResult(data); setApproved(false); }
    } catch (e) { setResult(null); setApproved(false); setError(controller.signal.aborted ? 'Nie potwierdzono wyniku. Odśwież panel przed ponowieniem.' : e instanceof Error ? e.message : 'Błąd kwalifikacji.'); }
    finally { clearTimeout(timeout); lock.current = false; setBusy(false); }
  }
  if (!candidates.length) return null;
  return <details className="rounded-xl border border-zinc-700 p-4"><summary className="min-h-11 cursor-pointer font-semibold">Prodigi — kwalifikacja produktu do sprzedaży live</summary><fieldset disabled={disabled || busy} className="space-y-3 pt-3 disabled:opacity-60">
    <p className="text-sm text-zinc-300">Najpierw zapisz opis, zdjęcie i cenę w istniejącym edytorze produktu. Sprawdzenie pobiera wyłącznie produkt i koszty z API live; nie składa zamówienia. Wymaga serwerowego klucza PRODIGI_API_KEY.</p>
    <label className="block text-sm">Produkt<select value={id} onChange={e => { setId(e.target.value); setResult(null); setApproved(false); }} className="min-h-11 w-full rounded-lg bg-zinc-950 px-3"><option value="">Wybierz produkt</option>{candidates.map(product => <option key={product.id} value={product.id}>#{product.id} — {product.title}</option>)}</select></label>
    <button type="button" disabled={!id} onClick={() => void qualify(false)} className="min-h-11 rounded-lg border px-4">Sprawdź koszt i wariant live</button>
    {result && <div className="space-y-3 rounded-lg border border-amber-700 p-3 text-sm"><p>{result.review.title} · {result.review.sku} · {result.review.shippingMethod}</p><p>{Object.entries(result.review.variant.attributes).map(([key,value]) => `${key}: ${value}`).join(', ')}</p><p>Jedna sztuka z dostawą: {result.review.quote.totalCost.amount} {result.review.quote.totalCost.currency} ≈ {result.review.pln.amount} PLN. Kurs NBP {result.review.fx.mid} z {result.review.fx.effectiveDate}.</p><p>Zapisana cena sprzedaży produktu: {(result.review.price / 100).toFixed(2)} PLN.</p><label className="flex gap-2"><input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)} />Sprawdziłem zdjęcie, opis, wariant, cenę i rentowność. Akceptuję kwalifikację tego produktu do sprzedaży live.</label><button type="button" disabled={!approved} onClick={() => void qualify(true)} className="min-h-11 rounded-lg bg-emerald-700 px-4">Zatwierdź kwalifikację; pozostaw ukryty</button></div>}
  </fieldset>{busy && <p role="status">Sprawdzam API live…</p>}{notice && <p role="status" className="text-sm text-emerald-200">{notice}</p>}{error && <p role="alert" className="text-sm text-red-200">{error}</p>}</details>;
}
