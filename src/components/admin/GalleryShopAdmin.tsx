'use client';

import { useCallback, useEffect, useState } from 'react';
import { getApiUrl } from '@/lib/api-config';

import { validateShopConfig, type PrintFormat, type ShopConfig } from '@/lib/galleries/merchandise';
type Product = { id: number; title: string; description?: string | null; image_url?: string | null; price: number; is_active: boolean };
type Photo = { id: number; file_url: string; thumbnail_url?: string | null };
type Album = { id: number; title: string; format?: string | null };
type Order = { id: number; created_at: string; total_amount: number; payment_status: string; metadata?: any; product_ids?: string | null };
const inputClass = 'mt-1 w-full min-h-11 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400';
const buttonClass = 'min-h-11 rounded-lg border border-zinc-600 px-4 py-2 text-sm font-semibold hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50';
const money = (amount: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(amount / 100);
const amountFromInput = (value: string) => value === '' ? NaN : Math.round(Number(value.replace(',', '.')) * 100);
const moneyValue = (value: number) => Number.isFinite(value) ? value / 100 : '';
const validAmount = (value: number) => Number.isSafeInteger(value) && value >= 0 && value <= 100000000;

export default function GalleryShopAdmin({ galleryId, photos = [] }: { galleryId: number; photos?: Photo[] }) {
    const [config, setConfig] = useState<ShopConfig | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [tab, setTab] = useState<'offer' | 'orders'>('offer');
    const [albumId, setAlbumId] = useState('');
    const [albumPrice, setAlbumPrice] = useState('');
    const [dirty, setDirty] = useState(false);
    const base = `admin/galleries/${galleryId}/shop`;
    const request = useCallback(async (path: string, init?: RequestInit) => {
        const response = await fetch(getApiUrl(path), { credentials: 'include', ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
        const data = await response.json();
        if (!response.ok || data.success === false) throw new Error(data.error || 'Nie udało się zapisać zmian. Spróbuj ponownie.');
        return data;
    }, []);
    const load = useCallback(async () => {
        const data = await request(base);
        setConfig(data.config); setProducts(data.products || []); setAlbums(data.nphotoAlbums || []); setOrders(data.orders || []); setDirty(false);
    }, [base, request]);
    useEffect(() => { let active = true; setLoading(true); load().catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [load]);
    useEffect(() => {
        const handler = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
        window.addEventListener('beforeunload', handler); return () => window.removeEventListener('beforeunload', handler);
    }, [dirty]);
    const update = (patch: Partial<ShopConfig>) => { setConfig(current => current ? { ...current, ...patch } : null); setDirty(true); setNotice(''); };
    const run = async (action: () => Promise<void>, message: string) => {
        if (busy) return; setBusy(true); setError(''); setNotice('');
        try { await action(); setNotice(message); } catch (e) { setError(e instanceof Error ? e.message : 'Błąd połączenia'); } finally { setBusy(false); }
    };
    const save = () => run(async () => {
        if (!config) return;
        if (!config.title.trim() || !config.buttonLabel.trim()) throw new Error('Uzupełnij nagłówek i tekst przycisku.');
        if (config.formats.some(f => !f.label.trim() || !f.paper.trim() || !validAmount(f.unitAmount) || f.unitAmount === 0 || !Number.isInteger(f.widthMm) || f.widthMm < 1 || !Number.isInteger(f.heightMm) || f.heightMm < 1)) throw new Error('Każdy format wymaga nazwy, dodatniej ceny i wymiarów w pełnych milimetrach.');
        if (Object.values(config.productRules).some(r => !Number.isInteger(r.minPhotos) || !Number.isInteger(r.maxPhotos) || r.minPhotos < 1 || r.maxPhotos < r.minPhotos)) throw new Error('Sprawdź minimalną i maksymalną liczbę zdjęć w produktach.');
        if (Object.values(config.delivery).some(d => !validAmount(d.amount))) throw new Error('Podaj poprawne ceny dostawy.');
        const checkedConfig = validateShopConfig(config);
        await request(base, { method: 'PUT', body: JSON.stringify({ config: checkedConfig }) });
        const data = await request(base); setConfig(data.config); setDirty(false);
    }, 'Zapisano i ponownie odczytano ustawienia sklepu.');
    if (loading) return <section className="rounded-2xl border border-zinc-800 p-6" aria-busy="true">Wczytywanie sklepu galerii…</section>;
    if (!config) return <section className="rounded-2xl border border-red-800 p-6"><p role="alert">{error || 'Nie udało się wczytać ustawień.'}</p><button type="button" className={buttonClass} onClick={() => run(load, 'Wczytano ustawienia.')}>Spróbuj ponownie</button></section>;
    const editFormat = (index: number, patch: Partial<PrintFormat>) => update({ formats: config.formats.map((f, i) => i === index ? { ...f, ...patch } : f) });
    return <section aria-label="Sklep prywatnej galerii" className="w-full min-w-0 space-y-5 rounded-2xl border border-zinc-700 bg-zinc-900/60 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="text-xl font-bold text-white">Sklep prywatnej galerii</h3><p className="mt-1 text-sm text-zinc-300">Twoje ceny, odbitki i produkty. Realizacja: nPhoto → Foto-Dron → klient.</p></div><div className="flex flex-wrap gap-2"><button type="button" aria-pressed={tab === 'offer'} className={buttonClass} onClick={() => setTab('offer')}>Oferta i dostawa</button><button type="button" aria-pressed={tab === 'orders'} className={buttonClass} onClick={() => setTab('orders')}>Zamówienia ({orders.length})</button></div></div>
        {error && <p role="alert" className="rounded-lg bg-red-950 p-3 text-red-100">{error}</p>}
        {notice && <p role="status" className="rounded-lg bg-emerald-950 p-3 text-emerald-100">{notice}</p>}
        {dirty && <p className="text-sm text-amber-300">Masz niezapisane ustawienia oferty. Zapisz je przed opuszczeniem strony.</p>}
        {tab === 'offer' ? <div className="space-y-6">
            <fieldset disabled={busy} className="space-y-4"><legend className="mb-3 font-semibold text-white">Widoczność i treści</legend>
                <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={config.enabled} onChange={e => update({ enabled: e.target.checked })} />Sklep aktywny</label>
                <div className="grid gap-4 lg:grid-cols-2"><label className="text-sm">Nagłówek sklepu<input className={inputClass} value={config.title} maxLength={160} onChange={e => update({ title: e.target.value })} /></label><label className="text-sm">Tekst przycisku<input className={inputClass} value={config.buttonLabel} maxLength={80} onChange={e => update({ buttonLabel: e.target.value })} /></label></div>
                <label className="block text-sm">Opis sklepu<textarea className={inputClass} value={config.introduction} maxLength={2000} rows={3} onChange={e => update({ introduction: e.target.value })} /></label>
            </fieldset>
            <fieldset disabled={busy} className="space-y-3"><legend className="mb-3 font-semibold text-white">Formaty odbitek i ceny za sztukę</legend>
                <p className="text-sm text-zinc-400">Klient może nadać ten sam format i liczbę sztuk wielu zaznaczonym zdjęciom. Zmiana cennika nie zmienia wcześniej złożonych zamówień.</p>
                {config.formats.map((format, index) => <div key={format.id} className="grid items-end gap-3 rounded-xl border border-zinc-700 p-3 sm:grid-cols-2 xl:grid-cols-7">
                    <label className="text-sm">Format {index + 1} nazwa<input className={inputClass} value={format.label} onChange={e => editFormat(index, { label: e.target.value })} /></label>
                    <label className="text-sm">Format {index + 1} szerokość (mm)<input className={inputClass} type="number" min="1" step="1" value={Number.isFinite(format.widthMm) ? format.widthMm : ''} onChange={e => editFormat(index, { widthMm: e.target.value === '' ? NaN : Number(e.target.value) })} /></label>
                    <label className="text-sm">Format {index + 1} wysokość (mm)<input className={inputClass} type="number" min="1" step="1" value={Number.isFinite(format.heightMm) ? format.heightMm : ''} onChange={e => editFormat(index, { heightMm: e.target.value === '' ? NaN : Number(e.target.value) })} /></label>
                    <label className="text-sm">Format {index + 1} cena (zł)<input className={inputClass} type="number" min="0.01" step="0.01" value={moneyValue(format.unitAmount)} onChange={e => editFormat(index, { unitAmount: amountFromInput(e.target.value) })} /></label>
                    <label className="text-sm">Format {index + 1} papier<input className={inputClass} value={format.paper} onChange={e => editFormat(index, { paper: e.target.value })} /></label>
                    <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={format.active} onChange={e => editFormat(index, { active: e.target.checked })} />Format {index + 1} aktywny</label>
                    <button type="button" className={buttonClass} onClick={() => update({ formats: config.formats.filter((_, i) => i !== index) })}>Usuń format {index + 1}</button>
                </div>)}
                <button type="button" className={buttonClass} onClick={() => update({ formats: [...config.formats, { id: `format-${Date.now()}`, label: '', widthMm: 100, heightMm: 150, unitAmount: 0, active: false, paper: 'mat' }] })}>Dodaj format</button>
            </fieldset>
            <fieldset disabled={busy} className="space-y-3"><legend className="mb-3 font-semibold text-white">Dostawa od Foto-Dron do klienta</legend>
                <p className="text-sm text-amber-200">Wybór dostawy i dane klienta zapisują się w zamówieniu. Nadanie, etykiety i śledzenie InPost nie są jeszcze połączone z API — przesyłkę nadajesz samodzielnie.</p>
                <div className="grid gap-4 sm:grid-cols-2">{(['locker', 'courier'] as const).map(key => { const label = key === 'locker' ? 'Paczkomat' : 'Kurier'; return <div key={key} className="rounded-xl border border-zinc-700 p-4"><label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={config.delivery[key].enabled} onChange={e => update({ delivery: { ...config.delivery, [key]: { ...config.delivery[key], enabled: e.target.checked } } })} />{label} dostępny</label><label className="text-sm">Cena dostawy {label} (zł)<input className={inputClass} type="number" min="0" step="0.01" value={moneyValue(config.delivery[key].amount)} onChange={e => update({ delivery: { ...config.delivery, [key]: { ...config.delivery[key], amount: amountFromInput(e.target.value) } } })} /></label></div>; })}</div>
            </fieldset>
            <div className="sticky bottom-2 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-950 p-3"><button type="button" disabled={busy || !dirty} onClick={save} className="min-h-11 rounded-lg bg-amber-400 px-5 py-2 font-bold text-black disabled:opacity-50">{busy ? 'Zapisywanie…' : 'Zapisz ustawienia sklepu'}</button><span className="text-sm text-zinc-400">Ceny w PLN. Publikacja dotyczy tej prywatnej galerii.</span></div>
            <div className="space-y-4 border-t border-zinc-700 pt-5"><h4 className="font-semibold text-white">Produkty nPhoto w tej galerii</h4><p className="text-sm text-zinc-400">Wybierz produkt z istniejącego katalogu i nadaj własną cenę. To lokalny katalog — automatyczny import sklepu nPhoto nie jest podłączony.</p>
                <div className="grid items-end gap-3 lg:grid-cols-3"><label className="text-sm">Produkt z katalogu<select className={inputClass} value={albumId} onChange={e => setAlbumId(e.target.value)}><option value="">Wybierz produkt</option>{albums.map(a => <option key={a.id} value={a.id}>{a.title}{a.format ? ` · ${a.format}` : ''}</option>)}</select></label><label className="text-sm">Twoja cena produktu (zł)<input className={inputClass} type="number" min="0.01" step="0.01" value={albumPrice} onChange={e => setAlbumPrice(e.target.value)} /></label><button type="button" className={buttonClass} disabled={busy || !albumId || dirty} onClick={() => run(async () => { const price = amountFromInput(albumPrice); if (!validAmount(price) || price === 0) throw new Error('Podaj dodatnią cenę produktu.'); await request(`${base}/products`, { method: 'POST', body: JSON.stringify({ nphotoAlbumId: Number(albumId), price }) }); await load(); setAlbumId(''); setAlbumPrice(''); }, 'Dodano produkt do prywatnej galerii.')}>Dodaj produkt do galerii</button></div>
                {dirty && <p className="text-sm text-amber-300">Zapisz ustawienia przed dodaniem produktu.</p>}
                {!products.length && <p className="text-sm text-zinc-300">Nie przypisano produktów do tej galerii.</p>}
                <div className="grid items-start gap-4 xl:grid-cols-2">{products.map(product => <ProductEditor key={product.id} product={product} disabled={busy} rule={config.productRules[String(product.id)] || { minPhotos: 1, maxPhotos: 50 }} onRule={rule => update({ productRules: { ...config.productRules, [product.id]: rule } })} onSave={patch => run(async () => { const data = await request(`${base}/products/${product.id}`, { method: 'PATCH', body: JSON.stringify(patch) }); setProducts(current => current.map(p => p.id === product.id ? (data.product || { ...p, ...patch }) : p)); }, 'Zapisano produkt.')} />)}</div>
            </div>
        </div> : <div className="space-y-4"><div className="flex flex-wrap justify-between gap-3"><p className="text-sm text-zinc-300">Zamówienia fizyczne. Status płatności jest tylko do odczytu.</p><button type="button" className={buttonClass} disabled={busy} onClick={() => run(async () => { const data = await request(base); setOrders(data.orders || []); }, 'Odświeżono zamówienia.')}>Odśwież zamówienia</button></div>{orders.length === 0 && <p className="rounded-lg border border-zinc-700 p-5">Brak zamówień fizycznych w tej galerii.</p>}{orders.map(order => <OrderDetails key={order.id} order={order} photos={photos} disabled={busy} onSave={(status, trackingNumber) => run(async () => { await request(`${base}/orders/${order.id}`, { method: 'PATCH', body: JSON.stringify({ status, trackingNumber }) }); const data = await request(base); setOrders(data.orders || []); }, 'Zapisano etap realizacji.')} />)}</div>}
    </section>;
}

function ProductEditor({ product, rule, disabled, onRule, onSave }: { product: Product; rule: { minPhotos: number; maxPhotos: number }; disabled: boolean; onRule: (value: { minPhotos: number; maxPhotos: number }) => void; onSave: (patch: Product) => void }) {
    const [draft, setDraft] = useState(product);
    const [validation, setValidation] = useState('');
    useEffect(() => { setDraft(product); }, [product]);
    return <fieldset disabled={disabled} className="space-y-3 rounded-xl border border-zinc-700 p-4"><legend className="px-2 font-semibold">Produkt #{product.id} — {product.title}</legend>
        <label className="block text-sm">Nazwa produktu #{product.id}<input className={inputClass} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></label>
        <label className="block text-sm">Opis produktu #{product.id}<textarea className={inputClass} value={draft.description || ''} onChange={e => setDraft({ ...draft, description: e.target.value })} /></label>
        <label className="block text-sm">Adres zdjęcia produktu #{product.id}<input className={inputClass} type="url" value={draft.image_url || ''} onChange={e => setDraft({ ...draft, image_url: e.target.value })} /></label>
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Cena produktu #{product.id} (zł)<input className={inputClass} type="number" min="0.01" step="0.01" value={moneyValue(draft.price)} onChange={e => setDraft({ ...draft, price: amountFromInput(e.target.value) })} /></label><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={draft.is_active} onChange={e => setDraft({ ...draft, is_active: e.target.checked })} />Produkt #{product.id} widoczny</label></div>
        {validation && <p role="alert" className="text-red-300">{validation}</p>}
        <button type="button" className={buttonClass} onClick={() => { if (!draft.title.trim() || !validAmount(draft.price) || draft.price === 0) { setValidation('Uzupełnij nazwę i dodatnią cenę produktu.'); return; } if (draft.image_url && !/^https?:\/\//i.test(draft.image_url)) { setValidation('Adres zdjęcia musi zaczynać się od https:// lub http://.'); return; } setValidation(''); onSave(draft); }}>Zapisz produkt #{product.id}</button>
        <div className="grid gap-3 border-t border-zinc-700 pt-3 sm:grid-cols-2"><label className="text-sm">Produkt #{product.id} minimum zdjęć<input className={inputClass} type="number" min="1" step="1" value={Number.isFinite(rule.minPhotos) ? rule.minPhotos : ''} onChange={e => onRule({ ...rule, minPhotos: e.target.value === '' ? NaN : Number(e.target.value) })} /></label><label className="text-sm">Produkt #{product.id} maksimum zdjęć<input className={inputClass} type="number" min="1" step="1" value={Number.isFinite(rule.maxPhotos) ? rule.maxPhotos : ''} onChange={e => onRule({ ...rule, maxPhotos: e.target.value === '' ? NaN : Number(e.target.value) })} /></label></div><p className="text-xs text-zinc-400">Limity zdjęć zapisuje przycisk „Zapisz ustawienia sklepu”.</p>
    </fieldset>;
}

function OrderDetails({ order, photos, disabled, onSave }: { order: Order; photos: Photo[]; disabled: boolean; onSave: (status: string, trackingNumber: string) => void }) {
    let meta = order.metadata;
    if (!meta && order.product_ids) { try { meta = JSON.parse(order.product_ids); } catch { /* Preserve read access to legacy data. */ } }
    meta = meta || {};
    const currentStatus = meta.fulfillment?.status || 'new';
    const currentTracking = meta.fulfillment?.trackingNumber || '';
    const [status, setStatus] = useState(currentStatus);
    const [tracking, setTracking] = useState(currentTracking);
    useEffect(() => { setStatus(currentStatus); setTracking(currentTracking); }, [currentStatus, currentTracking]);
    const stages = [{ id: 'new', label: 'Nowe' }, { id: 'ordered', label: 'Zamówione u producenta' }, { id: 'received', label: 'Odebrane w Foto-Dron' }, { id: 'packed', label: 'Spakowane' }, { id: 'shipped', label: 'Wysłane do klienta' }];
    const stageIndex = stages.findIndex(stage => stage.id === currentStatus);
    const availableStages = stages.filter((_, index) => index === stageIndex || index === stageIndex + 1);
    const canFulfill = order.payment_status === 'paid';
    const lines = Array.isArray(meta.lines) ? meta.lines : [];
    const recipient = meta.recipient || meta.customer || {};
    const delivery = meta.delivery || {};
    return <details className="rounded-xl border border-zinc-700 p-4"><summary className="cursor-pointer text-white"><span className="font-semibold">Zamówienie #{order.id} · {money(order.total_amount)}</span><span className="ml-3 text-sm text-zinc-300">{new Date(order.created_at).toLocaleDateString('pl-PL')} · płatność: {order.payment_status}</span></summary><div className="mt-4 space-y-4">
        <div className="grid gap-4 lg:grid-cols-2"><div><h5 className="font-semibold">Klient i dostawa</h5><p className="whitespace-pre-line break-words text-sm text-zinc-300">{[delivery.recipientName || recipient.name, delivery.email || recipient.email, delivery.phone || recipient.phone, delivery.method === 'locker' ? 'InPost Paczkomat' : delivery.method === 'courier' ? 'Kurier' : delivery.method, delivery.pointCode, delivery.address?.street, delivery.address?.postalCode, delivery.address?.city].filter(Boolean).join('\n') || 'Dane dostawy dostępne w szczegółach zamówienia.'}</p></div><div className="text-sm text-zinc-300"><p>Etap 1: nPhoto → Foto-Dron (zamawiasz i odbierasz).</p><p>Etap 2: kontrola, pakowanie → klient (nadajesz samodzielnie).</p><p>Koszt dostawy do klienta: {money(delivery.amount || 0)}</p><p className="mt-2">API InPost niepodłączone. Poniżej zapisujesz własny numer przesyłki.</p></div></div>
        <div className="space-y-3">{lines.map((line: any, index: number) => <div key={line.id || index} className="rounded-lg bg-zinc-950 p-3"><div className="mb-2 flex flex-wrap gap-2">{(line.photoIds || (line.photoId ? [line.photoId] : [])).map((photoId: number) => { const photo = photos.find(p => p.id === photoId); return <div key={photoId} className="w-20 text-center">{photo && <img loading="lazy" src={photo.thumbnail_url || photo.file_url} alt={`Zdjęcie ${photoId}`} className="h-20 w-20 rounded object-contain" />}<span className="text-xs text-zinc-400">#{photoId}{line.coverPhotoId === photoId ? " · okładka" : ""}</span></div>; })}</div><p className="font-semibold">{line.title || (line.kind === 'print' ? 'Odbitka' : 'Produkt')} · {line.quantity} szt. · {money(line.lineTotal ?? line.unitAmount * line.quantity)}</p><p className="text-sm text-zinc-300">{[line.formatLabel || line.format?.label || line.formatId, line.paper || line.format?.paper, line.fit, line.photoId ? `Zdjęcie #${line.photoId}` : '', line.coverPhotoId ? `Okładka #${line.coverPhotoId}` : ''].filter(Boolean).join(' · ')}</p>{line.photoIds?.length > 0 && <p className="break-words text-sm text-zinc-300">Kolejność zdjęć: {line.photoIds.join(', ')}</p>}{line.crop && <p className="text-xs text-zinc-400">Kadr: {JSON.stringify(line.crop)}</p>}</div>)}</div>
        <p className="text-sm text-zinc-300">{canFulfill ? 'Zapisuj etapy po kolei. Przed wysyłką uzupełnij numer przesyłki.' : 'Realizacja jest dostępna po potwierdzeniu płatności.'}</p>
        <fieldset disabled={disabled || !canFulfill} className="grid items-end gap-3 lg:grid-cols-3"><label className="text-sm">Etap zamówienia #{order.id}<select className={inputClass} value={status} onChange={e => setStatus(e.target.value)}>{availableStages.map(stage => <option key={stage.id} value={stage.id}>{stage.label}</option>)}</select></label><label className="text-sm">Numer przesyłki #{order.id}<input className={inputClass} value={tracking} maxLength={100} onChange={e => setTracking(e.target.value)} /></label><button type="button" className={buttonClass} disabled={!canFulfill || (status === 'shipped' && !tracking.trim())} onClick={() => { if (canFulfill) onSave(status, tracking); }}>Zapisz etap zamówienia #{order.id}</button></fieldset>
    </div></details>;
}
