'use client';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { prepareShopPhoto } from '@/lib/uploads/prepare-shop-photo';
import type { PublicShopCatalog } from '@/lib/galleries/public-offer';
import { prodigiPrintQuality } from '@/lib/fulfillment/prodigi-image-size';
import PersonalizationShop from './PersonalizationShop';

type Product = PublicShopCatalog['products'][number];
type Props = { product: Product; onClose: () => void };
const action = 'min-h-12 rounded-xl bg-stone-900 px-5 py-3 font-medium text-white disabled:opacity-50';
/** Photos stay in memory on this device until the customer explicitly enters ordering. */
export default function GuestProductPreview({ product, onClose }: Props) {
 const titleId=useId(); const dialog=useRef<HTMLDivElement>(null); const trigger=useRef<HTMLElement|null>(null);
 const active=useRef(true); const generation=useRef(0); const objectUrl=useRef<string|null>(null);
 const [photo,setPhoto]=useState<{url:string;width:number;height:number;file:File}|null>(null);
 const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const [stage,setStage]=useState('');
 const [wall,setWall]=useState('warm');
 const [view,setView]=useState<'front'|'angle'|'product'>(product.personalizationPreview?.kind==='canvas' && product.personalizationPreview.edgeColor ? 'angle' : 'front');
 const model=useRef<HTMLDivElement>(null);const [modelWidth,setModelWidth]=useState(280);
 const hasPaymentReturn=()=>typeof window!=='undefined' && /^[1-9]\d*$/.test(new URLSearchParams(window.location.search).get('shopOrder') || '');
 const [ordering,setOrdering]=useState(hasPaymentReturn);
 const [orderStarted,setOrderStarted]=useState(hasPaymentReturn);
 const shape=product.personalizationPreview;
 const quality=shape && photo ? prodigiPrintQuality(photo.width,photo.height,{horizontalResolution:shape.width,verticalResolution:shape.height},shape.minimumResolutionRatio) : null;
 const physicalWidth=(quality?.rotated ? shape?.physicalHeightMm : shape?.physicalWidthMm) || shape?.width || 1;const physicalHeight=(quality?.rotated ? shape?.physicalWidthMm : shape?.physicalHeightMm) || shape?.height || 1;
 const depth=shape?.depthMm && physicalWidth ? modelWidth*shape.depthMm/physicalWidth : 0;
 const edge=shape?.edgeColor==='black' ? '#181818' : '#f7f5f1';
 useEffect(()=>{if(!model.current || typeof ResizeObserver==='undefined')return;const observer=new ResizeObserver(entries=>{if(entries[0])setModelWidth(entries[0].contentRect.width);});observer.observe(model.current);return()=>observer.disconnect();},[photo,ordering]);
 const intent=useMemo(()=>({kind:'product' as const,productId:product.id}),[product.id]);
 useEffect(()=>{
  active.current=true; trigger.current=document.activeElement as HTMLElement; const previous=document.body.style.overflow; document.body.style.overflow='hidden'; dialog.current?.focus();
  const key=(event:KeyboardEvent)=>{
   if(event.defaultPrevented)return;
   if(event.key==='Escape'){event.preventDefault();onClose();return;}
   if(event.key==='Tab'){
    const items=Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),[tabindex="0"]') || []).filter(item=>!item.closest('[hidden]'));
    if(!items?.length)return;const first=items[0],last=items[items.length-1];
    if(event.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current)){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
   }
  };
  document.addEventListener('keydown',key);
  return()=>{active.current=false;generation.current++;if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);objectUrl.current=null;document.body.style.overflow=previous;document.removeEventListener('keydown',key);trigger.current?.focus();};
 // The dialog lifetime is tied to product.id by its parent key.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 async function choose(file:File){
  const current=++generation.current;setBusy(true);setError('');setStage('Przygotowanie podglądu…');
  try{
   const prepared=await prepareShopPhoto(file,{fileBytes:20*1024*1024,maxPixels:60_000_000,minDimension:1},()=>{if(active.current)setStage('Zamiana zdjęcia z iPhone’a na JPG…');});
   const bitmap=await createImageBitmap(prepared);const width=bitmap.width,height=bitmap.height;bitmap.close();
   if(!width||!height||width*height>60_000_000)throw Error('Wybierz zdjęcie do 60 megapikseli.');
   if(!active.current||current!==generation.current)return;
   const url=URL.createObjectURL(prepared);if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);objectUrl.current=url;setPhoto({url,width,height,file:prepared});
  }catch(failure){if(active.current&&current===generation.current)setError(failure instanceof Error?failure.message:'Nie udało się odczytać zdjęcia. Wybierz inne.');}
  finally{if(active.current&&current===generation.current)setBusy(false);}
 }
 function order(){setOrderStarted(true);setOrdering(true);const url=new URL(window.location.href);url.searchParams.set('shopCheckout','1');window.history.replaceState(window.history.state,'',url.pathname+url.search+url.hash);dialog.current?.scrollTo?.({top:0});}
 function back(){setOrdering(false);const url=new URL(window.location.href);url.searchParams.delete('shopCheckout');window.history.replaceState(window.history.state,'',url.pathname+url.search+url.hash);}
 return createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-2 sm:p-6" onClick={event=>{if(event.target===event.currentTarget)onClose();}}><div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className="max-h-[95dvh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-stone-50 p-4 text-stone-900 shadow-2xl outline-none sm:p-7">
  <header className="mb-5 flex items-start justify-between gap-4"><div><h2 id={titleId} className="text-2xl font-semibold">{product.title}</h2><p className="mt-2">{new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN'}).format(product.price/100)}</p></div><button type="button" className="min-h-11 rounded-xl border border-stone-300 px-4" onClick={onClose} aria-label="Zamknij podgląd produktu">Zamknij</button></header>
  <div className={`grid gap-6 ${ordering ? '' : 'md:grid-cols-[1.2fr_1fr]'}`}>
   <div><div className={`flex min-h-72 items-center justify-center rounded-xl p-8 sm:min-h-96 ${wall==='dark'?'bg-stone-700':wall==='white'?'bg-white':'bg-[#e7ded1]'}`}>
    {view==='product' && product.image_url ? <img src={product.image_url} alt={`Zdjęcie produktu: ${product.title}`} className="max-h-[50dvh] w-full object-contain" /> : photo && shape ? <div ref={model} data-product-model={shape.kind} style={{width:`min(90%, 24rem, calc(45dvh * ${physicalWidth} / ${physicalHeight}))`,aspectRatio:`${physicalWidth} / ${physicalHeight}`,perspective:'1000px'}}><div className="relative h-full w-full" style={{transformStyle:'preserve-3d',transform:view==='angle'&&shape.kind==='canvas'&&!!shape.edgeColor?'rotateX(6deg) rotateY(-22deg)':'none',transition:'transform 300ms'}}>
     {shape.kind==='canvas' && depth>0 && shape.edgeColor && <><div aria-hidden="true" data-canvas-side="right" className="absolute left-full top-0 h-full" style={{width:depth,background:edge,transform:'rotateY(90deg)',transformOrigin:'left center'}} /><div aria-hidden="true" data-canvas-side="top" className="absolute left-0 top-0 w-full" style={{height:depth,background:edge,transform:'rotateX(-90deg)',transformOrigin:'center top'}} /></>}
     <div className="relative h-full w-full bg-white shadow-xl" style={{backfaceVisibility:'hidden'}}><img src={photo.url} alt={`${product.title} — Twoje zdjęcie w podglądzie`} className="h-full w-full object-contain" /></div>
    </div></div> : photo ? <img src={photo.url} alt="Twoje zdjęcie w podglądzie" className="max-h-[50dvh] w-full object-contain" /> : product.image_url ? <img src={product.image_url} alt={product.title} className="max-h-[50dvh] w-full object-contain" /> : <p className="text-center text-stone-600">Wybierz zdjęcie, aby zobaczyć je na produkcie.</p>}
   </div><label className="mt-4 block text-sm">Tło podglądu<select aria-label="Tło podglądu" className="ml-3 min-h-11 rounded-lg border border-stone-300 bg-white px-3" value={wall} onChange={event=>setWall(event.target.value)}><option value="warm">Jasna ściana</option><option value="white">Białe</option><option value="dark">Ciemne</option></select></label><div className="mt-3 flex flex-wrap gap-2" aria-label="Widok produktu">{(['front','angle','product'] as const).filter(value=>value!=='angle'||(shape?.kind==='canvas'&&!!shape.edgeColor)).filter(value=>value!=='product'||product.image_url).map(value=><button type="button" key={value} aria-pressed={view===value} className="min-h-11 rounded-lg border border-stone-300 px-3 text-sm" onClick={()=>setView(value)}>{value==='front'?'Na wprost':value==='angle'?'Z boku':'Zdjęcie produktu'}</button>)}</div></div>
   <div hidden={ordering} className="space-y-4"><label className="block font-medium">{photo?'Zmień zdjęcie do podglądu':'Dodaj zdjęcie do podglądu'}<input aria-label="Zdjęcie do podglądu produktu" type="file" accept="image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic,.heif" className="mt-3 block w-full text-sm" disabled={busy} onChange={event=>{const file=event.target.files?.[0];event.target.value='';if(file)void choose(file);}} /></label>
    <p className="text-sm text-stone-600">Przed przejściem do zamówienia zdjęcie pozostaje wyłącznie na Twoim urządzeniu. Możesz sprawdzić wygląd bez konta. JPG, PNG i zdjęcia HEIC z iPhone’a, do 20 MB.</p>
    {busy&&<p role="status">{stage}</p>}{error&&<p role="alert" className="text-red-800">{error}</p>}
    {photo&&<p className="text-sm text-stone-600">Podgląd: {photo.width} × {photo.height} px. Do zabawy wystarczy mały plik — jakość oryginału sprawdzimy przy zamówieniu.</p>}
    <p className="text-sm text-stone-600">Symulacja pokazuje proporcje produktu i całe zdjęcie bez przycinania. Dokładny obszar druku sprawdzisz przed dodaniem do koszyka. Faktura, kolory i oświetlenie mogą się różnić. Tło nie jest częścią zamówienia.</p>
    <button type="button" className={action} disabled={busy||!photo} onClick={order}>Przejdź do zamówienia</button>
   </div>
  </div>
  <div hidden={!ordering} className="mt-6">{photo && <p className="mb-3 text-sm text-stone-600">Orientacja produktu: {physicalWidth>physicalHeight ? 'pozioma' : physicalWidth<physicalHeight ? 'pionowa' : 'kwadratowa'}. Całe zdjęcie pozostaje widoczne.</p>}{busy && <p role="status">{stage}</p>}{error && <p role="alert" className="mb-4 text-red-800">{error}</p>}<button type="button" className="mb-4 min-h-11 underline" onClick={back}>Wróć do podglądu</button><p className="mb-4 text-sm text-stone-600">Twoje zdjęcie jest zachowane. Sprawdzamy jakość do druku i przygotowujemy zamówienie bez zakładania konta.</p>{orderStarted && <PersonalizationShop embedded initialIntent={intent} initialFile={ordering ? photo?.file : null} onFileChange={choose} />}</div> </div></div>,document.body);
}
