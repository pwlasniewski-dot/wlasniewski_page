'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import GalleryShipmentPanel from '@/components/admin/GalleryShipmentPanel';
import type {ShopMetadata} from '@/lib/galleries/merchandise';

type Order = {id:number;galleryId:number;createdAt:string;total:number;paymentStatus:string;metadata:ShopMetadata};
const paymentLabels: Record<string,string> = {paid:'Opłacone',pending:'Oczekuje na płatność',cancelled:'Płatność anulowana',failed:'Płatność nieudana',failed_init:'Nie rozpoczęto płatności',refunded:'Zwrócone'};
const stageLabels: Record<string,string> = {new:'Nowe',ordered:'Zamówione u producenta',received:'Odebrane w Foto-Dron',packed:'Spakowane',shipped:'Wysłane do klienta'};
const money = (value:number) => new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN'}).format(value/100);
const button = 'inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 bg-white/[0.035] px-4 py-2.5 text-sm font-semibold text-zinc-100 transition hover:border-amber-200/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-40';
const input = 'mt-2 min-h-12 w-full min-w-0 rounded-xl border border-white/15 bg-zinc-950/50 px-3.5 py-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-amber-200/40';
async function request(path:string, init?:RequestInit) {
 const token=localStorage.getItem('admin_token');
 const response=await fetch(`/api/${path}`,{credentials:'include',...init,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`} : {}),...init?.headers}});
 const data=await response.json();
 if(!response.ok||data.success===false)throw Error(data.error||'Nie udało się wczytać danych. Spróbuj ponownie.');
 return data;
}
export default function GalleryOrdersPage() {
 const [orders,setOrders]=useState<Order[]>([]),[nextCursor,setNextCursor]=useState<number|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [query,setQuery]=useState(''),[payment,setPayment]=useState('all'),[stage,setStage]=useState('all');
 const load=useCallback(async(before?:number)=>{setLoading(true);setError('');try {const data=await request(`admin/gallery-shop/orders${before?`?before=${before}`:''}`);setOrders(current=>before?[...current,...data.orders.filter((order:Order)=>!current.some(existing=>existing.id===order.id))]:data.orders);setNextCursor(data.nextCursor||null);}catch(e){setError(e instanceof Error?e.message:'Błąd połączenia.');}finally{setLoading(false);}},[]);
 useEffect(()=>{void load();},[load]);
 const filtered=useMemo(()=>orders.filter(order=>{
  const d=order.metadata.delivery;const terms=[order.id,order.galleryId,d.recipientName,d.email,d.phone,d.pointCode,order.metadata.fulfillment.trackingNumber,...order.metadata.lines.map(line=>line.title)].filter(Boolean).join(' ').toLocaleLowerCase('pl');
  return (payment==='all'||order.paymentStatus===payment)&&(stage==='all'||order.metadata.fulfillment.status===stage)&&terms.includes(query.trim().toLocaleLowerCase('pl'));
 }),[orders,query,payment,stage]);
 const paid=orders.filter(order=>order.paymentStatus==='paid');
 return <main className="mx-auto w-full max-w-screen-2xl space-y-6 p-4 text-zinc-200 sm:p-8">
  <header className="flex flex-wrap items-start justify-between gap-5"><div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/80">Realizacja zamówień</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Zamówienia i przesyłki</h1><p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">Wszystkie galerie w jednym miejscu. Sprawdź wybór klienta, przygotuj pliki dla producenta i nadaj gotową paczkę.</p></div><Link href="/admin/gallery-shop" className={button}>Oferta i cennik</Link></header>
  <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-4 text-sm"><span><strong className="text-white">{orders.length}</strong> wczytanych zamówień</span><span><strong className="text-amber-100">{paid.filter(order=>order.metadata.fulfillment.status!=='shipped').length}</strong> opłaconych do realizacji</span><span className="text-zinc-400">Najpierw najnowsze</span></div>
  <section aria-label="Filtry zamówień" className="grid gap-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-[2fr_1fr_1fr_auto]">
   <label className="text-sm">Szukaj zamówienia<input type="search" className={input} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Numer, klient, e-mail lub produkt"/></label>
   <label className="text-sm">Płatność<select className={input} value={payment} onChange={e=>setPayment(e.target.value)}><option value="all">Wszystkie płatności</option>{Object.entries(paymentLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
   <label className="text-sm">Etap realizacji<select className={input} value={stage} onChange={e=>setStage(e.target.value)}><option value="all">Wszystkie etapy</option>{Object.entries(stageLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
   <button type="button" disabled={loading} className={`${button} self-end`} onClick={()=>load()}>{loading?'Wczytywanie…':'Odśwież zamówienia'}</button>
  </section>
  {error&&<p role="alert" className="rounded-xl border border-red-300/20 bg-red-900/20 p-4 text-sm text-red-100">{error}</p>}
  <div aria-live="polite" className="text-sm text-zinc-400">{loading&&!orders.length?'Wczytywanie zamówień…':`Widoczne: ${filtered.length} z ${orders.length} wczytanych.`}{nextCursor&&' Filtry dotyczą wczytanej listy. Starsze zamówienia doładujesz poniżej.'}</div>
  {!loading&&!filtered.length&&<div className="rounded-2xl border border-dashed border-white/15 px-5 py-12 text-center"><h2 className="text-lg font-semibold text-white">{orders.length?'Brak wyników dla tych filtrów':'Tutaj pojawią się zamówienia z galerii'}</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">{orders.length?'Zmień wyszukiwanie lub doładuj starsze zamówienia.':'Po zakupie zobaczysz zdjęcia, formaty, liczbę sztuk oraz dane odbiorcy. Wspólną ofertą zarządzasz w zakładce Oferta galerii.'}</p>{orders.length>0&&<button type="button" className={`${button} mt-4`} onClick={()=>{setQuery('');setPayment('all');setStage('all');}}>Wyczyść filtry</button>}</div>}
  <section aria-label="Lista zamówień" className="space-y-4">{filtered.map(order=><OrderCard key={order.id} order={order}/>)}</section>
  {nextCursor&&<div className="flex justify-center pb-5"><button type="button" disabled={loading} className={button} onClick={()=>load(nextCursor)}>{loading?'Wczytywanie…':'Wczytaj starsze zamówienia'}</button></div>}
 </main>;
}
function OrderCard({order}:{order:Order}) {
 const d=order.metadata.delivery;const paid=order.paymentStatus==='paid';
 return <details className="group overflow-hidden rounded-2xl border border-white/10 bg-[#171719]">
  <summary className="cursor-pointer p-4 marker:text-amber-200 sm:p-5"><span className="ml-2 inline-flex max-w-[calc(100%-2rem)] flex-wrap items-center gap-x-5 gap-y-2 align-middle"><span className="font-semibold text-white">Zamówienie #{order.id}</span><span className="text-sm text-zinc-300">{d.recipientName}</span><span className="text-sm font-semibold text-amber-100">{money(order.total)}</span><span className={`rounded-full px-3 py-1 text-xs ${paid?'bg-emerald-300/10 text-emerald-200':'bg-white/5 text-zinc-400'}`}>{paymentLabels[order.paymentStatus]||order.paymentStatus}</span><span className="text-xs text-zinc-400">{stageLabels[order.metadata.fulfillment.status]||order.metadata.fulfillment.status} · {new Date(order.createdAt).toLocaleDateString('pl-PL')}</span></span></summary>
  <div className="space-y-5 border-t border-white/10 p-4 sm:p-6">
   <div className="grid gap-5 lg:grid-cols-2"><div><h2 className="font-semibold text-white">Odbiorca i dostawa</h2><p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-zinc-300">{[d.recipientName,d.email,d.phone,d.method==='locker'?`Paczkomat ${d.pointCode||''}`:'Kurier',d.address?.street,d.address?`${d.address.postalCode} ${d.address.city}`:null].filter(Boolean).join('\n')}</p></div><div className="space-y-3 text-sm text-zinc-400"><p>Dostawa dla klienta: <span className="text-zinc-200">{money(d.amount)}</span></p>{order.metadata.fulfillment.trackingNumber&&<p className="break-all">Przesyłka: {order.metadata.fulfillment.trackingNumber}</p>}<Link href={`/admin/galleries/${order.galleryId}`} className={button}>Galeria #{order.galleryId} · etapy realizacji</Link></div></div>
   <div className="space-y-3"><h3 className="font-semibold text-white">Do przygotowania</h3>{order.metadata.lines.map((line,index)=><article key={line.id||index} className="rounded-xl border border-white/10 bg-zinc-950/40 p-4"><div className="flex flex-wrap justify-between gap-2"><h4 className="font-medium text-white">{line.kind==='print'?'Odbitka':'Produkt'} · {line.title}</h4><p className="text-sm text-amber-100">{line.quantity} szt. · {money(line.lineTotal)}</p></div>{line.kind==='print'?<p className="mt-2 text-sm leading-relaxed text-zinc-400">Zdjęcie #{line.photoId} · {line.format?.label||line.formatId} · {line.format?.paper}{line.crop?.mode==='fit'?' · cały kadr, możliwe marginesy':' · kadr dopasowany'}</p>:<div className="mt-2 space-y-1 break-words text-sm leading-relaxed text-zinc-400"><p>{line.photoIds.length} zdjęć · okładka #{line.coverPhotoId}</p><p>Kolejność zdjęć: {line.photoIds.join(', ')}</p></div>}</article>)}</div>
   {paid?<><ProductionFiles galleryId={order.galleryId} orderId={order.id}/><GalleryShipmentPanel galleryId={order.galleryId} orderId={order.id} method={d.method}/></>:<p className="rounded-xl bg-white/[0.03] p-4 text-sm text-zinc-400">Pliki do produkcji i nadanie przesyłki będą dostępne po potwierdzeniu płatności.</p>}
  </div>
 </details>;
}
function ProductionFiles({galleryId,orderId}:{galleryId:number;orderId:number}) {
 const [busy,setBusy]=useState(false),[url,setUrl]=useState(''),[error,setError]=useState('');
 const prepare=async()=>{if(busy)return;setBusy(true);setError('');setUrl('');try{const data=await request(`admin/galleries/${galleryId}/shop/orders/${orderId}/production`,{method:'POST'});if(typeof data.url!=='string'||!/^https:\/\//i.test(data.url))throw Error('Nie otrzymano poprawnego linku do plików.');setUrl(data.url);}catch(e){setError(e instanceof Error?e.message:'Nie udało się przygotować plików.');}finally{setBusy(false);}};
 return <section aria-label={`Pliki do produkcji zamówienia ${orderId}`} className="space-y-3 rounded-2xl border border-amber-200/15 bg-amber-200/[0.04] p-4"><h3 className="font-semibold text-white">Pliki dla producenta</h3><p className="max-w-3xl text-sm leading-relaxed text-zinc-300">ZIP zawiera odbitki JPG, oryginalne zdjęcia do produktów i zestawienie zamówienia. Album lub fotoksiążka wymagają przygotowania projektu i złożenia zamówienia w nPhoto.</p><div className="flex flex-wrap gap-3"><button type="button" disabled={busy} className={button} onClick={prepare}>{busy?'Przygotowywanie plików…':'Przygotuj pliki do produkcji'}</button>{url&&<a href={url} target="_blank" rel="noopener noreferrer" className={`${button} !border-amber-200/40 !bg-amber-200/10 !text-amber-100`}>Pobierz ZIP zamówienia #{orderId}</a>}</div>{url&&<p role="status" className="text-sm text-emerald-200">Pliki są gotowe do pobrania.</p>}{error&&<p role="alert" className="text-sm text-red-200">{error}</p>}</section>;
}
