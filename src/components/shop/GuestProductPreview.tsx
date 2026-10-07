'use client';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { prepareShopPhoto } from '@/lib/uploads/prepare-shop-photo';
import { defaultPublicOffer, type PublicShopOffer } from '@/lib/galleries/public-offer';
import GalleryShoppingPanel from '@/components/galleries/GalleryShoppingPanel';
import ProductGalleryPicker, { type ProductGallerySource } from './ProductGalleryPicker';
import type { PublicShopCatalog } from '@/lib/galleries/public-offer';
import { prodigiPrintQuality } from '@/lib/fulfillment/prodigi-image-size';
import PersonalizationShop from './PersonalizationShop';

type Product = PublicShopCatalog['products'][number];
type Props = { product: Product; onClose: () => void; offer?: PublicShopOffer; gallerySource?: ProductGallerySource };
const action = 'min-h-12 rounded-xl bg-stone-900 px-5 py-3 font-medium text-white disabled:opacity-50';
/** Photos stay in memory on this device until the customer explicitly enters ordering. */
export default function GuestProductPreview({ product, onClose, offer, gallerySource }: Props) {
 const copy={...defaultPublicOffer(),...offer};
 const [gallery,setGallery]=useState<ProductGallerySource|null>(gallerySource??null);const [picker,setPicker]=useState(()=>typeof window!=='undefined' && new URLSearchParams(window.location.search).get('shopSource')==='gallery');const [quantity,setQuantity]=useState(1);const [orderQuantity,setOrderQuantity]=useState(1);const [showCart,setShowCart]=useState(false);const [resumeCode,setResumeCode]=useState<string|null>(null);const commandSequence=useRef(0);const [addRequest,setAddRequest]=useState(0);const [orderFile,setOrderFile]=useState<File|null>(null);const [adding,setAdding]=useState(false);const [added,setAdded]=useState(false);
 const localInput=useRef<HTMLInputElement>(null);
 const titleId=useId(); const dialog=useRef<HTMLDivElement>(null); const trigger=useRef<HTMLElement|null>(null);
 const active=useRef(true); const generation=useRef(0); const objectUrl=useRef<string|null>(null);
 const [photo,setPhoto]=useState<{url:string;width:number;height:number;file:File|null}|null>(gallerySource ? {url:gallerySource.photo.file_url,width:gallerySource.photo.width||0,height:gallerySource.photo.height||0,file:null}:null);
 const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const [stage,setStage]=useState('');
 const [wall,setWall]=useState('warm');
 const [view,setView]=useState<'front'|'angle'|'product'>(product.personalizationPreview?.kind==='canvas' && product.personalizationPreview.edgeColor ? 'angle' : 'front');
 const model=useRef<HTMLDivElement>(null);const [modelWidth,setModelWidth]=useState(280);
 const hasPaymentReturn=()=>typeof window!=='undefined' && /^[1-9]\d*$/.test(new URLSearchParams(window.location.search).get('shopOrder') || '');
 const [,setOrdering]=useState(hasPaymentReturn);
 const [orderStarted,setOrderStarted]=useState(hasPaymentReturn);
 const savedSource=(()=>{try{const value=JSON.parse(sessionStorage.getItem(`product-cart-source:${product.id}`)||'null');return value?.kind==='guest' ? {kind:'guest' as const} : value?.kind==='gallery' && typeof value.code==='string' && /^[A-Za-z0-9_-]{1,200}$/.test(value.code) ? {kind:'gallery' as const,code:value.code} : null;}catch{return null;}})();
 const hasSavedCart=!!savedSource || !!gallery;
 function rememberCart(){try{const code=gallery?.endpoint.match(/^\/api\/galleries\/([^/]+)\/shop$/)?.[1];sessionStorage.setItem(`product-cart-source:${product.id}`,JSON.stringify(code ? {kind:'gallery',code:decodeURIComponent(code)} : {kind:'guest'}));}catch{/* Cart remains usable without storage. */}}
 function openCart(){setAddRequest(0);setOrderFile(null);if(gallery){setShowCart(true);setOrderStarted(true);}else if(savedSource?.kind==='gallery'){setResumeCode(savedSource.code);setPicker(true);}else if(savedSource?.kind==='guest'){setShowCart(true);setOrderStarted(true);}}
 useEffect(()=>{if(!added)return;const id=requestAnimationFrame(()=>document.querySelector('[aria-label="Twój koszyk"]')?.scrollIntoView({block:'start',behavior:'smooth'}));return()=>cancelAnimationFrame(id);},[added]);
 const shape=product.personalizationPreview;
 const quality=shape && photo && photo.width>0 && photo.height>0 ? prodigiPrintQuality(photo.width,photo.height,{horizontalResolution:shape.width,verticalResolution:shape.height},shape.minimumResolutionRatio) : null;
 const physicalWidth=(quality?.rotated ? shape?.physicalHeightMm : shape?.physicalWidthMm) || shape?.width || 1;const physicalHeight=(quality?.rotated ? shape?.physicalWidthMm : shape?.physicalHeightMm) || shape?.height || 1;
 const depth=shape?.depthMm && physicalWidth ? modelWidth*shape.depthMm/physicalWidth : 0;
 const edge=shape?.edgeColor==='black' ? '#181818' : '#f7f5f1';
 useEffect(()=>{if(!model.current || typeof ResizeObserver==='undefined')return;const observer=new ResizeObserver(entries=>{if(entries[0])setModelWidth(entries[0].contentRect.width);});observer.observe(model.current);return()=>observer.disconnect();},[photo]);
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
  const current=++generation.current;setAddRequest(0);setOrderFile(null);setResumeCode(null);setPicker(false);if(gallery){setOrderStarted(false);setAddRequest(0);}setGallery(null);setAdded(false);setAdding(false);setBusy(true);setError('');setStage('Przygotowanie podglądu…');
  try{
   const prepared=await prepareShopPhoto(file,{fileBytes:20*1024*1024,maxPixels:60_000_000,minDimension:1},()=>{if(active.current)setStage('Zamiana zdjęcia z iPhone’a na JPG…');});
   const bitmap=await createImageBitmap(prepared);const width=bitmap.width,height=bitmap.height;bitmap.close();
   if(!width||!height||width*height>60_000_000)throw Error('Wybierz zdjęcie do 60 megapikseli.');
   if(!active.current||current!==generation.current)return;
   const url=URL.createObjectURL(prepared);if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);objectUrl.current=url;setPhoto({url,width,height,file:prepared});
  }catch(failure){if(active.current&&current===generation.current){setPhoto(null);setError(failure instanceof Error?failure.message:'Nie udało się odczytać zdjęcia. Wybierz inne.');}}
  finally{if(active.current&&current===generation.current)setBusy(false);}
 }
 function order(){if(adding)return;setAdding(true);setAdded(false);setShowCart(false);setOrderQuantity(quantity);setOrderFile(photo?.file??null);setOrderStarted(true);setError('');setAddRequest(++commandSequence.current);const url=new URL(window.location.href);url.searchParams.set('shopCheckout','1');window.history.replaceState(window.history.state,'',url.pathname+url.search+url.hash);dialog.current?.scrollTo?.({top:0});}
 return createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-2 sm:p-6" onClick={event=>{if(event.target===event.currentTarget)onClose();}}><div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className="max-h-[95dvh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-stone-50 p-4 text-stone-900 shadow-2xl outline-none sm:p-7">
  <header className="mb-5 flex items-start justify-between gap-4"><div><h2 id={titleId} className="text-2xl font-semibold">{product.title}</h2><p className="mt-2">{new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN'}).format(product.price/100)}</p></div><button type="button" className="min-h-11 rounded-xl border border-stone-300 px-4" onClick={onClose} aria-label="Zamknij podgląd produktu">Zamknij</button></header>
  <p className="mb-4 text-stone-600">{product.description}</p><div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
   <div data-product-stage="source" className="order-1 space-y-4 md:col-start-2 md:row-start-1"><h3 className="text-xl font-semibold">{copy.productPreviewTitle}</h3><label className="block font-medium">{photo?'Zmień zdjęcie':copy.productUploadLabel}<input ref={localInput} aria-label="Zdjęcie do podglądu produktu" type="file" accept="image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic,.heif" className="mt-3 block w-full text-sm" disabled={busy||adding} onChange={event=>{const file=event.target.files?.[0];event.target.value='';if(file)void choose(file);}} /></label>

    {busy&&<p role="status">{stage}</p>}{error&&<p role="alert" className="text-red-800">{error}</p>}


    <button type="button" className="min-h-12 rounded-xl border border-stone-300 px-5" disabled={adding} onClick={()=>{setResumeCode(null);setPicker(value=>!value);}}>{copy.productGalleryLabel}</button>
    {picker&&<ProductGalleryPicker initialCode={resumeCode??undefined} onResume={source=>{setGallery(source);setPhoto({url:source.photo.file_url,width:source.photo.width||0,height:source.photo.height||0,file:null});setResumeCode(null);setPicker(false);setShowCart(true);setOrderStarted(true);}} productId={product.id} offer={copy} onClose={()=>{setResumeCode(null);setPicker(false);}} onSelect={source=>{generation.current++;setOrderStarted(false);setAddRequest(0);setGallery(source);setPhoto({url:source.photo.file_url,width:source.photo.width||0,height:source.photo.height||0,file:null});setPicker(false);setAdded(false);setAdding(false);}} />}
   </div>
   <div data-product-stage="preview" className="order-2 md:col-start-1 md:row-start-1 md:row-span-2"><div className={`flex min-h-72 items-center justify-center rounded-xl p-8 sm:min-h-96 ${wall==='dark'?'bg-stone-700':wall==='white'?'bg-white':'bg-[#e7ded1]'}`}>
    {view==='product' && product.image_url ? <img src={product.image_url} alt={`Zdjęcie produktu: ${product.title}`} className="max-h-[50dvh] w-full object-contain" /> : photo && shape ? <div ref={model} data-product-model={shape.kind} style={{width:`min(90%, 24rem, calc(45dvh * ${physicalWidth} / ${physicalHeight}))`,aspectRatio:`${physicalWidth} / ${physicalHeight}`,perspective:'1000px'}}><div className="relative h-full w-full" style={{transformStyle:'preserve-3d',transform:view==='angle'&&shape.kind==='canvas'&&!!shape.edgeColor?'rotateX(6deg) rotateY(-22deg)':'none',transition:'transform 300ms'}}>
     {shape.kind==='canvas' && depth>0 && shape.edgeColor && <><div aria-hidden="true" data-canvas-side="right" className="absolute left-full top-0 h-full" style={{width:depth,background:edge,transform:'rotateY(90deg)',transformOrigin:'left center'}} /><div aria-hidden="true" data-canvas-side="top" className="absolute left-0 top-0 w-full" style={{height:depth,background:edge,transform:'rotateX(-90deg)',transformOrigin:'center top'}} /></>}
     <div className="relative h-full w-full bg-white shadow-xl" style={{backfaceVisibility:'hidden'}}><img src={photo.url} alt={`${product.title} — Twoje zdjęcie w podglądzie`} className="h-full w-full object-contain" /></div>
    </div></div> : photo ? <img src={photo.url} alt="Twoje zdjęcie w podglądzie" className="max-h-[50dvh] w-full object-contain" /> : product.image_url ? <img src={product.image_url} alt={product.title} className="max-h-[50dvh] w-full object-contain" /> : <p className="text-center text-stone-600">Wybierz zdjęcie, aby zobaczyć je na produkcie.</p>}
   </div><label className="mt-4 block text-sm">Tło podglądu<select aria-label="Tło podglądu" className="ml-3 min-h-11 rounded-lg border border-stone-300 bg-white px-3" value={wall} onChange={event=>setWall(event.target.value)}><option value="warm">Jasna ściana</option><option value="white">Białe</option><option value="dark">Ciemne</option></select></label><div className="mt-3 flex flex-wrap gap-2" aria-label="Widok produktu">{(['front','angle','product'] as const).filter(value=>value!=='angle'||(shape?.kind==='canvas'&&!!shape.edgeColor)).filter(value=>value!=='product'||product.image_url).map(value=><button type="button" key={value} aria-pressed={view===value} className="min-h-11 rounded-lg border border-stone-300 px-3 text-sm" onClick={()=>setView(value)}>{value==='front'?'Na wprost':value==='angle'?'Z boku':'Zdjęcie produktu'}</button>)}</div><details className="mt-3 text-sm text-stone-600"><summary className="min-h-11 cursor-pointer py-3">Informacje o podglądzie</summary>    <p className="text-sm text-stone-600">{gallery ? "Korzystasz ze zdjęcia zapisanego w swojej galerii. Nie musisz przesyłać go ponownie." : "Przed dodaniem do koszyka zdjęcie pozostaje wyłącznie na Twoim urządzeniu. Możesz sprawdzić wygląd bez konta. JPG, PNG i zdjęcia HEIC z iPhone’a, do 20 MB."}</p>    <p className="text-sm text-stone-600">Symulacja pokazuje proporcje produktu i całe zdjęcie bez przycinania. Dokładny obszar druku sprawdzisz przed dodaniem do koszyka. Faktura, kolory i oświetlenie mogą się różnić. Tło nie jest częścią zamówienia.</p></details></div>
   <div data-product-stage="purchase" className="order-3 space-y-4 md:col-start-2 md:row-start-2">
    {photo&&photo.width>0&&photo.height>0&&<p className="text-sm text-stone-600">Oryginał: {photo.width} × {photo.height} px. {quality?.status==='acceptable' ? 'Zdjęcie wystarcza do druku. Większy oryginał może dać więcej szczegółów.' : quality?.status==='recommended' ? 'Zdjęcie spełnia zalecenie drukarni.' : 'Sprawdź jakość zdjęcia przed dodaniem do koszyka.'}</p>}
    <label className="block">Ilość produktów<input aria-label="Ilość produktu" disabled={adding} type="number" min="1" max="99" className="ml-3 min-h-11 w-20 rounded-lg border p-2" value={quantity} onChange={event=>setQuantity(Math.max(1,Math.min(99,Math.floor(Number(event.target.value))||1)))} /></label>
    {quality?.status==='blocked'&&<div role="status" className="rounded-xl bg-amber-50 p-4"><p>{copy.personalizationQualityMessage} Dla tego zdjęcia wybierz oryginał co najmniej {quality.sourceMinimumWidth} × {quality.sourceMinimumHeight} px lub mniejszy format.</p><button type="button" className={action} onClick={()=>localInput.current?.click()}>Wybierz inne zdjęcie</button>{copy.personalizationSessionEnabled&&<aside><h3>{copy.personalizationSessionTitle}</h3><p>{copy.personalizationSessionDescription}</p><a href={copy.personalizationSessionUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline">{copy.personalizationSessionButtonLabel}</a></aside>}</div>}
    {gallery&&(!photo?.width||!photo.height)&&<p role="alert">Nie potwierdzono wymiarów oryginału tego zdjęcia. Wybierz inne zdjęcie lub dodaj własny oryginał.</p>}
    <button type="button" className={action} disabled={busy||adding||!photo||quality?.status==='blocked'||(!!gallery&&(!photo?.width||!photo.height))} onClick={order}>{adding?'Przygotowujemy produkt…':copy.productAddToCartLabel} · {new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN'}).format(product.price*quantity/100)}</button>
    {(hasSavedCart||added)&&<button type="button" className="min-h-11 underline" disabled={adding} onClick={openCart}>Zobacz koszyk</button>}
    {copy.galleryUpsellEnabled&&!picker&&<aside className="rounded-xl border border-stone-200 p-4"><h3>{copy.galleryUpsellTitle}</h3><p>{copy.galleryUpsellDescription}</p><button type="button" className="min-h-11 underline" disabled={adding} onClick={()=>{setResumeCode(null);setPicker(true);}}>{copy.galleryUpsellButtonLabel}</button></aside>}
    {added&&<p role="status">Produkt dodany do koszyka.</p>}
   </div>
  </div>
  <div className="mt-6">{orderStarted && (gallery ? <GalleryShoppingPanel onAddError={message=>{setAdding(false);setError(message);}} initialTab={showCart?'cart':undefined} composedProduct key={gallery.endpoint} endpoint={gallery.endpoint} headers={gallery.headers} photos={gallery.photos} inline focusedProduct initialIntent={intent} preferredPhotoId={gallery.photo.id} addRequest={addRequest} requestedQuantity={orderQuantity} onAdded={()=>{rememberCart();setError('');setAdding(false);setAdded(true);setOrdering(true);}} /> : <PersonalizationShop onAddError={message=>{setAdding(false);setError(message);}} showCart={showCart} embedded directAdd initialIntent={intent} initialFile={orderFile} onFileChange={choose} addRequest={addRequest} requestedQuantity={orderQuantity} onAdded={()=>{rememberCart();setError('');setAdding(false);setAdded(true);setOrdering(true);}} onPreparationError={()=>setAdding(false)} />)}</div> </div></div>,document.body);
}
