'use client';
import { useEffect, useState } from 'react';
import type { ShopMetadata } from '@/lib/galleries/merchandise';
import { fulfillmentLabel, orderAccountPath, orderDeliveryLabel, orderLineDetails, orderMoney, paymentLabel, safeOrderImage } from '@/lib/galleries/order-presentation';

type Order = {id:number;createdAt:string;paymentStatus:string;total:number;metadata:ShopMetadata;photos:{id:number;url:string|null}[]};
export default function AccountOrders({token}:{token:string}) {
  const [orders,setOrders] = useState<Order[]>([]);
  const [error,setError] = useState('');
  const [loading,setLoading] = useState(true);
  const [attempt,setAttempt] = useState(0);
  const [nextCursor,setNextCursor] = useState<number|null>(null);
  const [cursor,setCursor] = useState<number|null>(null);
  const [selected,setSelected] = useState(() => typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('order') || '');
  useEffect(() => {
    let stopped = false; let timer: ReturnType<typeof setTimeout> | undefined; let polls = 0;
    const controller = new AbortController();
    async function load() {
      try {
        const query = selected ? `?order=${encodeURIComponent(selected)}` : cursor ? `?before=${cursor}` : '';
        const response = await fetch(`/api/account/orders${query}`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal:controller.signal});
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Nie udało się pobrać zamówień.');
        if (stopped) return;
        setOrders(data.orders);setNextCursor(data.nextCursor);setError('');setLoading(false);
        if (selected && data.orders.some((o:Order)=>['pending','initializing'].includes(o.paymentStatus)) && polls++ < 12) timer = setTimeout(load,5000);
      } catch (e) { if (!stopped) {setError(e instanceof Error ? e.message : 'Błąd połączenia.');setLoading(false);} }
    }
    setLoading(true);void load();
    return () => {stopped=true;controller.abort();clearTimeout(timer);};
  },[token,selected,cursor,attempt]);
  return <section aria-label="Moje zamówienia" className="space-y-6 pb-12">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold">Moje zamówienia</h2><button className="min-h-11 rounded-xl border border-zinc-600 px-4" onClick={()=>setAttempt(a=>a+1)}>Odśwież status</button></div>
    {selected && <button className="min-h-11 text-gold-400 underline" onClick={()=>{setSelected('');setCursor(null);window.history.replaceState(null,'','/konto?tab=orders');}}>Wszystkie zamówienia</button>}
    {error && <p role="alert" className="rounded-xl border border-red-500 bg-red-950 p-4">{error}</p>}
    {loading ? <p role="status">Ładowanie zamówień…</p> : !error && !orders.length ? <p>Nie masz jeszcze zamówień produktów na tym koncie.</p> : orders.map(order=><article key={order.id} className="overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900">
      <header className="border-b border-zinc-700 p-5"><a className="text-xl font-bold text-gold-400 underline" href={orderAccountPath(order.id)} data-preview-kind="order" data-preview-id={order.id}>Zamówienie #{order.id}</a><p className="mt-1 text-sm text-zinc-400">{new Date(order.createdAt).toLocaleString('pl-PL')}</p><p role="status" className="mt-3 font-semibold">{paymentLabel(order.paymentStatus)}</p>{order.paymentStatus==='paid' && <p>{fulfillmentLabel(order.metadata.fulfillment.status)}</p>}{order.paymentStatus==='pending' && <p className="mt-2 text-sm text-zinc-300">Jeśli zapłaciłeś, nie płać ponownie. Czekamy na potwierdzenie od operatora; status odświeża się automatycznie przez minutę.</p>}</header>
      <div className="divide-y divide-zinc-700">{order.metadata.lines.map(line=><div key={line.id} className="p-5">
        <div className="flex items-start gap-4">{line.kind==='product' && safeOrderImage(line.product?.image_url) && <img src={safeOrderImage(line.product?.image_url)!} alt={line.title} width={88} height={88} className="h-24 w-24 shrink-0 rounded-lg object-contain bg-white" loading="lazy" />}<div className="min-w-0"><h3 className="font-semibold">{line.title}</h3><p className="mt-1 text-sm text-zinc-300">{orderLineDetails(line)}</p><p className="mt-2">{line.quantity} szt. × {orderMoney(line.unitAmount)}</p><p className="font-bold text-gold-400">Wartość: {orderMoney(line.lineTotal)}</p></div></div>
        <details className="mt-3"><summary className="min-h-11 cursor-pointer py-2 text-sm">Wybrane zdjęcia{line.kind==='product' ? ` (${line.photoIds.length})` : ''}</summary><div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{(line.kind==='print'?[line.photoId]:line.photoIds).map(id=>{const photo=order.photos.find(p=>p.id===id);return <figure key={id}>{photo?.url ? <img src={photo.url} alt={`Zdjęcie #${id}`} width={100} height={100} loading="lazy" className="aspect-square w-full rounded-lg object-cover" /> : <div className="rounded-lg bg-zinc-800 p-3 text-xs">Podgląd niedostępny</div>}<figcaption className="py-1 text-xs">#{id}{line.kind==='product' && id===line.coverPhotoId ? ' · okładka' : ''}</figcaption></figure>;})}</div></details>
      </div>)}</div>
      <footer className="space-y-2 border-t border-zinc-700 bg-black/20 p-5"><p>{order.metadata.delivery.recipientName}</p><p>{orderDeliveryLabel(order.metadata)}</p><p>Dostawa: {orderMoney(order.metadata.delivery.amount)}</p><p className="text-xl font-bold">Razem: {orderMoney(order.total)}</p>{order.metadata.fulfillment.trackingNumber && <p>Numer przesyłki: {order.metadata.fulfillment.trackingNumber}</p>}</footer>
    </article>)}
    {nextCursor && !loading && <button className="min-h-11 rounded-xl border border-zinc-600 px-4" onClick={()=>setCursor(nextCursor)}>Starsze zamówienia</button>}
  </section>;
}
