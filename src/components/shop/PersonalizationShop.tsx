'use client';
import { useEffect, useRef, useState } from 'react';
import GalleryShoppingPanel from '@/components/galleries/GalleryShoppingPanel';
import { prepareShopPhoto } from '@/lib/uploads/prepare-shop-photo';
import type { PublicShopCatalog } from '@/lib/galleries/public-offer';
type Photo = { id: number; previewUrl: string; width: number; height: number };
type Session = { galleryId: number; accessCode: string; photos: Photo[]; limits: { fileBytes: number; totalBytes: number; photos: number; maxPixels: number; minDimension: number } };
const button = 'inline-flex min-h-12 items-center justify-center rounded-xl bg-stone-900 px-5 py-3 font-medium text-white disabled:opacity-40';
export default function PersonalizationShop() {
 const [catalog,setCatalog] = useState<PublicShopCatalog | null>(null); const [loaded,setLoaded] = useState(false);
 const [session,setSession] = useState<Session | null>(null); const [busy,setBusy] = useState(false); const [progress,setProgress] = useState(0); const [error,setError] = useState(''); const [login,setLogin] = useState(false); const [notice,setNotice] = useState('');
 const [stage,setStage]=useState('');
 const lock=useRef(false); const xhr=useRef<XMLHttpRequest|null>(null); const alive=useRef(true);
 const auth = (): Record<string,string> => { const token=localStorage.getItem('client_token') || localStorage.getItem('user_token'); return token ? { Authorization: `Bearer ${token}` } : {}; };
 useEffect(() => { alive.current=true; const controller=new AbortController(); fetch('/api/shop/catalog',{cache:'no-store',signal:controller.signal}).then(async response=>{const data=await response.json();if(!response.ok || !data.success)throw Error('Nie udało się odczytać oferty.');if(alive.current)setCatalog(data.catalog);}).catch(e=>{if(alive.current)setError(e.message);}).finally(()=>{if(alive.current)setLoaded(true);});return()=>{alive.current=false;controller.abort();xhr.current?.abort();};},[]);
 async function request(path:string,body?:unknown) {const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),25000);try{const response=await fetch(`/api/shop/personalization/${path}`,{signal:controller.signal,method:'POST',credentials:'include',cache:'no-store',headers:{'Content-Type':'application/json',...auth()},...(body ? {body:JSON.stringify(body)} : {})});const data=await response.json();if(response.status===401)setLogin(true);if(!response.ok || !data.success)throw Error(data.error || 'Nie potwierdzono operacji.');return data;}finally{clearTimeout(timeout);}}
 async function start() {if(lock.current)return;lock.current=true;setBusy(true);setError('');try{setSession(await request('session'));setLogin(false);}catch(e){setError(e instanceof Error?e.message:'Nie udało się otworzyć zdjęć.');}finally{lock.current=false;setBusy(false);}}
 async function upload(file:File) {
  if(lock.current || !session)return;setError('');setNotice('');
  if(!file.size || file.size>session.limits.fileBytes){setError(`Maksymalny rozmiar zdjęcia to ${Math.floor(session.limits.fileBytes/1024/1024)} MB.`);return;}
  if(session.photos.length>=session.limits.photos){setError('Osiągnięto limit zdjęć.');return;}
  lock.current=true;setBusy(true);setProgress(0);setStage('Sprawdzanie zdjęcia…');
  try {
   file=await prepareShopPhoto(file,session.limits,()=>{if(alive.current)setStage('Zamiana zdjęcia z iPhone’a na JPG…');});
   if(!alive.current)return;
   setStage('Przesyłanie zdjęcia…');
   const bitmap=await createImageBitmap(file); const valid=bitmap.width>=session.limits.minDimension && bitmap.height>=session.limits.minDimension && bitmap.width*bitmap.height<=session.limits.maxPixels;bitmap.close();if(!valid)throw Error('Rozdzielczość zdjęcia nie spełnia limitów. Wybierz większy oryginał lub zmniejsz bardzo duży plik.');
   const digest=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());const sha256=Array.from(new Uint8Array(digest)).map(value=>value.toString(16).padStart(2,'0')).join('');
   const ticket=await request('upload',{fileName:file.name,contentType:file.type,size:file.size,sha256});
   await new Promise<void>((resolve,reject)=>{const transfer=new XMLHttpRequest();xhr.current=transfer;transfer.open('PUT',ticket.url);transfer.timeout=120000;Object.entries(ticket.headers as Record<string,string>).forEach(([key,value])=>transfer.setRequestHeader(key,value));transfer.upload.onprogress=e=>{if(e.lengthComputable && alive.current)setProgress(Math.round(e.loaded/e.total*100));};transfer.onload=()=>transfer.status>=200 && transfer.status<300?resolve():reject(Error('Nie udało się przesłać pliku. Spróbuj ponownie.'));transfer.onerror=()=>reject(Error('Przerwano połączenie podczas wysyłania zdjęcia.'));transfer.ontimeout=()=>reject(Error('Przekroczono czas wysyłania zdjęcia.'));transfer.onabort=()=>reject(Error('Wysyłanie anulowane.'));transfer.send(file);});
   if(alive.current)setStage('Zapisywanie i sprawdzanie zdjęcia…');
   await request('complete',{uploadId:ticket.uploadId});const refreshed=await request('session');if(alive.current){setSession(refreshed);setProgress(100);setNotice('Zdjęcie zapisane. Wybierz produkt i sprawdź podgląd pola druku.');}
  } catch(e){if(alive.current)setError(e instanceof Error?e.message:'Nie udało się przesłać zdjęcia.');}
  finally{lock.current=false;xhr.current=null;if(alive.current)setBusy(false);}
 }
 const offer=catalog?.offer;
 return <main className="min-h-screen bg-stone-50 px-4 pb-16 pt-28 text-stone-900 sm:px-8"><div className="mx-auto max-w-5xl space-y-6"><a href="/karta-podarunkowa#produkty-fotograficzne" className="underline">Wróć do oferty produktów</a>
  {!loaded && <p role="status">Wczytywanie oferty…</p>}
  {loaded && catalog && !offer?.personalizationEnabled && <p role="status">Dodawanie własnych zdjęć jest obecnie niedostępne.</p>}
  {offer?.personalizationEnabled && <><header><h1 className="text-3xl font-semibold sm:text-4xl">{offer.personalizationTitle}</h1><p className="mt-4 max-w-3xl text-stone-600">{offer.personalizationIntroduction}</p></header>
   {!session && <button className={button} disabled={busy} onClick={()=>void start()}>{busy?'Wczytywanie…':offer.personalizationButtonLabel}</button>}
   {session && <section aria-label="Twoje zdjęcia do personalizacji" className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5"><label className="block font-medium">Dodaj zdjęcie JPEG, PNG lub HEIC/HEIF<input aria-label="Dodaj własne zdjęcie" className="mt-3 block w-full text-sm" type="file" accept="image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic,.heif" disabled={busy} onChange={event=>{const file=event.target.files?.[0];event.target.value='';if(file)void upload(file);}} /></label><p className="text-sm text-stone-600">Do {Math.floor(session.limits.fileBytes/1024/1024)} MB na plik. Zdjęcia HEIC/HEIF z iPhone’a zamieniamy automatycznie na JPG. Zdjęcia są przypisane do Twojego konta. Dodawaj tylko zdjęcia, do których masz prawa.</p>{busy && <div role="status"><progress aria-label="Postęp przesyłania zdjęcia" value={progress} max="100" className="w-full" />{stage} {progress > 0 ? `${progress}%` : ''}</div>}<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{session.photos.map(photo=><figure key={photo.id} className="rounded-xl bg-stone-100 p-2"><img src={photo.previewUrl} alt={`Twoje zdjęcie ${photo.id}`} className="aspect-square w-full object-contain" /><figcaption className="mt-2 text-xs">{photo.width} × {photo.height} px</figcaption></figure>)}</div></section>}
   {session && session.photos.length>0 && <GalleryShoppingPanel endpoint={`/api/galleries/${encodeURIComponent(session.accessCode)}/shop`} headers={auth()} photos={session.photos.map(photo=>({id:photo.id,file_url:photo.previewUrl,thumbnail_url:photo.previewUrl,width:photo.width,height:photo.height}))} />}
  </>}
  {login && <a href={`/logowanie?returnTo=${encodeURIComponent('/sklep/personalizacja' + (typeof window !== 'undefined' ? window.location.search : ''))}`} className={button}>Zaloguj się na swoje konto</a>}{error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}{notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">{notice}</p>}
 </div></main>;
}
