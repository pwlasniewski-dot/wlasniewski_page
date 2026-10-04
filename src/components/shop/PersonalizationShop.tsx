'use client';
import { useEffect, useRef, useState } from 'react';
import GalleryShoppingPanel from '@/components/galleries/GalleryShoppingPanel';
import { prepareShopPhoto } from '@/lib/uploads/prepare-shop-photo';
import { parseShopIntent, replaceShopIntent, type ShopIntent } from '@/lib/galleries/shop-intent';
import { defaultPublicOffer, type PublicShopCatalog } from '@/lib/galleries/public-offer';
type Photo = { id: number; previewUrl: string; width: number; height: number };
type Session = { galleryId: number; accessCode: string; photos: Photo[]; limits: { fileBytes: number; totalBytes: number; photos: number; maxPixels: number; minDimension: number } };
const button = 'inline-flex min-h-12 items-center justify-center rounded-xl bg-stone-900 px-5 py-3 font-medium text-white disabled:opacity-40';
type Props = { embedded?: boolean; initialIntent?: ShopIntent | null; initialFile?: File | null; onFileChange?: (file: File) => Promise<void> };
export default function PersonalizationShop({ embedded = false, initialIntent, initialFile, onFileChange }: Props = {}) {
 const [catalog,setCatalog] = useState<PublicShopCatalog | null>(null); const [loaded,setLoaded] = useState(false);
 const [catalogError,setCatalogError]=useState('');const [catalogAttempt,setCatalogAttempt]=useState(0);
 const [session,setSession] = useState<Session | null>(null); const [busy,setBusy] = useState(false); const [progress,setProgress] = useState(0); const [error,setError] = useState(''); const [notice,setNotice] = useState('');
 const [stage,setStage]=useState('');
 const [qualityIssue,setQualityIssue]=useState<{width:number;height:number;requiredWidth:number;requiredHeight:number}|null>(null);const [uploadBlocked,setUploadBlocked]=useState(false);
 const fileInput=useRef<HTMLInputElement>(null);
 const autoStarted=useRef(false);const autoUploaded=useRef<File|null>(null);
 const [selection,setSelection]=useState<ShopIntent | null>(initialIntent ?? null);
 const [preferredPhotoId,setPreferredPhotoId]=useState<number | undefined>();
 useEffect(()=>{setSelection(initialIntent ?? parseShopIntent(window.location.search));},[initialIntent]);
 const lock=useRef(false); const xhr=useRef<XMLHttpRequest|null>(null); const alive=useRef(true);
 const auth = (): Record<string,string> => { const token=localStorage.getItem('client_token') || localStorage.getItem('user_token'); return token ? { Authorization: `Bearer ${token}` } : {}; };
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;xhr.current?.abort();};},[]);
 useEffect(()=>{
  const controller=new AbortController();let current=true;let timedOut=false;
  setLoaded(false);setCatalogError('');
  const timeout=setTimeout(()=>{
   if(!current)return;timedOut=true;controller.abort();
   setCatalogError('Wczytywanie oferty trwało zbyt długo. Zdjęcie i wybrany produkt pozostają zachowane. Spróbuj ponownie.');setLoaded(true);
  },15000);
  void (async()=>{
   try{
    const response=await fetch('/api/shop/catalog',{cache:'no-store',signal:controller.signal});
    if(!response.ok)throw Error('Nie udało się wczytać oferty ze sklepu. Spróbuj ponownie.');
    const data=await response.json();
    if(!data?.success || !data.catalog || typeof data.catalog!=='object' || Array.isArray(data.catalog) || !data.catalog.offer || typeof data.catalog.offer!=='object' || Array.isArray(data.catalog.offer) || !Array.isArray(data.catalog.products))throw Error('Nie udało się odczytać oferty. Spróbuj ponownie.');
    if(current && !timedOut)setCatalog(data.catalog);
   }catch(failure){
    if(current && !timedOut)setCatalogError(failure instanceof TypeError ? 'Nie udało się połączyć ze sklepem. Sprawdź połączenie i ponów wczytywanie oferty.' : failure instanceof SyntaxError ? 'Nie udało się odczytać odpowiedzi sklepu. Spróbuj ponownie.' : failure instanceof Error && failure.name!=='AbortError' ? failure.message : 'Nie udało się wczytać oferty. Spróbuj ponownie.');
   }finally{
    clearTimeout(timeout);if(current && !timedOut)setLoaded(true);
   }
  })();
  return()=>{current=false;clearTimeout(timeout);controller.abort();};
 },[catalogAttempt]);
 async function request(path:string,body?:unknown) {const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),25000);try{const response=await fetch(`/api/shop/personalization/${path}`,{signal:controller.signal,method:'POST',credentials:'include',cache:'no-store',headers:{'Content-Type':'application/json',...auth()},...(body ? {body:JSON.stringify(body)} : {})});const data=await response.json();if(!response.ok || !data.success)throw Error(data.error || 'Nie potwierdzono operacji.');return data;}finally{clearTimeout(timeout);}}
 async function start() {if(lock.current)return;lock.current=true;setBusy(true);setError('');try{setSession(await request('session'));}catch(e){setError(e instanceof Error?e.message:'Nie udało się otworzyć zdjęć.');}finally{lock.current=false;setBusy(false);}}
 async function upload(file:File) {
  if(lock.current || !session)return;setError('');setNotice('');setQualityIssue(null);setUploadBlocked(true);
  if(!file.size || file.size>session.limits.fileBytes){setError(`Maksymalny rozmiar zdjęcia to ${Math.floor(session.limits.fileBytes/1024/1024)} MB.`);return;}
  if(session.photos.length>=session.limits.photos){setError('Osiągnięto limit zdjęć.');return;}
  lock.current=true;setBusy(true);setProgress(0);setStage('Sprawdzanie zdjęcia…');
  try {
   file=await prepareShopPhoto(file,session.limits,()=>{if(alive.current)setStage('Zamiana zdjęcia z iPhone’a na JPG…');});
   if(!alive.current)return;
   setStage('Przesyłanie zdjęcia…');
   const bitmap=await createImageBitmap(file);const width=bitmap.width,height=bitmap.height; const required=catalog?.products.find(product=>selection?.kind==='product' && product.id===selection.productId)?.personalizationPreview;const printValid=!required || (width>=required.width && height>=required.height); const valid=width>=session.limits.minDimension && height>=session.limits.minDimension && width*height<=session.limits.maxPixels;bitmap.close();if(!printValid){setQualityIssue({width,height,requiredWidth:required!.width,requiredHeight:required!.height});throw Error(`Do tego produktu potrzebujesz zdjęcia o rozdzielczości co najmniej ${required!.width} × ${required!.height} px. Wybierz większy oryginał poniżej — produkt i koszyk pozostają zachowane.`);}if(!valid)throw Error('Rozdzielczość zdjęcia nie spełnia limitów. Wybierz większy oryginał lub zmniejsz bardzo duży plik.');
   const digest=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());const sha256=Array.from(new Uint8Array(digest)).map(value=>value.toString(16).padStart(2,'0')).join('');
   const ticket=await request('upload',{fileName:file.name,contentType:file.type,size:file.size,sha256});
   await new Promise<void>((resolve,reject)=>{const transfer=new XMLHttpRequest();xhr.current=transfer;transfer.open('PUT',ticket.url);transfer.timeout=120000;Object.entries(ticket.headers as Record<string,string>).forEach(([key,value])=>transfer.setRequestHeader(key,value));transfer.upload.onprogress=e=>{if(e.lengthComputable && alive.current)setProgress(Math.round(e.loaded/e.total*100));};transfer.onload=()=>transfer.status>=200 && transfer.status<300?resolve():reject(Error('Nie udało się przesłać pliku. Spróbuj ponownie.'));transfer.onerror=()=>reject(Error('Przerwano połączenie podczas wysyłania zdjęcia.'));transfer.ontimeout=()=>reject(Error('Przekroczono czas wysyłania zdjęcia.'));transfer.onabort=()=>reject(Error('Wysyłanie anulowane.'));transfer.send(file);});
   if(alive.current)setStage('Zapisywanie i sprawdzanie zdjęcia…');
   await request('complete',{uploadId:ticket.uploadId});const refreshed=await request('session');if(alive.current){setSession(refreshed);setUploadBlocked(false);setProgress(100);setPreferredPhotoId(refreshed.photos.find((photo:Photo)=>!session.photos.some(existing=>existing.id===photo.id))?.id);setNotice('Zdjęcie zapisane. Sprawdź podgląd przed dodaniem do koszyka.');}
  } catch(e){if(alive.current)setError(e instanceof Error?e.message:'Nie udało się przesłać zdjęcia.');}
  finally{lock.current=false;xhr.current=null;if(alive.current)setBusy(false);}
 }
 useEffect(()=>{const paymentReturn=/^[1-9]\d*$/.test(new URLSearchParams(window.location.search).get('shopOrder') || '');if((initialFile || paymentReturn) && loaded && catalog?.offer.personalizationEnabled && !session && !autoStarted.current){autoStarted.current=true;void start();}},[initialFile,loaded,catalog,session]);
 useEffect(()=>{if(initialFile && session && !busy && autoUploaded.current!==initialFile){autoUploaded.current=initialFile;void upload(initialFile);}},[initialFile,session,busy]);
 const offer=catalog?.offer;const copy={...defaultPublicOffer(),...offer};
 const focused=embedded && initialIntent?.kind==='product';
 const paymentReturn=typeof window!=='undefined' && new URLSearchParams(window.location.search).has('shopOrder');
 const eligibleProducts=catalog?.products.filter(product=>product.personalizationEligible) ?? [];
 const selectedProduct=selection?.kind==='product' ? eligibleProducts.find(product=>product.id===selection.productId) : null;
 const selectedFormat=selection?.kind==='print' ? catalog?.formats.find(format=>format.id===selection.formatId) : null;
 const chosenTitle=selectedProduct?.title || selectedFormat?.label;
 const Container=embedded ? 'div' : 'main';
 const Heading=embedded ? 'h2' : 'h1';
 return <Container className={embedded ? "rounded-2xl bg-stone-50 p-4 text-stone-900 sm:p-6" : "min-h-screen bg-stone-50 px-4 pb-16 pt-28 text-stone-900 sm:px-8"}><div className="mx-auto max-w-5xl space-y-6">{!embedded && <a href="/karta-podarunkowa#produkty-fotograficzne" className="underline">Wróć do oferty produktów</a>}
  {!loaded && <p role="status">Wczytywanie oferty…</p>}
  {catalogError && <div role="alert" className="space-y-3 rounded-xl bg-amber-50 p-4 text-amber-950"><p>{catalogError}</p><button type="button" className={button} onClick={()=>setCatalogAttempt(attempt=>attempt+1)}>Ponów wczytywanie oferty</button></div>}
  {loaded && !catalogError && !offer?.personalizationEnabled && <p role="status">Dodawanie własnych zdjęć jest obecnie niedostępne.</p>}
  {offer?.personalizationEnabled && !eligibleProducts.length && <p role="status">Brak produktów dostępnych do personalizacji własnym zdjęciem. Spróbuj ponownie później.</p>}
  {offer?.personalizationEnabled && eligibleProducts.length>0 && <>{!(embedded && initialIntent) && <header><Heading className="text-2xl font-semibold sm:text-3xl">{chosenTitle || offer.personalizationTitle}</Heading>{selectedProduct?.image_url && !session && <img src={selectedProduct.image_url} alt={selectedProduct.title} className="mt-4 h-40 w-full object-contain" />}<p className="mt-4 max-w-3xl text-stone-600">{offer.personalizationIntroduction}</p></header>}{embedded && initialIntent && <p className="text-sm font-semibold">Zdjęcie do druku</p>}
   {!embedded && <label className="block font-medium">Wybierz produkt<select aria-label="Produkt do personalizacji" className="mt-2 block min-h-12 w-full rounded-xl border border-stone-300 bg-white p-3" value={selectedProduct?.id ?? ''} onChange={event=>{const next:ShopIntent={kind:'product',productId:Number(event.target.value)};setSelection(next);replaceShopIntent(next);}}><option value="" disabled>Wybierz produkt</option>{eligibleProducts.map(product=><option key={product.id} value={product.id}>{product.title}</option>)}</select></label>}
   {selection && !chosenTitle && <p role="status">Wybrany produkt nie jest już dostępny do personalizacji. Wybierz inny produkt w sklepie.</p>}
   {!session && <button className={button} disabled={busy || !chosenTitle} onClick={()=>void start()}>{busy?'Wczytywanie…':offer.personalizationButtonLabel}</button>}
   {session && <section aria-label="Twoje zdjęcia do personalizacji" className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5"><label className="block font-medium">{focused ? 'Zmień zdjęcie' : 'Dodaj zdjęcie JPEG, PNG lub HEIC/HEIF'}<input ref={fileInput} aria-label="Dodaj własne zdjęcie" className="mt-3 block w-full text-sm" type="file" accept="image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic,.heif" disabled={busy} onChange={event=>{const file=event.target.files?.[0];event.target.value='';if(file){if(onFileChange){setUploadBlocked(true);void onFileChange(file);}else void upload(file);}}} /></label><p className="text-sm text-stone-600">Do {Math.floor(session.limits.fileBytes/1024/1024)} MB na plik. Zdjęcia HEIC/HEIF z iPhone’a zamieniamy automatycznie na JPG. Zdjęcia są przypisane do bieżącej sesji zamówienia. Dodawaj tylko zdjęcia, do których masz prawa.</p>{busy && <div role="status"><progress aria-label="Postęp przesyłania zdjęcia" value={progress} max="100" className="w-full" />{stage} {progress > 0 ? `${progress}%` : ''}</div>}{!focused && <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{session.photos.map(photo=><figure key={photo.id} className="rounded-xl bg-stone-100 p-2"><img src={photo.previewUrl} alt={`Twoje zdjęcie ${photo.id}`} className="aspect-square w-full object-contain" /><figcaption className="mt-2 text-xs">{photo.width} × {photo.height} px</figcaption></figure>)}</div>}</section>}
   {qualityIssue && <div role="status" className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950"><p>{copy.personalizationQualityMessage}</p><p className="text-sm">Twoje zdjęcie: {qualityIssue.width} × {qualityIssue.height} px. Do tego formatu potrzeba co najmniej {qualityIssue.requiredWidth} × {qualityIssue.requiredHeight} px.</p><button type="button" className={button} disabled={busy} onClick={()=>fileInput.current?.click()}>Wybierz inne zdjęcie</button>{copy.personalizationSessionEnabled && <aside className="border-t border-amber-200 pt-3"><h3 className="font-semibold">{copy.personalizationSessionTitle}</h3><p className="mt-2 text-sm">{copy.personalizationSessionDescription}</p><a href={copy.personalizationSessionUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center text-sm underline">{copy.personalizationSessionButtonLabel}</a></aside>}</div>}
   {session && (!focused || preferredPhotoId || paymentReturn) && <div hidden={focused && (uploadBlocked || (!!initialFile && autoUploaded.current!==initialFile))}><GalleryShoppingPanel focusedProduct={focused} initialIntent={selection ?? undefined} inline={embedded || !!selection} preferredPhotoId={preferredPhotoId} endpoint={`/api/galleries/${encodeURIComponent(session.accessCode)}/shop`} headers={auth()} photos={session.photos.map(photo=>({id:photo.id,file_url:photo.previewUrl,thumbnail_url:photo.previewUrl,width:photo.width,height:photo.height}))} /></div>}
  </>}
  {error && !qualityIssue && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}{notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">{notice}</p>}
 </div></Container>;
}
